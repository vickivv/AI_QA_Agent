from pathlib import Path
import hashlib
import os
import textwrap
import subprocess
import requests
import re

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---- Config ----
MODEL_API_BASE = os.getenv("MODEL_API_BASE", "http://localhost:11434")
OLLAMA_MODEL   = os.getenv("OLLAMA_MODEL", "deepseek-coder:6.7b")

TESTS_DIR = Path("tests/generated")
TESTS_DIR.mkdir(parents=True, exist_ok=True)

# ---- FastAPI ----
app = FastAPI(title="AI QA Agent – Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Schemas ----
class GenerateReq(BaseModel):
    code: str
    filename: str | None = None
    run_pytest: bool = False

class GenerateResp(BaseModel):
    written_to: str
    pytest_returncode: int | None = None
    pytest_stdout: str | None = None
    pytest_stderr: str | None = None

# ---- Prompt ----
PROMPT_TEMPLATE = textwrap.dedent("""
You are a test generator that outputs ONLY valid Python for pytest.

HARD RULES:
- Output must be a runnable .py file for pytest.
- No explanations, no comments, no markdown, no backticks.
- Begin with a Python statement (e.g., import pytest).
- Define tests as functions named test_* only.
- Do NOT import from placeholder modules like 'my_module' or 'your_module'.
- Assume the code under test is already present in the SAME file above your tests.

Code under test:
{code}
""").strip()

# ---- Helpers ----
def _ollama_generate(prompt: str) -> str:
    try:
        r = requests.post(
            f"{MODEL_API_BASE}/api/generate",
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=120,
        )
        r.raise_for_status()
        data = r.json()
        if "response" not in data:
            raise HTTPException(
                status_code=502,
                detail=f"Unexpected LLM JSON (missing 'response'): {list(data.keys())}",
            )
        return data["response"]
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"LLM request failed: {e}")

def _tests_filename(code: str, hint: str | None) -> Path:
    h = hashlib.sha1(code.encode("utf-8")).hexdigest()[:8]
    base = hint if hint else f"test_gen_{h}.py"
    if not base.endswith(".py"):
        base += ".py"
    return TESTS_DIR / base

_BAD_IMPORT_RE = re.compile(
    r'^\s*(?:from\s+(my_module|your_module)\s+import\b|import\s+(my_module|your_module)\b).*'
)

def _sanitize_generated_tests(src: str) -> str:
    # strip code fences if present
    if "```" in src:
        parts = [p for p in src.split("```") if p.strip()]
        src = parts[-1].strip()

    lines_out = []
    for raw in src.splitlines():
        line = raw.rstrip()
        # drop placeholder imports
        if _BAD_IMPORT_RE.match(line):
            continue
        # drop obvious English narration lines
        if line.lstrip().startswith((
            "Here is", "Sure", "Assume", "Please note", "The following",
            "Write", "Test cases", "Use pytest", "To run"
        )):
            continue
        lines_out.append(line)

    cleaned = "\n".join(lines_out).strip()

    # ensure we start at a python statement
    start_re = re.compile(r'^\s*(import|from|def|class|@|if |for |while |try:|with |pytest|test_)')
    parts = cleaned.splitlines()
    for i, l in enumerate(parts):
        if start_re.match(l):
            cleaned = "\n".join(parts[i:])
            break

    # guarantee pytest import
    if "import pytest" not in cleaned:
        cleaned = "import pytest\n" + cleaned

    return cleaned.strip()

def _assert_compiles(py_src: str, filename_hint: str = "generated_test.py") -> None:
    try:
        compile(py_src, filename_hint, "exec")
    except SyntaxError as e:
        snippet = "\n".join(py_src.splitlines()[:8])
        raise HTTPException(
            status_code=502,
            detail=f"Generated tests are not valid Python: {e.msg} at line {e.lineno}.\n{snippet}"
        )

# ---- Routes ----
@app.get("/health")
def health():
    try:
        r = requests.get(f"{MODEL_API_BASE}/api/tags", timeout=5)
        ok = r.ok
    except Exception:
        ok = False
    return {
        "status": "ok",
        "model": OLLAMA_MODEL,
        "model_api_base": MODEL_API_BASE,
        "ollama_available": ok,
    }

@app.post("/generate-tests", response_model=GenerateResp)
def generate_tests(req: GenerateReq):
    prompt = PROMPT_TEMPLATE.format(code=req.code)
    test_code = _ollama_generate(prompt)
    test_code = _sanitize_generated_tests(test_code)
    _assert_compiles(test_code, req.filename or "generated_test.py")

    # write user's code + tests into one file so imports aren't needed
    path = _tests_filename(req.code, req.filename)
    combined = f"{req.code.rstrip()}\n\n{test_code}\n"
    path.write_text(combined, encoding="utf-8")

    result: dict = {"written_to": str(path)}

    if req.run_pytest:
        try:
            proc = subprocess.run(
                ["pytest", "-q", str(path)],
                capture_output=True, text=True, timeout=180
            )
            result["pytest_returncode"] = proc.returncode
            result["pytest_stdout"] = proc.stdout[-2000:]
            result["pytest_stderr"] = proc.stderr[-2000:]
        except subprocess.TimeoutExpired:
            result["pytest_returncode"] = 124
            result["pytest_stdout"] = ""
            result["pytest_stderr"] = "pytest timed out"

    return result
