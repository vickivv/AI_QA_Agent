import requests
import re

def extract_python_code(text):
    match = re.search(r"```(?:python)?\n(.*?)```", text, re.DOTALL)
    return match.group(1).strip() if match else ""

def generate_tests(code, requirements=None):
    response = requests.post(
        'http://localhost:11434/api/generate',
        json={
            "model": "deepseek-coder:6.7b",
            "prompt": (
                "You are a QA code generation model. "
                "Write comprehensive Pytest test cases (positive, negative, and edge) "
                "for the given Python code below. "
                "If additional requirements are provided, incorporate them into the tests. "
                "Output only the valid Python test code — do not include explanations, comments, or extra text.\n\n"
                f"Code:\n{code}\n\n"
                f"Requirements:\n{requirements or 'None'}"
            ),
            "stream": False
        }
    )
    return response.json()['response']


code = "def add(a, b):\n    return a + b"
tests = generate_tests(code)
print(tests)
print(extract_python_code(tests))
# Use it
