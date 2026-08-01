import { NodeResizer } from "@xyflow/react";

interface NodeResizeHandlesProps {
  isVisible: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export function NodeResizeHandles({
  isVisible,
  minWidth = 300,
  minHeight = 200,
  maxWidth = 800,
  maxHeight = 600,
}: NodeResizeHandlesProps) {
  return (
    <NodeResizer
      minWidth={minWidth}
      minHeight={minHeight}
      maxWidth={maxWidth}
      maxHeight={maxHeight}
      handleClassName="!border-primary !bg-primary/20 hover:!bg-primary/30"
      isVisible={isVisible}
    />
  );
}
