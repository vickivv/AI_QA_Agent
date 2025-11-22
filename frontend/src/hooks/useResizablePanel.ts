// src/hooks/useResizablePanel.ts
import { useRef, useState } from "react";

export function useResizablePanel(initialHeight = 160) {
  const [height, setHeight] = useState(initialHeight);
  const isDragging = useRef(false);

  const onMouseDown = () => {
    isDragging.current = true;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;

    const newHeight = window.innerHeight - e.clientY;
    if (newHeight > 80) setHeight(newHeight);
  };

  const onMouseUp = () => {
    isDragging.current = false;
  };

  return { height, onMouseDown, onMouseMove, onMouseUp };
}
