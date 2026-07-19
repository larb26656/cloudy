import "@tldraw/tldraw/tldraw.css";
import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  Controls,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useState } from "react";
import { ChatNode } from "./nodes/ChatNode";
import { DeskCanvasSidebar } from "./DeskCanvasSidebar";

interface DeskCanvasProps {}

const CHAT_NODE_DEFAULT_SIZE = { width: 400, height: 400 };

const nodeTypes = {
  chat: ChatNode,
};

function DeskCanvasInner({}: DeskCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const { screenToFlowPosition } = useReactFlow();

  const onNodesChange: OnNodesChange<Node> = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );
  const onEdgesChange: OnEdgesChange<Edge> = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );
  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [],
  );

  const handleAddNode = useCallback(
    (type: string, data?: Record<string, unknown>) => {
      const position = screenToFlowPosition({ x: 300, y: 300 });
      const isChat = type === "chat";
      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: isChat ? "chat" : undefined,
        position,
        data: {
          label: data?.sessionName ?? `${type} Node`,
          ...data,
        },
        style: isChat ? CHAT_NODE_DEFAULT_SIZE : undefined,
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition],
  );

  return (
    <div className="relative h-full w-full overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        className="h-full w-full"
      >
        <Background />
        <Controls />
      </ReactFlow>
      <DeskCanvasSidebar onAddNode={handleAddNode} />
    </div>
  );
}

export function DeskCanvas(props: DeskCanvasProps) {
  return (
    <ReactFlowProvider>
      <DeskCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
