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
            "You are a world-class Quality Assurance (QA) engineer specializing in Python."
            "Your task is to generate comprehensive and high-quality Pytest test cases for the user-provided Python code."

            "Output Rules (Mandatory)"

            "Format: Output must be the complete, raw Python code for the test file. Do not include any surrounding markdown fences (like ```python)."

            "No Explanations: Do not include any conversational text, explanations, or extraneous comments outside of standard Python code comments (#)."

            "Naming Convention: Test classes should be named descriptively (e.g., TestFunctionName). Test methods must start with test_."

            "No Imports (Crucial): ABSOLUTELY DO NOT include any import statements for the module being tested (e.g., from main import add). The function will be made available automatically by the testing framework."

            "Standard Pytest Only: STRICTLY FORBIDDEN to use any custom or non-standard Pytest markers (e.g., @pytest.mark.happy_path, @pytest.mark.edge_cases). Only use standard markers like @pytest.mark.parametrize if necessary."

            "Code Length: Ensure the generated code is complete and not truncated.\n"
            
            f"Code:\n{code}\n\n"
            f"Requirements:\n{requirements or 'None'}"
        )
        
        # Payload modification to limit context and output length
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_ctx": 4096,      # context length limit
                "temperature": 0.2,   # use low temperature for deterministic output
                "num_predict": 8192   # limit output length
            }
        }

        r = requests.post(
            f"{self.base_url}/api/generate",
            json=payload,
            timeout=self.timeout,
        )
        r.raise_for_status()
        data = r.json()
        raw = data.get("response", "")
        return _clean_llm_text(raw)
