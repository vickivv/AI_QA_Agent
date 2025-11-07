import requests
import re
from typing import Optional

_CODE_FENCE = re.compile(r"```(?:python)?\n(.*?)```", re.DOTALL)
_BAD_LEADING = (
    "Here is", "Sure", "Assume", "Please note", "The following",
    "Write", "Test cases", "Use pytest", "To run"
)

def _extract_code_block(text: str) -> str:
    m = _CODE_FENCE.search(text)
    return m.group(1).strip() if m else text.strip()

def _clean_llm_text(raw: str) -> str:
    # strip code fences + obvious narration lines (keep imports/defs/tests)
    cleaned = _extract_code_block(raw)
    lines = []
    for line in cleaned.splitlines():
        l = line.rstrip()
        if any(l.lstrip().startswith(pfx) for pfx in _BAD_LEADING):
            continue
        lines.append(l)
    return "\n".join(lines).strip()

class QATestAgent:
    """
    Thin wrapper around the LLM. Returns raw pytest code (string),
    leaving final sanitization/validation to the FastAPI layer.
    """
    def __init__(self, base_url: str, model: str, timeout: int = 120):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout

    def generate_tests(self, code: str, requirements: Optional[str] = None) -> str:
        prompt = (
            "You are a QA code generation model. "
            "Write comprehensive Pytest test cases (positive, negative, and edge) "
            "for the given Python code below. "
            "If additional requirements are provided, incorporate them into the tests. "
            "Output only the valid Python test code — do not include explanations, comments, or extra text.\n\n"
            f"Code:\n{code}\n\n"
            f"Requirements:\n{requirements or 'None'}"
        )
        r = requests.post(
            f"{self.base_url}/api/generate",
            json={"model": self.model, "prompt": prompt, "stream": False},
            timeout=self.timeout,
        )
        r.raise_for_status()
        data = r.json()
        raw = data.get("response", "")
        return _clean_llm_text(raw)
