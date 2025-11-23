// src/hooks/usePyRunner.ts
"use client";

import { useState, useEffect, useRef } from "react";
import { loadPyodide, PyodideInterface } from "pyodide";

export function usePyRunner() {
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const py = await loadPyodide({
          indexURL: "/pyodide/",
        });

        await py.loadPackage([
          "pytest",
          "iniconfig",
          "pluggy",
          "attrs",
          "six",
        ]);

        setPyodide(py);
        setIsReady(true);
      } catch (err) {
        console.error("Pyodide init failed:", err);
      }
    };

    init();
  }, []);

  // write file to Pyodide FS
  const writeFileToFS = (path: string, content: string) => {
    if (!pyodide) return;

    try {
      const dir = path.substring(0, path.lastIndexOf("/"));
      if (dir) {
        try {
          pyodide.FS.mkdirTree(dir);
        } catch {}
      }
      pyodide.FS.writeFile(path, content);
    } catch (err) {
      console.error("Failed to write file:", err);
    }
  };

  // run Python
  const runPython = async (code: string): Promise<string> => {
  if (!pyodide) return "⏳ Pyodide not ready.";

  try {
    pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = sys.stdout
    `);

    await pyodide.runPythonAsync(code);
    const result = pyodide.runPython("sys.stdout.getvalue()");
    return result || "✅ Executed successfully (no output)";
  } catch (err: any) {
    return `❌ Error: ${err.message}`;
  }
};


  // run pytest
  const runPytest = async (
    sourceCode: string,
    testCode: string
  ): Promise<string> => {
    if (!pyodide) return "⏳ Pyodide not ready.";

    try {
      writeFileToFS("main.py", sourceCode);
      writeFileToFS("tests/test_main.py", `from main import *\n${testCode}`);

      pyodide.runPython(`
import sys, os, shutil
from io import StringIO

# clear previous pytest cache
shutil.rmtree('/.pytest_cache', ignore_errors=True)

# reset stdout
sys.stdout = StringIO()
sys.stderr = sys.stdout

# reload modules so old test code does not persist
import sys
mods_to_clear = [m for m in sys.modules if m.startswith("test_") or m == "main"]
for m in mods_to_clear:
    del sys.modules[m]

import pytest
os.chdir("/")  

try:
    pytest.main(["/tests", "-q"])
except SystemExit:
    pass
`)

      return pyodide.runPython("sys.stdout.getvalue()");

    } catch (err: any) {
      return `❌ Pytest Error: ${err.message}`;
    }
  };

  // Hook return MUST always return everything
  return {
    isReady,
    runPython,
    runPytest,
  };
}
