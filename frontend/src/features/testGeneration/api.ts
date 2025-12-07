// src/logic/api.ts

export async function callGenerateTestAPI(code: string, selectedFile: string) {
  const API_URL = "http://localhost:8000/generate-tests";

  const payload = {
    code,
    filename: selectedFile.split("/").pop(),
    requirements: "Cover edge cases and happy paths",
    run_pytest: false,
  };

  const resp = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.detail || "Test generation failed");
  }

  return resp.json();
}
