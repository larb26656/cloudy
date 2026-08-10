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
  type OnSelectionChangeFunc,
  type ReactFlowInstance,
  PanOnScrollMode,
  SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { PlusIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NodeDrawerSidebar } from "./NodeDrawerSidebar";
import { useFlowStore } from "@/stores/flowStore";
import { type NodeTemplate } from "./nodes/template/nodeTemplates";
import { nodeTypes } from "./nodes/template";
import { DeskName } from "./DeskName";
import { DeskPanel } from "./components/DeskPanel";
import { InteractionToolbar } from "./components/InteractionToolbar";
import { SelectionToolbar } from "./components/SelectionToolbar";
import { useDeskSelectionActions } from "./hooks/useDeskSelectionActions";
import { useInteractionMode } from "./hooks/useInteractionMode";

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
  const [selectedCount, setSelectedCount] = useState(0);

  const { screenToFlowPosition, setViewport } = useReactFlow();
  const { resolvedTheme } = useTheme();
  const colorMode = resolvedTheme === "dark" ? "dark" : "light";
  const { mode, setMode, isHand, spaceHeld } = useInteractionMode();
  const saveFlow = useFlowStore((s) => s.saveFlow);
  const getFlow = useFlowStore((s) => s.getFlow);

  const rfInstanceRef = useRef<ReactFlowInstance | null>(null);
  rfInstanceRef.current = rfInstance;

  // Snapshot the flow without transient `selected` flags so reopening a desk
  // doesn't restore a stale selection.
  const buildSnapshot = useCallback((instance: ReactFlowInstance) => {
    const snapshot = instance.toObject();
    return {
      ...snapshot,
      nodes: snapshot.nodes.map((node) => ({ ...node, selected: false })),
    };
  }, []);

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
      saveFlow(tabId, buildSnapshot(rfInstance));
    }, 500);
    return () => clearTimeout(timeout);
  }, [nodes, edges, rfInstance, saveFlow, tabId, buildSnapshot]);

  // save on unmount
  useEffect(() => {
    return () => {
      if (rfInstanceRef.current) {
        saveFlow(tabId, buildSnapshot(rfInstanceRef.current));
      }
    };
  }, [tabId, saveFlow, buildSnapshot]);

  const { duplicate, deleteAll, align, distribute } = useDeskSelectionActions({
    nodes,
    setNodes,
  });

  const onSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes: sel }) => {
      setSelectedCount(sel.length);
    },
    [],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        duplicate();
      } else if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        (e.key === "a" || e.key === "A")
      ) {
        e.preventDefault();
        setNodeDrawerOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [duplicate]);

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
        onSelectionChange={onSelectionChange}
        onInit={setRfInstance}
        fitView
        panOnScroll
        panOnScrollMode={PanOnScrollMode.Free}
        selectionOnDrag={!isHand}
        panOnDrag={isHand}
        selectionMode={SelectionMode.Partial}
        deleteKeyCode={["Backspace", "Delete"]}
        colorMode={colorMode}
        className="h-full w-full"
      >
        <Background id={`desk-${tabId}`} />
        <Controls />
        <Panel position="top-left">
          <DeskName name={name} onNameChange={onNameChange}></DeskName>
        </Panel>
        <Panel position="top-right">
          <DeskPanel>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setNodeDrawerOpen(true)}
                    aria-label="Add node"
                  >
                    <PlusIcon />
                  </Button>
                }
              />
              <TooltipContent>Add node (Cmd+Shift+A)</TooltipContent>
            </Tooltip>
          </DeskPanel>
        </Panel>
        <Panel position="bottom-right">
          <InteractionToolbar
            mode={mode}
            setMode={setMode}
            spaceHeld={spaceHeld}
          />
        </Panel>
        <Panel position="bottom-center">
          <SelectionToolbar
            selectedCount={selectedCount}
            onDuplicate={duplicate}
            onDelete={deleteAll}
            onAlign={align}
            onDistribute={distribute}
          />
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
