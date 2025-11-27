"use client";

import React, { useState, useRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { RefreshCw } from "lucide-react";
import { loadPyodide, PyodideInterface } from "pyodide";

import FileExplorer from "./FileExplorer";
import TopBar from "./TopBar";

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
      const py = await loadPyodide();
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
      if (prev[path] !== undefined) return prev; // 已存在
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

  // Handle test generation
  const handleGenerateTest = () => {
    const fileName = selectedFile.split("/").pop()!;
    const base = fileName.replace(/\.py$/, "");
    const testPath = `tests/test_${base}.py`;

    setIsGenerating(true);

    setTimeout(() => {
      setFileContents((prev) => ({
        ...prev,
        [testPath]:
          prev[testPath] ??
          `# Auto-generated tests for ${selectedFile}\n\ndef test_example():\n    assert True\n`,
      }));

      setSelectedFile(testPath);
      setIsGenerating(false);
    }, 700);
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
      <TopBar onRunCode={handleRunCode} isPyodideReady={!!pyodide} />

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
                className={`px-4 py-1.5 text-sm rounded-t cursor-pointer ${selectedFile === file
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
        <div className="border-t border-gray-200 bg-gray-50 text-sm px-4 py-3 overflow-auto h-32 font-mono">
          {output}
        </div>
      )}
    </div>
  );
};

export default AITestGenIDE;
