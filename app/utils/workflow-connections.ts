import type { Workflow } from "~/engine/types";

export function buildIncomingMap(
  workflow: Workflow
): Map<string, Array<{ from: string; label?: string }>> {
  const map = new Map<string, Array<{ from: string; label?: string }>>();
  for (const edge of workflow.edges) {
    if (!map.has(edge.to)) map.set(edge.to, []);
    map.get(edge.to)!.push({ from: edge.from, label: edge.label });
  }
  return map;
}

export function buildOutgoingMap(
  workflow: Workflow
): Map<string, Array<{ to: string; label?: string }>> {
  const map = new Map<string, Array<{ to: string; label?: string }>>();
  for (const edge of workflow.edges) {
    if (!map.has(edge.from)) map.set(edge.from, []);
    map.get(edge.from)!.push({ to: edge.to, label: edge.label });
  }
  return map;
}
