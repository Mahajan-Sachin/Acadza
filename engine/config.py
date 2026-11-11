import os
from pathlib import Path

# Try to find .env file in current or parent directories
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
WORKSPACE_ROOT = PROJECT_ROOT.parent

def load_env():
    env_paths = [
        WORKSPACE_ROOT / '.env',
        PROJECT_ROOT / '.env',
        BASE_DIR / '.env',
        Path('.env')
    ]
    for p in env_paths:
        if p.exists():
            with open(p, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if '=' in line and not line.startswith('#'):
                        k, v = line.split('=', 1)
                        os.environ.setdefault(k.strip(), v.strip())
            break

load_env()

GROQ_API_KEY_1 = os.environ.get('groq_api_key_1', '')
GROQ_API_KEY_2 = os.environ.get('groq_api_key_2', '')
PRIMARY_MODEL = os.environ.get('GROQ_PRIMARY_MODEL', 'openai/gpt-oss-120b')
FALLBACK_MODEL = os.environ.get('GROQ_FALLBACK_MODEL', 'openai/gpt-oss-20b')
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

