import React, { useState, useRef, useEffect } from 'react';
import { FileCode, FolderClosed, FolderOpen, Play, Settings, Files, Copy, RefreshCw, Plus } from 'lucide-react';
import Editor from '@monaco-editor/react';

const AITestGenIDE = () => {
  const [selectedFile, setSelectedFile] = useState('main.py');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState({ src: true, tests: false });
  const [editorSelection, setEditorSelection] = useState(null);
  const [showGenerateButton, setShowGenerateButton] = useState(false);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const files = [
    { name: 'src', type: 'folder', children: [
      { name: 'main.py', type: 'file' },
      { name: 'utils.py', type: 'file' },
      { name: 'config.py', type: 'file' }
    ]},
    { name: 'tests', type: 'folder', children: [
      { name: 'test_main.py', type: 'file' },
      { name: 'test_utils.py', type: 'file' }
    ]},
    { name: 'README.md', type: 'file' }
  ];

  const mainPyCode = `import requests
from typing import List, Dict

def fetch_user_data(user_id: int) -> Dict:
    """Fetch user data from the API"""
    response = requests.get(f"https://api.example.com/users/{user_id}")
    return response.json()

def calculate_total(items: List[float]) -> float:
    """Calculate the total sum of items"""
    return sum(items)

def process_user_orders(user_id: int) -> List[Dict]:
    """Process and return all orders for a user"""
    user = fetch_user_data(user_id)
    orders = requests.get(f"https://api.example.com/orders?user={user_id}").json()
    return orders`;

  const generatedTest = `import pytest
from unittest.mock import patch, Mock
from main import fetch_user_data

def test_fetch_user_data_success():
    """Test successful user data fetch"""
    mock_response = Mock()
    mock_response.json.return_value = {
        "id": 123,
        "name": "John Doe",
        "email": "john@example.com"
    }

    with patch('requests.get', return_value=mock_response):
        result = fetch_user_data(123)
        assert result["id"] == 123
        assert result["name"] == "John Doe"
        assert result["email"] == "john@example.com"

def test_fetch_user_data_invalid_id():
    """Test fetch with invalid user ID"""
    mock_response = Mock()
    mock_response.json.return_value = {"error": "User not found"}

    with patch('requests.get', return_value=mock_response):
        result = fetch_user_data(999)
        assert "error" in result
        assert result["error"] == "User not found"

def test_fetch_user_data_network_error():
    """Test handling of network errors"""
    with patch('requests.get', side_effect=Exception("Network error")):
        with pytest.raises(Exception):
            fetch_user_data(123)`;

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Listen to selection changes
    editor.onDidChangeCursorSelection((e) => {
      const selection = e.selection;
      const hasSelection = !selection.isEmpty();

      if (hasSelection) {
        setEditorSelection({
          startLine: selection.startLineNumber,
          endLine: selection.endLineNumber,
          startColumn: selection.startColumn,
          endColumn: selection.endColumn
        });
        setShowGenerateButton(true);
      } else {
        setShowGenerateButton(false);
      }
    });

    // Set initial selection for demo
    setTimeout(() => {
      editor.setSelection({
        startLineNumber: 4,
        startColumn: 1,
        endLineNumber: 7,
        endColumn: 28
      });
      editor.revealLineInCenter(5);
    }, 500);
  };

  const handleGenerateTest = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowTestPanel(true);
    }, 1500);
  };

  const handleCopyTest = () => {
    navigator.clipboard.writeText(generatedTest);
  };

  const handleInsertTest = () => {
    setSelectedFile('test_main.py');
    setShowTestPanel(false);
  };

  const toggleFolder = (folderName) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

  const renderFileTree = (items, depth = 0) => {
    return items.map((item, idx) => (
      <div key={idx}>
        {item.type === 'folder' ? (
          <>
            <div
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-sm"
              style={{ paddingLeft: `${depth * 12 + 12}px` }}
              onClick={() => toggleFolder(item.name)}
            >
              {expandedFolders[item.name] ? (
                <FolderOpen className="w-4 h-4 text-blue-500" />
              ) : (
                <FolderClosed className="w-4 h-4 text-blue-500" />
              )}
              <span className="text-gray-700">{item.name}</span>
            </div>
            {expandedFolders[item.name] && renderFileTree(item.children, depth + 1)}
          </>
        ) : (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-sm ${
              selectedFile === item.name ? 'bg-blue-50 border-l-2 border-blue-500' : ''
            }`}
            style={{ paddingLeft: `${depth * 12 + 12}px` }}
            onClick={() => setSelectedFile(item.name)}
          >
            <FileCode className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">{item.name}</span>
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Navigation */}
      <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-800">AI TestGen</h1>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center gap-1.5">
              <Files className="w-4 h-4" />
              Files
            </button>
            <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center gap-1.5">
              <Play className="w-4 h-4" />
              Run
            </button>
            <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center gap-1.5">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="py-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Explorer
            </div>
            {renderFileTree(files)}
          </div>
        </div>

        {/* Code Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="h-10 bg-gray-50 border-b border-gray-200 flex items-center px-2 gap-1">
            <div
              className={`px-4 py-1.5 text-sm rounded-t cursor-pointer ${
                selectedFile === 'main.py'
                  ? 'bg-white border-t-2 border-blue-500 text-gray-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setSelectedFile('main.py')}
            >
              main.py
            </div>
            <div
              className={`px-4 py-1.5 text-sm rounded-t cursor-pointer ${
                selectedFile === 'test_main.py'
                  ? 'bg-white border-t-2 border-blue-500 text-gray-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setSelectedFile('test_main.py')}
            >
              test_main.py
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 overflow-hidden flex relative">
            <div className="flex-1 relative">
              <Editor
                height="100%"
                defaultLanguage="python"
                value={selectedFile === 'main.py' ? mainPyCode : generatedTest}
                theme="vs"
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  padding: { top: 16, bottom: 16 },
                  lineHeight: 24,
                  renderLineHighlight: 'all',
                  selectionHighlight: true,
                  occurrencesHighlight: true,
                  bracketPairColorization: {
                    enabled: true
                  }
                }}
              />

              {/* Generate Test Button */}
              {showGenerateButton && selectedFile === 'main.py' && (
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={handleGenerateTest}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium transition-all disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <span className="text-lg">✨</span>
                        Generate Test
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* AI Generated Test Panel */}
            {showTestPanel && (
              <div className="w-1/2 border-l border-gray-200 flex flex-col bg-white">
                <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4">
                  <h3 className="text-sm font-semibold text-gray-800">Generated Tests</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyTest}
                      className="px-3 py-1.5 text-sm bg-white border border-gray-300 hover:bg-gray-50 rounded flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </button>
                    <button
                      onClick={handleInsertTest}
                      className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Insert Test
                    </button>
                    <button
                      onClick={handleGenerateTest}
                      className="px-3 py-1.5 text-sm bg-white border border-gray-300 hover:bg-gray-50 rounded flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Regenerate
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <Editor
                    height="100%"
                    defaultLanguage="python"
                    value={generatedTest}
                    theme="vs"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      readOnly: false,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 4,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      padding: { top: 16, bottom: 16 },
                      lineHeight: 24,
                      renderLineHighlight: 'all'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITestGenIDE;