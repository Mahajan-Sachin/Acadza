import json
import time
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from .config import GROQ_API_KEY_1, GROQ_API_KEY_2, PRIMARY_MODEL, FALLBACK_MODEL, REDIS_URL

class GroqLLMClient:
    """
    High-performance Groq LLM client with:
    1. Clean in-memory dictionary caching (with optional Redis support)
    2. Dynamic dual-key failover (Key 1 -> Key 2 on rate limit 429)
    3. Browser User-Agent header to avoid Cloudflare 1010 block
    """
    def __init__(self, cache_enabled: bool = True, use_redis: bool = False):
        self.keys = [k for k in [GROQ_API_KEY_1, GROQ_API_KEY_2] if k]
        self.current_key_idx = 0
        self.cache_enabled = cache_enabled
        self.endpoint = "https://api.groq.com/openai/v1/chat/completions"
        
        # Clean In-Memory Dictionary Cache
        self._memory_cache: Dict[str, Dict[str, Any]] = {}
        
        # Optional Redis Cache for distributed horizontal scaling
        self.redis_client = None
        if use_redis:
            try:
                import redis
                self.redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
                self.redis_client.ping()
                print("[GroqLLMClient] Connected to Redis Cache.")
            except Exception:
                self.redis_client = None

    def _get_cache_key(self, model: str, messages: list, temperature: float) -> str:
        return f"{model}:{temperature}:{json.dumps(messages, sort_keys=True)}"

    def chat_completion(
        self,
        messages: list,
        model: str = PRIMARY_MODEL,
        temperature: float = 0.0,
        max_tokens: int = 2048
    ) -> dict:
        cache_key = self._get_cache_key(model, messages, temperature)

        # 1. Check in-memory dict cache
        if self.cache_enabled:
            if cache_key in self._memory_cache:
                return self._memory_cache[cache_key]
            
            # Check Redis if enabled
            if self.redis_client:
                cached = self.redis_client.get(cache_key)
                if cached:
                    val = json.loads(cached)
                    self._memory_cache[cache_key] = val
                    return val

        if not self.keys:
            raise ValueError("No Groq API keys configured! Please set groq_api_key_1 in .env")

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        attempts = 0
        max_attempts = len(self.keys) * 2

        while attempts < max_attempts:
            active_key = self.keys[self.current_key_idx]
            req = urllib.request.Request(
                self.endpoint,
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    "Authorization": f"Bearer {active_key}",
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                }
            )

            try:
                with urllib.request.urlopen(req, timeout=45) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                    choice = data['choices'][0]['message']
                    result = {
                        "content": choice.get('content', '').strip(),
                        "reasoning": choice.get('reasoning', ''),
                        "model": model,
                        "key_used": self.current_key_idx
                    }
                    
                    # Store in memory dict cache
                    if self.cache_enabled:
                        self._memory_cache[cache_key] = result
                        if self.redis_client:
                            self.redis_client.setex(cache_key, 86400, json.dumps(result))

                    return result

            except urllib.error.HTTPError as e:
                status = e.code
                error_body = e.read().decode('utf-8', errors='ignore')
                print(f"[GroqLLMClient] HTTP {status} on key {self.current_key_idx}: {error_body[:80]}")
                
                # Switch key on 429 (rate limit) or 401/403
                if status in [429, 401, 403]:
                    self.current_key_idx = (self.current_key_idx + 1) % len(self.keys)
                    time.sleep(1)
                elif status >= 500:
                    time.sleep(2)
                else:
                    if payload["model"] == PRIMARY_MODEL and FALLBACK_MODEL:
                        print(f"[GroqLLMClient] Switching to fallback model: {FALLBACK_MODEL}")
                        payload["model"] = FALLBACK_MODEL
                    time.sleep(1)

            except Exception as e:
                print(f"[GroqLLMClient] Connection error: {e}")
                self.current_key_idx = (self.current_key_idx + 1) % len(self.keys)
                time.sleep(1)

            attempts += 1

        raise RuntimeError("Failed to complete LLM call after multiple retries across all keys.")
