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
            "You are a world-class Python QA engineer. "
            "Your task is to generate high-quality, deterministic Pytest test cases for the user-provided code. "

            # === FEW-SHOT EXAMPLE  ===
            "Follow EXACTLY the following style and structure:\n"
            "-----------------------\n"
            "Example Format:\n"
            "import pytest\n\n"
            "class TestAdd:\n"
            "    def test_add_positive_numbers(self):\n"
            "        assert add(2, 3) == 5\n\n"
            "    other test methods...\n"
            "class TestMinus:\n"
            "    def test_minus_positive_numbers(self):\n"
            "        assert minus(5, 2) == 3\n"
            "    other test methods...\n"
            "-----------------------\n\n"

            # === SCOPE RULES (CRITICAL) ===
            "Scope Restriction (MANDATORY):\n"
            "- You MUST generate tests ONLY for functions that appear in the user-provided code snippet.\n"
            "- If the snippet contains only one function, generate tests ONLY for that function.\n"
            "- DO NOT generate tests for functions not present in the snippet.\n"
            "- DO NOT infer, guess, hallucinate, or assume additional functions.\n\n"

            # === OUTPUT RULES ===
            "Output Rules (MANDATORY):\n"
            "- Output MUST be complete Python test code only. NO markdown fences.\n"
            "- NO explanations, NO natural language, NO comments except Python (#) comments.\n"
            "- Tests MUST be grouped into classes. One class per function.\n"
            "- Each class name must be descriptive (e.g., TestAdd).\n"
            "- Each test method must start with test_.\n"
            "- ABSOLUTELY DO NOT import the module under test (framework injects it).\n"
            "- DO NOT generate any import for the functions being tested.\n"
            "- Only import pytest if needed: `import pytest`.\n"
            "- STRICTLY FORBIDDEN: @pytest.mark.parametrize OR ANY other pytest markers.\n"
            "- Use simple assert statements only.\n"
            "- Use deterministic numeric inputs: positive, negative, zero, mixed-sign.\n"
            "- NEVER duplicate code; keep output clean and minimal.\n\n"

            # === GENERATION TARGET ===
            "Generate tests for this code:\n"
            "-----------------------\n"
            f"{code}\n"
            "-----------------------\n\n"

            f"Additional Requirements:\n{requirements or 'None'}\n"
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
