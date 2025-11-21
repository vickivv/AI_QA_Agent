"use client";

import React, { useState, useRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { RefreshCw } from "lucide-react";
import { loadPyodide, PyodideInterface } from "pyodide";

import FileExplorer from "./FileExplorer";
import TopBar from "./TopBar";

interface GenerateReq {
  code: string;
  filename?: string;
  requirements?: string;
  run_pytest?: boolean;
}

interface GenerateResp {
  status: string; 
  generated_code: string; // test code string
  filename_suggestion: string; // "test_main.py"
}

const AITestGenIDE: React.FC = () => {
   // current file（full path）
  const [selectedFile, setSelectedFile] = useState("src/main.py");

  // file contents of opened files
  const [fileContents, setFileContents] = useState<Record<string, string>>({
    "src/main.py": "",
    "tests/test_main.py": "",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState("");

  // monaco editor reference
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  // pyodide instance
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);

  useEffect(() => {
    const initPy = async () => {
      const py = await loadPyodide({
          indexURL: "/pyodide/", 
      });
      
      await py.loadPackage([
          "pytest", 
          "iniconfig", 
          "pluggy", 
          "attrs", 
          "six"   
      ]);
      
      setPyodide(py);
    };
    initPy();
  }, []);

  // Editor mount
  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  // Editor content change
  const handleEditorChange = (value?: string) => {
    setFileContents((prev) => ({
      ...prev,
      [selectedFile]: value ?? "",
    }));
  };

  // Handle file creation from Explorer
  const handleCreateFile = (path: string) => {
    setFileContents((prev) => {
      if (prev[path] !== undefined) return prev; 
      return {
        ...prev,
        [path]: "",
      };
    });
  };

  // Handle file selection from Explorer
  const handleSelectFile = (path: string) => {
    setSelectedFile(path);

    // Create empty content if not exists
    setFileContents((prev) => {
      if (prev[path] !== undefined) return prev;
      return {
        ...prev,
        [path]: "",
      };
    });
  };

  const handleFolderRename = (oldPath: string, newPath: string) => {
    setFileContents(prev => {
      const updated: Record<string, string> = {};

      for (const [path, content] of Object.entries(prev)) {
        if (path.startsWith(oldPath + "/")) {
          updated[path.replace(oldPath, newPath)] = content;
        } else {
          updated[path] = content;
        }
      }

      return updated;
    });

    if (selectedFile.startsWith(oldPath + "/")) {
      setSelectedFile(selectedFile.replace(oldPath, newPath));
    }
  };


  // Show Generate Test button only for Python files
  const showGenerateTest =
    selectedFile.endsWith(".py");

  
  // Get selected text or full code
  const getSelectedOrFullCode = (): string => {
    const editor = editorRef.current;
    if (!editor) return fileContents[selectedFile] || "";

    const model = editor.getModel();
    const selection = editor.getSelection();

    if (model && selection && !selection.isEmpty()) {
      // if there is a selection, get the selected text
      return model.getValueInRange(selection);
    }
    
    // if no selection, return full code
    return model?.getValue() || "";
  };

  // Handle test generation
  const handleGenerateTest = async () => {
    const codeToTest = getSelectedOrFullCode();

    if (!codeToTest.trim()) {
      setOutput("⚠️ Please select some code or open a file with content.");
      return;
    }

    setIsGenerating(true);
    setOutput("🔄 Sending code to AI agent for test generation...");

    try {
      // Call backend API
      const API_URL = "http://localhost:8000/generate-tests"; 

      const payload: GenerateReq = {
        code: codeToTest,
        filename: selectedFile.split("/").pop(), // file name only
        requirements: "Cover edge cases and happy paths", // optional requirements
        run_pytest: false, // whether to run pytest after generation
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Request failed");
      }

      const result: GenerateResp = await response.json();
      const targetPath = `tests/${result.filename_suggestion}`;
      const newTestCode = result.generated_code;

      // update file contents with generated test code
      setFileContents((prev) => ({
        ...prev,
        [targetPath]: newTestCode,
      }));

      // Switch to the new test file tab
      setSelectedFile(targetPath); 

      // Update output console
      let logOutput = `✅ Tests generated successfully!\n`;
      logOutput += `Test code has been written to the editor for file: ${targetPath}`;
      
      setOutput(logOutput);

    } catch (error: any) {
      console.error("Generation failed:", error);
      setOutput(`❌ Error generating tests: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Execute pytest within Pyodide and capture output
  const handleRunTests = async () => {
    if (!pyodide) {
      setOutput("⏳ Initializing Python runtime...");
      return;
    }

    // write current files to Pyodide VFS
    const srcCode = fileContents["src/main.py"] || "";
    const testCode = fileContents["tests/test_main.py"] || "";
    
    if (!srcCode.trim()) {
        setOutput("⚠️ Source code (src/main.py) is empty. Cannot run tests.");
        return;
    }
    const fixedTestCode = `from main import *\n${testCode}`;
    // Create tests directories if not exist
    try {
        pyodide.FS.mkdir("/tests");
    } catch (e) {
        // ignore if already exists
    }

    // write files to Pyodide FS
    pyodide.FS.writeFile("main.py", srcCode);
    pyodide.FS.writeFile("/tests/test_main.py", fixedTestCode);

    // run pytest
    try {
      pyodide.runPython(`
        import sys
        from io import StringIO
        import os

        sys.path.append(os.getcwd())

        # Capture output
        sys.stdout = StringIO()
        sys.stderr = sys.stdout

        # Execute pytest
        import pytest
        os.chdir('/') 

        pytest_args = ["/tests"] 

        try:
            pytest.main(pytest_args) 
        except SystemExit:
            pass 

        # Get the captured output
        print(f"--- Pytest Result ---\\n")
      `);

      // get output
      const result = pyodide.runPython("sys.stdout.getvalue()");
      setOutput(result || "✅ Tests executed successfully (no output)");

    } catch (err: any) {
      setOutput(`❌ Pytest Execution Error: ${err.message}`);
    }
  };


  // Handle running Python code
  const handleRunCode = async () => {
    if (!pyodide) {
      setOutput("⏳ Initializing Python runtime...");
      return;
    }

    const code = fileContents[selectedFile] ?? "";
    if (!code.trim()) {
      setOutput("⚠️ No code to run.");
      return;
    }

    try {
      pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = sys.stdout
      `);

      await pyodide.runPythonAsync(code);
      const result = pyodide.runPython("sys.stdout.getvalue()");
      setOutput(result || "✅ Executed successfully (no output)");
    } catch (err: any) {
      setOutput(`❌ Error: ${err.message}`);
    }
  };


  const openFiles = Object.keys(fileContents);

  // Render the main component
  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Bar */}
      <TopBar 
        onRunCode={handleRunCode} 
        onRunTests={handleRunTests}
        isPyodideReady={!!pyodide} 
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left File Explorer */}
        <FileExplorer
          selectedFile={selectedFile}
          onSelectFile={handleSelectFile}
          onCreateFile={handleCreateFile}
          onFolderRename={handleFolderRename} 
        />
        {/* Right Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="h-9 bg-white border-b border-gray-200 flex items-center px-2 gap-1">
            {openFiles.map((file) => (
              <div
                key={file}
                onClick={() => setSelectedFile(file)}
                className={`px-4 py-1.5 text-sm rounded-t cursor-pointer ${
                  selectedFile === file
                    ? "bg-white border-t-2 border-blue-500 text-gray-800"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title={file}
              >
                {file.split("/").pop()}
              </div>
            ))}
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 relative">
            <Editor
              key={selectedFile}
              height="100%"
              defaultLanguage="python"
              value={fileContents[selectedFile] ?? ""}
              theme="vs"
              onMount={handleEditorDidMount}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                automaticLayout: true,
                fontSize: 14,
                lineNumbers: "on",
                padding: { top: 12, bottom: 12 },
              }}
            />

            {/* Generate Test */}
            {showGenerateTest && (
              <div className="absolute top-4 right-4 z-10">
                <button
                  disabled={isGenerating}
                  onClick={handleGenerateTest}
                  className="px-4 py-2 bg-blue-500 text-white rounded shadow flex items-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      ✨ Generate Test
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Output Console */}
      {output && (
        <div className="border-t border-gray-200 bg-gray-50 text-sm px-4 py-3 overflow-auto h-32 font-mono whitespace-pre-wrap">
          {output}
        </div>
      )}
    </div>
  );
};

export default AITestGenIDE;