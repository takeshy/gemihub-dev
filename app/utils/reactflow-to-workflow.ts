import type { Node, Edge } from "@xyflow/react";
import yaml from "js-yaml";
import type { Workflow, WorkflowNode, WorkflowEdge, WorkflowNodeType } from "~/engine/types";
import type { FlowNodeData } from "./workflow-to-reactflow";

export function reactFlowToWorkflow(
  nodes: Node<FlowNodeData>[],
  edges: Edge[],
  name: string = "workflow"
): Workflow {
  const workflowNodes = new Map<string, WorkflowNode>();
  const workflowEdges: WorkflowEdge[] = [];
  const positions: Record<string, { x: number; y: number }> = {};

  // Convert nodes
  for (const rfNode of nodes) {
    const wNode = rfNode.data.workflowNode;
    workflowNodes.set(rfNode.id, {
      id: rfNode.id,
      type: wNode.type,
      properties: { ...wNode.properties },
    });
    positions[rfNode.id] = {
      x: Math.round(rfNode.position.x),
      y: Math.round(rfNode.position.y),
    };
  }

  // Convert edges
  for (const rfEdge of edges) {
    workflowEdges.push({
      from: rfEdge.source,
      to: rfEdge.target,
      label: rfEdge.label as string | undefined,
    });
  }

  // Determine start node (topmost node by Y position)
  let startNode: string | null = null;
  if (nodes.length > 0) {
    const sorted = [...nodes].sort((a, b) => a.position.y - b.position.y);
    startNode = sorted[0].id;
  }

  return {
    nodes: workflowNodes,
    edges: workflowEdges,
    startNode,
    positions,
  };
}

export function reactFlowToYaml(
  nodes: Node<FlowNodeData>[],
  edges: Edge[],
  name: string = "workflow"
): string {
  const workflow = reactFlowToWorkflow(nodes, edges, name);

  // Build ordered nodes (topological sort by edges, fallback to Y position)
  const nodeOrder = topologicalSort(nodes, edges);

  const positions: Record<string, { x: number; y: number }> = {};
  const yamlNodes: Record<string, unknown>[] = [];

  // Build edge lookup
  const edgeMap = new Map<string, { next?: string; trueNext?: string; falseNext?: string }>();
  for (const edge of edges) {
    if (!edgeMap.has(edge.source)) edgeMap.set(edge.source, {});
    const entry = edgeMap.get(edge.source)!;
    if (edge.label === "true") entry.trueNext = edge.target;
    else if (edge.label === "false") entry.falseNext = edge.target;
    else entry.next = edge.target;
  }

  for (const nodeId of nodeOrder) {
    const rfNode = nodes.find(n => n.id === nodeId);
    if (!rfNode) continue;

    const wNode = rfNode.data.workflowNode;
    positions[nodeId] = {
      x: Math.round(rfNode.position.x),
      y: Math.round(rfNode.position.y),
    };

    const obj: Record<string, unknown> = {
      id: nodeId,
      type: wNode.type,
    };

    // Add properties
    for (const [key, value] of Object.entries(wNode.properties)) {
      obj[key] = value;
    }

    // Add edge references (only if not sequential)
    const nodeIdx = nodeOrder.indexOf(nodeId);
    const nextNodeId = nodeIdx < nodeOrder.length - 1 ? nodeOrder[nodeIdx + 1] : undefined;
    const edgeInfo = edgeMap.get(nodeId);

    if (edgeInfo) {
      if (wNode.type === "if" || wNode.type === "while") {
        if (edgeInfo.trueNext) obj.trueNext = edgeInfo.trueNext;
        if (edgeInfo.falseNext && edgeInfo.falseNext !== nextNodeId) {
          obj.falseNext = edgeInfo.falseNext;
        }
      } else {
        if (edgeInfo.next && edgeInfo.next !== nextNodeId) {
          obj.next = edgeInfo.next;
        }
      }
    }

    yamlNodes.push(obj);
  }

  const output: Record<string, unknown> = { name };
  if (Object.keys(positions).length > 0) {
    output.positions = positions;
  }
  output.nodes = yamlNodes;

  return yaml.dump(output, { lineWidth: -1, noRefs: true });
}

function topologicalSort(nodes: Node[], edges: Edge[]): string[] {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    adjacency.get(edge.source)?.push(edge.target);
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  // Sort by Y position for deterministic order among same-rank nodes
  const nodeById = new Map(nodes.map(n => [n.id, n]));
  queue.sort((a, b) => (nodeById.get(a)?.position.y || 0) - (nodeById.get(b)?.position.y || 0));

  const result: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    for (const neighbor of adjacency.get(current) || []) {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
        queue.sort((a, b) => (nodeById.get(a)?.position.y || 0) - (nodeById.get(b)?.position.y || 0));
      }
    }
  }

  // Add any remaining nodes (cycles) sorted by Y
  const remaining = nodes
    .filter(n => !result.includes(n.id))
    .sort((a, b) => a.position.y - b.position.y)
    .map(n => n.id);
  result.push(...remaining);

  return result;
}
