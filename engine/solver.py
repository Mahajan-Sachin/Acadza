import re
import json
from .llm_client import GroqLLMClient

def clean_html(raw_html: str) -> str:
    if not raw_html:
        return ""
    clean = re.sub(r'<[^>]+>', ' ', raw_html)
    clean = re.sub(r'&#x[0-9a-fA-F]+;', ' ', clean)
    clean = re.sub(r'&[a-zA-Z]+;', ' ', clean)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean

class DoubleBlindSolver:
    def __init__(self, llm_client: GroqLLMClient):
        self.client = llm_client

    def solve_blindly(self, question_html: str, question_type: str, subject: str, chapter: str) -> dict:
        """
        Solves the question completely blindly without knowing student comment or stored answer.
        This neutralizes sycophancy and bias.
        """
        prompt = f"""You are an elite, world-class JEE Advanced and NEET Subject Matter Expert in {subject} ({chapter}).
Solve the following {question_type} question strictly from first principles.

QUESTION (Raw HTML / MathML):
{question_html}

INSTRUCTIONS:
1. Perform step-by-step derivation.
2. If this is an SCQ or MCQ with options (A), (B), (C), (D), identify which option letter(s) match the solution.
3. If this is an integer/numerical question, compute the exact final numerical value.
4. If there is a fatal defect in the question (e.g. data missing, diagram missing, figure reference broken, only 3 options provided), state clearly: "FATAL_DEFECT: <reason>".

Respond in JSON format:
{{
  "solution_steps": "<concise 2-3 sentence mathematical steps>",
  "final_answer": "<Option letter like A/B/C/D or numeric value>",
  "has_fatal_defect": false,
  "defect_type": null
}}
"""
        messages = [
            {"role": "system", "content": "You are a precise STEM problem solver. Always return valid JSON."},
            {"role": "user", "content": prompt}
        ]

        try:
            res = self.client.chat_completion(messages, temperature=0.0)
            content = res.get('content', '')
            # Extract JSON block if wrapped in markdown
            match = re.search(r'\{.*\}', content, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            return {
                "solution_steps": res.get('reasoning', ''),
                "final_answer": content.strip(),
                "has_fatal_defect": False,
                "defect_type": None
            }
        except Exception as e:
            return {
                "solution_steps": f"Solver fallback: {e}",
                "final_answer": None,
                "has_fatal_defect": False,
                "defect_type": None
            }

