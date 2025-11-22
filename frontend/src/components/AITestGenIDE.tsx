"use client";

import React, { useState, useRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { RefreshCw } from "lucide-react";
import { loadPyodide, PyodideInterface } from "pyodide";

import FileExplorer from "./FileExplorer";
import TopBar from "./TopBar";
import { callGenerateTestAPI } from "../logic/api";
import { applyGeneratedTest } from "../logic/testGenerator";
import ConsolePanel from "./ConsolePanel";
import { usePyRunner } from "../hooks/usePyRunner";

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
  const [consoleHeight, setConsoleHeight] = useState(160); // initial height of console
  const isDragging = useRef(false);
  const [output, setOutput] = useState("");
  const onMouseDown = () => {
    isDragging.current = true;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const newHeight = window.innerHeight - e.clientY;
    if (newHeight >= 80) setConsoleHeight(newHeight);
  };

  const onMouseUp = () => {
    isDragging.current = false;
  };

  const { isReady, runPython, runPytest } = usePyRunner();

  // monaco editor reference
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  

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
    setOutput("⚠️ No code to test.");
    return;
  }

  setIsGenerating(true);
  setOutput("🔄 Generating tests...");

  try {
    const resp = await callGenerateTestAPI(codeToTest, selectedFile);

    const { updatedContents, testFile } = applyGeneratedTest(
      selectedFile,
      resp.generated_code,
      fileContents
    );

    setFileContents(updatedContents);
    setSelectedFile(testFile);
    setOutput(`✨ Test generated and saved to ${testFile}`);
  } catch (err: any) {
    setOutput("❌ " + err.message);
  } finally {
    setIsGenerating(false);
  }
  };

  // Execute pytest within Pyodide and capture output
  const handleRunTests = async () => {
  const src = fileContents["src/main.py"] ?? "";
  const tests = fileContents["tests/test_main.py"] ?? "";

  const output = await runPytest(src, tests);
  setOutput(output);
};

  // Handle running Python code
  const handleRunCode = async () => {
    console.log("handleRunCode CALLED");
    console.log("runPython = ", runPython);
  const code = fileContents[selectedFile] ?? "";
  const result = await runPython(code);
  console.log("runPython RESULT =", result);

  setOutput(result);
};


  const openFiles = Object.keys(fileContents);

  // Render the main component
  return (
    <div
    className="h-screen flex flex-col bg-white"
    onMouseMove={onMouseMove}
    onMouseUp={onMouseUp}
  >
      {/* Top Bar */}
      <TopBar
        onRunCode={handleRunCode}
        onRunTests={handleRunTests}
        isReady={isReady}
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
    <ConsolePanel output={output} />
    </div>
  );
};

export default AITestGenIDE;