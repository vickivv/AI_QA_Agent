"use client";

import { useState, useEffect } from "react";
import { loadPyodide, PyodideInterface } from "pyodide";

// Normalize path to ensure it starts with /
function normalizePath(path: string) {
  if (!path.startsWith("/")) return "/" + path;
  return path;
}

export function usePyRunner() {
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [isReady, setIsReady] = useState(false);

  // ----------- Init Pyodide -----------
  useEffect(() => {
    const init = async () => {
      try {
        const py = await loadPyodide({
          indexURL: "/pyodide/",
        });

        await py.loadPackage(["pytest", "iniconfig", "pluggy", "attrs", "six"]);

        setPyodide(py);
        setIsReady(true);
      } catch (err) {
        console.error("Pyodide init failed:", err);
      }
    };

    init();
  }, []);

  // Write file to Pyodide FS
  const writeFileToFS = (path: string, content: string) => {
    if (!pyodide) return;

    try {
      path = normalizePath(path); 

      const folder = path.substring(0, path.lastIndexOf("/"));
      if (folder) {
        pyodide.FS.mkdirTree(folder);

        // Add __init__.py to make it a package
        const initPath = `${folder}/__init__.py`;
        if (!pyodide.FS.analyzePath(initPath).exists) {
          pyodide.FS.writeFile(initPath, "");
        }
      }

      pyodide.FS.writeFile(path, content);
    } catch (e) {
      console.error("FS write error:", e);
    }
  };

  // Run Python
  const runPython = async (selectedPath: string, code: string) => {
  if (!pyodide) return "⏳ Pyodide not ready.";

  try {
    // normalize to absolute path
    if (!selectedPath.startsWith("/")) {
      selectedPath = "/" + selectedPath;
    }

    // write code to FS
    writeFileToFS(selectedPath, code);

    // Ensure /src and /src/__init__.py exist
    pyodide.FS.mkdirTree("/src");
    if (!pyodide.FS.analyzePath("/src/__init__.py").exists) {
      pyodide.FS.writeFile("/src/__init__.py", "");
    }

    // make sure / is in sys.path
    pyodide.runPython(`
import sys
if "/" not in sys.path:
    sys.path.insert(0, "/")       # PYTHONPATH
if "/src" not in sys.path:
    sys.path.insert(0, "/src")    
`);

    // catch stdout and stderr
    pyodide.runPython(`
from io import StringIO
import sys
sys.stdout = StringIO()
sys.stderr = sys.stdout
    `);

    // run the code
    await pyodide.runPythonAsync(`
import runpy
runpy.run_path("${selectedPath}")
`);

    return pyodide.runPython("sys.stdout.getvalue()") || "✅ No output";
  } catch (err: any) {
    const dbg = pyodide.runPython("sys.stdout.getvalue()") || "";
    return "❌ Error:\n" + dbg;
  }
};

  // Run Pytest (tests/)
  const runPytest = async (files: Record<string, string>) => {
  if (!pyodide) return "⏳ Pyodide not ready.";

  try {
    pyodide.runPython(`
import sys, shutil, os

# 1) clean caches
shutil.rmtree('/.pytest_cache', ignore_errors=True)
shutil.rmtree('/tests/__pycache__', ignore_errors=True)
shutil.rmtree('/src/__pycache__', ignore_errors=True)

# 2) clear sys.modules
mods = [m for m in sys.modules if m.startswith("tests.")
                                   or m.startswith("src.")
                                   or m.startswith("test_")
                                   or m.startswith("cal")
                                   or m.startswith("main")]
for m in mods:
    del sys.modules[m]
`);

    // write all files to FS
    Object.entries(files).forEach(([path, content]) => {
      writeFileToFS(path, content);
    });

    // run pytest
    pyodide.runPython(`
      import sys, os
      from io import StringIO
      sys.stdout = StringIO()
      sys.stderr = sys.stdout
      os.chdir("/")
      import pytest
      try:
          pytest.main(["--rootdir=/", "/tests", "-v"])
      except SystemExit:
          pass
      `);

    return pyodide.runPython("sys.stdout.getvalue()");
  } catch (err: any) {
    return "❌ Pytest Error: " + err.message;
  }
};

  return {
    isReady,
    runPython,
    runPytest,
  };
}
