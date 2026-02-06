import { useCallback, useState, useRef } from "react";
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nodeTypes } from "./nodes";
import { NodePalette } from "./NodePalette";
import type { FlowNodeData } from "~/utils/workflow-to-reactflow";
import type { WorkflowNodeType, WorkflowNode } from "~/engine/types";

interface WorkflowCanvasProps {
  initialNodes: Node<FlowNodeData>[];
  initialEdges: Edge[];
  onChange?: (nodes: Node<FlowNodeData>[], edges: Edge[]) => void;
  onNodeSelect?: (node: Node<FlowNodeData> | null) => void;
}

let nodeIdCounter = 0;

function generateNodeId(type: string): string {
  nodeIdCounter++;
  return `${type}-${Date.now()}-${nodeIdCounter}`;
}

export function WorkflowCanvas({ initialNodes, initialEdges, onChange, onNodeSelect }: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (connection: Connection) => {
      // For if/while nodes, determine edge label from source handle
      let label: string | undefined;
      const sourceNode = nodes.find(n => n.id === connection.source);
      if (sourceNode && (sourceNode.type === "if" || sourceNode.type === "while")) {
        label = connection.sourceHandle || undefined;
      }

      const newEdge: Edge = {
        ...connection,
        id: `${connection.source}-${connection.target}${label ? `-${label}` : ""}`,
        label,
        type: "smoothstep",
        style: label === "false"
          ? { stroke: "#ef4444" }
          : label === "true"
            ? { stroke: "#22c55e" }
            : undefined,
        animated: label === "true",
      };

      setEdges((eds) => addEdge(newEdge, eds));
      onChange?.(nodes, [...edges, newEdge]);
    },
    [nodes, edges, setEdges, onChange]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeSelect?.(node as Node<FlowNodeData>);
    },
    [onNodeSelect]
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  const handleAddNode = useCallback(
    (type: WorkflowNodeType, defaultProps: Record<string, string>) => {
      const id = generateNodeId(type);
      const workflowNode: WorkflowNode = {
        id,
        type,
        properties: { ...defaultProps },
      };

      const newNode: Node<FlowNodeData> = {
        id,
        type,
        position: { x: 250, y: (nodes.length * 100) + 50 },
        data: {
          label: `${type}: ${id}`,
          workflowNode,
        },
      };

      const newNodes = [...nodes, newNode];
      setNodes(newNodes);
      onChange?.(newNodes, edges);
    },
    [nodes, edges, setNodes, onChange]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const data = event.dataTransfer.getData("application/workflow-node");
      if (!data) return;

      const { type, defaultProps } = JSON.parse(data) as {
        type: WorkflowNodeType;
        defaultProps: Record<string, string>;
      };

      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;

      const id = generateNodeId(type);
      const workflowNode: WorkflowNode = {
        id,
        type,
        properties: { ...defaultProps },
      };

      const newNode: Node<FlowNodeData> = {
        id,
        type,
        position: {
          x: event.clientX - bounds.left - 100,
          y: event.clientY - bounds.top - 30,
        },
        data: {
          label: getLabel(workflowNode),
          workflowNode,
        },
      };

      const newNodes = [...nodes, newNode];
      setNodes(newNodes);
      onChange?.(newNodes, edges);
    },
    [nodes, edges, setNodes, onChange]
  );

  return (
    <div className="flex flex-1 h-full">
      <NodePalette onAddNode={handleAddNode} />

      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode="Delete"
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}

function getLabel(node: WorkflowNode): string {
  switch (node.type) {
    case "variable": return `var: ${node.properties["name"] || ""}`;
    case "set": return `set: ${node.properties["name"] || ""}`;
    case "if": return `if: ${(node.properties["condition"] || "").substring(0, 30)}`;
    case "while": return `while: ${(node.properties["condition"] || "").substring(0, 30)}`;
    case "command": return `LLM: ${(node.properties["prompt"] || "").substring(0, 25)}...`;
    case "http": return `HTTP ${node.properties["method"] || "GET"}`;
    default: return node.type;
  }
}
