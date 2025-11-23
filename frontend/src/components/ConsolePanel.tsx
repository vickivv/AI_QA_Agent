// src/components/ConsolePanel.tsx
"use client";

import React from "react";
import { useResizablePanel } from "../hooks/useResizablePanel";
import { colorizePytestOutput } from "../utils/colorizePytest";

interface ConsolePanelProps {
  output: string;
}

const ConsolePanel: React.FC<ConsolePanelProps> = ({ output }) => {
  const { height, onMouseDown, onMouseMove, onMouseUp } =
    useResizablePanel(160);

  if (!output) return null;

  const coloredOutput = colorizePytestOutput(output);

  return (
    <div
      className="w-full bg-gray-50 border-t border-gray-200"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        className="h-2 bg-gray-300 hover:bg-gray-400 cursor-row-resize"
      />

      {/* Console body */}
      <div
        className="text-sm px-4 py-3 overflow-auto font-mono whitespace-pre-wrap"
        style={{ height }}
        dangerouslySetInnerHTML={{ __html: coloredOutput }}
      />
    </div>
  );
};

export default ConsolePanel;
