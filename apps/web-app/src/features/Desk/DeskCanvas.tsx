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
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useState } from "react";
import { ChatNode } from "./nodes/ChatNode";
import { DeskCanvasSidebar } from "./DeskCanvasSidebar";
import { useFlowStore } from "@/stores/flowStore";

interface DeskCanvasProps {
  tabId: string;
}

const CHAT_NODE_DEFAULT_SIZE = { width: 400, height: 400 };

const nodeTypes = {
  chat: ChatNode,
};

function DeskCanvasInner({ tabId }: DeskCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const { screenToFlowPosition, setViewport } = useReactFlow();
  const { saveFlow, getFlow } = useFlowStore();

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

  useEffect(() => {
    if (!rfInstance) return;
    const flow = getFlow(tabId);
    if (flow) {
      const { x = 0, y = 0, zoom = 1 } = flow.viewport ?? {};
      setNodes(flow.nodes ?? []);
      setEdges(flow.edges ?? []);
      setViewport({ x, y, zoom });
    }
  }, [rfInstance, getFlow, tabId, setViewport]);

  useEffect(() => {
    if (!rfInstance) return;
    const timeout = setTimeout(() => {
      saveFlow(tabId, rfInstance.toObject());
    }, 500);
    return () => clearTimeout(timeout);
  }, [nodes, edges, rfInstance, saveFlow, tabId]);

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
        onInit={setRfInstance}
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
