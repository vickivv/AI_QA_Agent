// src/components/AITestGenIDE.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { RefreshCw } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import FileExplorer from "./FileExplorer";
import TopBar from "./TopBar";
import ConsolePanel from "./ConsolePanel";
import { usePyRunner } from "../hooks/usePyRunner";
import { callGenerateTestAPI } from "../logic/api";
import { applyGeneratedTest } from "../logic/testGenerator";
import { addFile } from "./fileReducer";
import { addNewFolder } from "./folderReducer";
import { RootState } from "../store";
import SettingsPanel, { AppSettings } from './SettingsPanel';



const AITestGenIDE: React.FC = () => {
  const dispatch = useDispatch();
  const selectedFolder = useSelector((s: RootState) => s.explorer.selectedFolder);
  const folders = useSelector((s: RootState) => s.folderReducer.folders);


  //====== Settings panel state ======
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // State to hold current settings
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'Light',
    fontFamily: 'Monospace',
    fontSize: 14,
  });
  // Function to open the settings panel
  const openSettings = () => {
    console.log("Opening settings...");
    setIsSettingsOpen(true);
  };
  // Function to close the settings panel
  const closeSettings = () => setIsSettingsOpen(false);
  // Handlers for changing settings
  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings(prev => ({ ...prev, theme: e.target.value as AppSettings['theme'] }));
  };

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings(prev => ({ ...prev, fontFamily: e.target.value }));
  };

  const handleFontSizeChange = (amount: number) => {
    setSettings(prev => ({
      ...prev,
      fontSize: Math.min(30, Math.max(10, prev.fontSize + amount)),
    }));
  };

  // ====== Tabs & file contents ======
  const [fileContents, setFileContents] = useState<Record<string, string>>({
    "src/main.py": "",
    "tests/test_main.py": "",
  });

  // tabs state
  const [openTabs, setOpenTabs] = useState<string[]>([
    "src/main.py",
    "tests/test_main.py",
  ]);
  const [activeTab, setActiveTab] = useState<string>("src/main.py");

  // console output & state
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverage, setCoverage] = useState<number>(0);

  // Monaco editor ref
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  // Pyodide hook
  const { isReady, runPython, runPytest } = usePyRunner();

  // ====== helpers ======

  // ensure tab is open
  const ensureTabOpen = (path: string) => {
    setOpenTabs((prev) => {
      if (prev.includes(path)) return prev;
      return [...prev, path];
    });
  };

  // open/select file tab
  const openFile = (path: string) => {
    setActiveTab(path);
    ensureTabOpen(path);

    setFileContents((prev) => {
      if (prev[path] !== undefined) return prev;
      return { ...prev, [path]: "" };
    });
  };

  // close tab
  const closeTab = (path: string) => {
    setOpenTabs((prev) => {
      if (!prev.includes(path)) return prev;

      const idx = prev.indexOf(path);
      const newTabs = prev.filter((p) => p !== path);

      // if closing active tab, switch to another
      if (path === activeTab) {
        if (newTabs.length > 0) {
          const next = newTabs[idx] || newTabs[idx - 1];
          setActiveTab(next);
        } else {
          setActiveTab("");
        }
      }

      return newTabs;
    });
  };

  // ====== Monaco Editor mount ======
  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  // ====== Editor ======
  const handleEditorChange = (value?: string) => {
    if (!activeTab) return;
    setFileContents((prev) => ({
      ...prev,
      [activeTab]: value ?? "",
    }));
  };

  // ====== Folder rename → update fileContents & tabs ======
  const handleFolderRename = (oldPath: string, newPath: string) => {
    // update fileContents key
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

    // update openTabs
    setOpenTabs((prev) =>
      prev.map((p) =>
        p.startsWith(oldPath + "/") ? p.replace(oldPath + "/", newPath + "/") : p
      )
    );

    // Update activeTab
    if (activeTab.startsWith(oldPath + "/")) {
      setActiveTab(activeTab.replace(oldPath + "/", newPath + "/"));
    }
  };

  // ====== Create file from FileExplorer + auto-create test file ======
  const handleCreateFile = (path: string) => {
    // Redux: add to file tree
    dispatch(addFile({ path }));

    // IDE: initialize file content
    setFileContents((prev) => {
      if (prev[path] !== undefined) return prev;
      return { ...prev, [path]: "" };
    });

    // If source file under src/, auto-create test file
    if (path.startsWith("src/") && path.endsWith(".py")) {
      const fileName = path.split("/").pop();
      if (fileName) {
        const testPath = `tests/test_${fileName}`;

        dispatch(addFile({ path: testPath }));

        setFileContents((prev) => {
          if (prev[testPath] !== undefined) return prev;
          return { ...prev, [testPath]: "" };
        });
      }
    }

    openFile(path);
  };

  // ====== FileExplorer Selected file ======
  const handleSelectFile = (path: string) => {
    openFile(path);
  };

  // ======  Generate Test only shows on .py file ======
  const showGenerateTest = activeTab.endsWith(".py");

  // ====== Get selected code ======
  const getSelectedOrFullCode = (): string => {
    if (!activeTab) return "";
    const editor = editorRef.current;
    if (!editor) return fileContents[activeTab] || "";

    const model = editor.getModel();
    const selection = editor.getSelection();

    if (model && selection && !selection.isEmpty()) {
      return model.getValueInRange(selection);
    }

    return model?.getValue() ?? fileContents[activeTab] ?? "";
  };

  // ====== Generate Test ======
  const handleGenerateTest = async () => {
    if (!activeTab) {
      setOutput("⚠️ No active file to test.");
      return;
    }

    const codeToTest = getSelectedOrFullCode();
    if (!codeToTest.trim()) {
      setOutput("⚠️ No code to test.");
      return;
    }

    setIsGenerating(true);
    setOutput("🔄 Generating tests...");

    try {
      // call API
      const resp = await callGenerateTestAPI(codeToTest, activeTab);

      // apply generated test
      const {
        updatedContents,
        testFile,
        coverage: cov,
      } = applyGeneratedTest(activeTab, resp.generated_code, fileContents);

      setFileContents(updatedContents);
      openFile(testFile);

      if (cov) {
        setCoverage(cov.percent ?? 0);
      }

      // Redux：ensure test file exists in file tree
      dispatch(addFile({ path: testFile }));

      setOutput(`✨ Test generated and saved to ${testFile}`);
    } catch (err: any) {
      setOutput("❌ " + (err?.message ?? "Error generating tests"));
    } finally {
      setIsGenerating(false);
    }
  };

  // ====== Run Code ======
  const handleRunCode = async () => {
    if (!activeTab) {
      setOutput("⚠️ No active file to run.");
      return;
    }
    const code = fileContents[activeTab] ?? "";
    const result = await runPython(activeTab, code);
    setOutput(result);
  };

  // ====== Run Tests（tests/） ======
  const handleRunTests = async () => {
    const result = await runPytest(fileContents);
    setOutput(result);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    console.log("🔍 selectedFolder:", selectedFolder);
    console.log("🔍 selectedFolder type:", typeof selectedFolder);
    console.log("🔍 selectedFolder length:", selectedFolder?.length);

    const targetFolder = selectedFolder || "uploaded";
    console.log("🔍 targetFolder:", targetFolder);


    const folderExists = folders.some(folder => folder.path === targetFolder);
    console.log("🔍 folderExists:", folderExists);

    if (!folderExists) {
      console.log("🔍 Creating folder:", targetFolder);
      dispatch(addNewFolder({ path: targetFolder }));
    }
    Array.from(files).forEach((file) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target?.result as string;
        const filePath = `${targetFolder}/${file.name}`;

        console.log("🔍 Final filePath:", filePath);

        setFileContents((prev) => ({
          ...prev,
          [filePath]: content,
        }));
        dispatch(addFile({ path: filePath }));
      };
      reader.readAsText(file);
    });

    // Reset input so same file can be uploaded again
    event.target.value = "";
  };


  useEffect(() => {
    // 1️⃣ Ensure "uploaded" folder exists
    const folderExists = folders.some(folder => folder.path === "uploaded");
    if (!folderExists) {
      dispatch(addNewFolder({ path: "uploaded" }));
    }
    // 2️⃣ Apply live settings
    // Update theme
    if (settings.theme === 'Dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Update font size and font family for the editor container
    const editorContainer = document.getElementById('editor-container'); // make sure your editor div has this id
    if (editorContainer) {
      editorContainer.style.fontSize = `${settings.fontSize}px`;
      editorContainer.style.fontFamily = settings.fontFamily;
    }
  }, [dispatch, folders, settings]);

  // ========== UI ==========
  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Topbar */}
      <TopBar
        onRunCode={handleRunCode}
        onRunTests={handleRunTests}
        isReady={isReady}
        coverage={coverage}
        onFileUpload={handleFileUpload}
        onOpenSettings={openSettings}
      />

      {/* Middle: Left File Explorer + Right Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left：File Explorer */}
        <FileExplorer
          selectedFile={activeTab}
          onSelectFile={handleSelectFile}
          onCreateFile={handleCreateFile}
          onFolderRename={handleFolderRename}
        />

        {/* Right：Tabs + Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="h-9 bg-white border-b border-gray-200 flex items-center px-2 gap-1">
            {openTabs.map((file) => (
              <div
                key={file}
                className={`px-3 py-1.5 text-sm rounded-t cursor-pointer flex items-center ${activeTab === file
                  ? "bg-white border-t-2 border-blue-500 text-gray-800"
                  : "text-gray-600 hover:bg-gray-100"
                  }`}
                onClick={() => setActiveTab(file)}
                title={file}
              >
                <span>{file.split("/").pop()}</span>
                {/* Close button */}
                {openTabs.length > 1 && (
                  <button
                    className="ml-2 text-gray-400 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(file);
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 relative">
            <Editor
              key={activeTab}
              height="100%"
              defaultLanguage="python"
              value={activeTab ? fileContents[activeTab] ?? "" : ""}
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

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        settings={settings}
        onThemeChange={handleThemeChange}
        onFontFamilyChange={handleFontFamilyChange}
        onFontSizeChange={handleFontSizeChange}
      />
    </div>
  );
};

export default AITestGenIDE;
