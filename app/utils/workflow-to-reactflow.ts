import type { Node, Edge } from "@xyflow/react";
import type { Workflow, WorkflowNode } from "~/engine/types";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 60;

export interface FlowNodeData {
  label: string;
  workflowNode: WorkflowNode;
  [key: string]: unknown;
}

export async function workflowToReactFlow(workflow: Workflow): Promise<{
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
}> {
  const nodes: Node<FlowNodeData>[] = [];
  const edges: Edge[] = [];

  // Create React Flow nodes
  for (const [id, wNode] of workflow.nodes) {
    const label = getNodeLabel(wNode);
    const position = workflow.positions?.[id] || { x: 0, y: 0 };

    nodes.push({
      id,
      type: wNode.type,
      position,
      data: { label, workflowNode: wNode },
    });
  }

  // Create React Flow edges
  for (const edge of workflow.edges) {
    const edgeId = `${edge.from}-${edge.to}${edge.label ? `-${edge.label}` : ""}`;
    edges.push({
      id: edgeId,
      source: edge.from,
      target: edge.to,
      label: edge.label || undefined,
      type: "smoothstep",
      style: edge.label === "false"
        ? { stroke: "#ef4444" }
        : edge.label === "true"
          ? { stroke: "#22c55e" }
          : undefined,
      animated: edge.label === "true",
    });
  }

  // Apply dagre layout if no positions
  if (!workflow.positions || Object.keys(workflow.positions).length === 0) {
    await applyDagreLayout(nodes, edges);
  }

  return { nodes, edges };
}

async function applyDagreLayout(nodes: Node[], edges: Edge[]): Promise<void> {
  const dagre = (await import("@dagrejs/dagre")).default;
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 50, ranksep: 80 });

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  for (const node of nodes) {
    const nodeWithPosition = g.node(node.id);
    node.position = {
      x: nodeWithPosition.x - NODE_WIDTH / 2,
      y: nodeWithPosition.y - NODE_HEIGHT / 2,
    };
  }
}

function getNodeLabel(node: WorkflowNode): string {
  switch (node.type) {
    case "variable": return `var: ${node.properties["name"] || ""}`;
    case "set": return `set: ${node.properties["name"] || ""}`;
    case "if": return `if: ${(node.properties["condition"] || "").substring(0, 30)}`;
    case "while": return `while: ${(node.properties["condition"] || "").substring(0, 30)}`;
    case "command": return `LLM: ${(node.properties["prompt"] || "").substring(0, 25)}...`;
    case "http": return `HTTP ${node.properties["method"] || "GET"}`;
    case "json": return `JSON parse`;
    case "drive-file": return `Write: ${node.properties["path"] || ""}`;
    case "drive-read": return `Read: ${node.properties["path"] || ""}`;
    case "drive-search": return `Search: ${node.properties["query"] || ""}`;
    case "drive-list": return `List files`;
    case "drive-folder-list": return `List folders`;
    case "drive-file-picker": return `File picker`;
    case "drive-save": return `Save file`;
    case "preview": return `Preview`;
    case "dialog": return `Dialog: ${node.properties["title"] || ""}`;
    case "prompt-value": return `Input: ${node.properties["title"] || ""}`;
    case "workflow": return `Sub: ${node.properties["path"] || ""}`;
    case "mcp": return `MCP: ${node.properties["tool"] || ""}`;
    case "sleep": return `Sleep ${node.properties["duration"] || ""}ms`;
    default: return node.type;
  }
}
