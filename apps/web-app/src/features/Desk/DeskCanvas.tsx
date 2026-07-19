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
  Panel,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NodeDrawerSidebar } from "./NodeDrawerSidebar";
import { useFlowStore } from "@/stores/flowStore";
import { type NodeTemplate } from "./nodes/template/nodeTemplates";
import { nodeTypes } from "./nodes/template";

interface DeskCanvasProps {
  tabId: string;
}

function DeskCanvasInner({ tabId }: DeskCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [isNodeDrawerOpen, setNodeDrawerOpen] = useState(false);
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
    (template: NodeTemplate, data?: Record<string, unknown>) => {
      const position = screenToFlowPosition({ x: 300, y: 300 });
      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: template.id,
        position,
        data: {
          ...data,
        },
        style: template.size ?? undefined,
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
        <Panel position="top-right">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setNodeDrawerOpen(true)}
          >
            <PlusIcon />
          </Button>
        </Panel>
      </ReactFlow>
      <NodeDrawerSidebar
        isOpen={isNodeDrawerOpen}
        setOpen={setNodeDrawerOpen}
        onAddNode={handleAddNode}
      />
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
