// src/components/AITestGenIDE.tsx
"use client";

import React, { useState, useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { RefreshCw } from "lucide-react";
import { useDispatch } from "react-redux";

import FileExplorer from "./FileExplorer";
import TopBar from "./TopBar";
import ConsolePanel from "./ConsolePanel";
import { usePyRunner } from "../hooks/usePyRunner";
import { callGenerateTestAPI } from "../logic/api";
import { applyGeneratedTest } from "../logic/testGenerator";
import { addFile } from "./fileReducer";

const AITestGenIDE: React.FC = () => {
  const dispatch = useDispatch();

  // currently selected file path
  const [selectedFile, setSelectedFile] = useState("src/main.py");

  // file contents in the IDE
  const [fileContents, setFileContents] = useState<Record<string, string>>({
    "src/main.py": "",
    "tests/test_main.py": "",
  });

  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverage, setCoverage] = useState<number>(0);

  // Monaco editor ref
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  // Pyodide hook
  const { isReady, runPython, runPytest } = usePyRunner();

  // Monaco Editor mount handler
  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  // Editor content change handler
  const handleEditorChange = (value?: string) => {
    setFileContents((prev) => ({
      ...prev,
      [selectedFile]: value ?? "",
    }));
  };

  // Rename folder handler to sync IDE content
  const handleFolderRename = (oldPath: string, newPath: string) => {
    setFileContents((prev) => {
      const updated: Record<string, string> = {};

      for (const [path, content] of Object.entries(prev)) {
        if (path.startsWith(oldPath + "/")) {
          const newFilePath = path.replace(oldPath + "/", newPath + "/");
          updated[newFilePath] = content;
        } else {
          updated[path] = content;
        }
      }

      return updated;
    });

    // if the selected file is in the renamed folder, update its path
    if (selectedFile.startsWith(oldPath + "/")) {
      setSelectedFile(selectedFile.replace(oldPath + "/", newPath + "/"));
    }
  };

  // Create File & auto-create test file
  const handleCreateFile = (path: string) => {
    // update Redux file tree
    dispatch(addFile({ path }));

    // initialize IDE content
    setFileContents((prev) => {
      if (prev[path] !== undefined) return prev;
      return { ...prev, [path]: "" };
    });

    // auto-create corresponding test file if in src/
    if (path.startsWith("src/") && path.endsWith(".py")) {
      const fileName = path.split("/").pop();
      if (fileName) {
        const testPath = `tests/test_${fileName}`;

        // add to Redux file tree
        dispatch(addFile({ path: testPath }));

        setFileContents((prev) => {
          if (prev[testPath] !== undefined) return prev;
          return { ...prev, [testPath]: "" };
        });
      }
    }

    // update selected file
    setSelectedFile(path);
  };

  // Select File
  const handleSelectFile = (path: string) => {
    setSelectedFile(path);

    // Initialize content if not exists
    setFileContents((prev) => {
      if (prev[path] !== undefined) return prev;
      return { ...prev, [path]: "" };
    });
  };

  // Only show "Generate Test" for .py files
  const showGenerateTest = selectedFile.endsWith(".py");

  // Select Code
  const getSelectedOrFullCode = (): string => {
    const editor = editorRef.current;
    if (!editor) return fileContents[selectedFile] || "";

    const model = editor.getModel();
    const selection = editor.getSelection();

    if (model && selection && !selection.isEmpty()) {
      // If there's a selection, use it
      return model.getValueInRange(selection);
    }

    // Otherwise, return full file content
    return model?.getValue() ?? fileContents[selectedFile] ?? "";
  };

  // Generate Test Handler
  const handleGenerateTest = async () => {
    const codeToTest = getSelectedOrFullCode();
    if (!codeToTest.trim()) {
      setOutput("⚠️ No code to test.");
      return;
    }

    setIsGenerating(true);
    setOutput("🔄 Generating tests...");

    try {
      // Call backend API to generate test code
      const resp = await callGenerateTestAPI(codeToTest, selectedFile);

      // Apply generated test to IDE content & compute coverage
      const {
        updatedContents,
        testFile,
        coverage: cov,
      } = applyGeneratedTest(selectedFile, resp.generated_code, fileContents);

      setFileContents(updatedContents);
      setSelectedFile(testFile);

      if (cov) {
        setCoverage(cov.percent ?? 0);
      }

      // Update Redux file tree
      dispatch(addFile({ path: testFile }));

      setOutput(`✨ Test generated and saved to ${testFile}`);
    } catch (err: any) {
      setOutput("❌ " + (err?.message ?? "Error generating tests"));
    } finally {
      setIsGenerating(false);
    }
  };

  // Run Code Handler
  const handleRunCode = async () => {
    const code = fileContents[selectedFile] ?? "";
    const result = await runPython(selectedFile, fileContents[selectedFile]);
    setOutput(result);

  };

  // Run Tests Handler
  const handleRunTests = async () => {
    console.log("All files:", Object.keys(fileContents));

  const result = await runPytest(fileContents); 
  setOutput(result);
};



  // Open files for tabs
  const openFiles = Object.keys(fileContents);

  // ========== UI ==========
  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Topbar */}
      <TopBar
        onRunCode={handleRunCode}
        onRunTests={handleRunTests}
        isReady={isReady}
        coverage={coverage}
      />

      {/* Middle: Left File Explorer + Right Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left File Explorer (Redux) */}
        <FileExplorer
          selectedFile={selectedFile}
          onSelectFile={handleSelectFile}
          onCreateFile={handleCreateFile}
          onFolderRename={handleFolderRename}
        />

        {/* Editor */}
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

            {/* Generate Test button */}
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
                    <>✨ Generate Test</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Console */}
      <ConsolePanel output={output} />
    </div>
  );
};

export default AITestGenIDE;
