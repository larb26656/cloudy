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

  PanOnScrollMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NodeDrawerSidebar } from "./NodeDrawerSidebar";
import { useFlowStore } from "@/stores/flowStore";
import { type NodeTemplate } from "./nodes/template/nodeTemplates";
import { nodeTypes } from "./nodes/template";
import { DeskName } from "./DeskName";

interface DeskCanvasProps {
  tabId: string;
  name: string;
  onNameChange: (name: string) => void;
}

function DeskCanvasInner({ tabId, name, onNameChange }: DeskCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [isNodeDrawerOpen, setNodeDrawerOpen] = useState(false);

  const { screenToFlowPosition, setViewport } = useReactFlow();
  const saveFlow = useFlowStore((s) => s.saveFlow);
  const getFlow = useFlowStore((s) => s.getFlow);

  const rfInstanceRef = useRef<ReactFlowInstance | null>(null);
  rfInstanceRef.current = rfInstance;

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

  const createNodeId = () => `node-${Date.now()}-${Math.random()}`;


  // load State
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

  // save state
  useEffect(() => {
    if (!rfInstance) return;
    const timeout = setTimeout(() => {
      saveFlow(tabId, rfInstance.toObject());
    }, 500);
    return () => clearTimeout(timeout);
  }, [nodes, edges, rfInstance, saveFlow, tabId]);

  // save on unmount
  useEffect(() => {
    return () => {
      if (rfInstanceRef.current) {
        saveFlow(tabId, rfInstanceRef.current.toObject());
      }
    };
  }, [tabId, saveFlow]);

  const duplicateSelectedNodes = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;

    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: false,
      })),
    );

    const newNodes = selectedNodes.map((node) => ({
      ...node,
        id: createNodeId(),
      position: {
        x: node.position.x + 20,
        y: node.position.y + 20,
      },
      selected: true,
    }));

    setNodes((nds) => [...nds, ...newNodes]);
  }, [nodes]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        duplicateSelectedNodes();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [duplicateSelectedNodes]);

  const handleAddNode = useCallback(
    (template: NodeTemplate, data?: Record<string, unknown>) => {
      const position = screenToFlowPosition({ x: 300, y: 300 });
      const newNode: Node = {
        id: createNodeId(),
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
        panOnScroll
        panOnScrollMode={PanOnScrollMode.Free}
        className="h-full w-full"
      >
        <Background />
        <Controls />
        <Panel position="top-left">
          <DeskName name={name} onNameChange={onNameChange}></DeskName>
        </Panel>
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
