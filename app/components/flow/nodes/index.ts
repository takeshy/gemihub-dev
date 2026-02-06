import type { NodeTypes } from "@xyflow/react";
import { WorkflowNodeComponent } from "./WorkflowNodeComponent";

// Register all node types with the same component
// Each type gets custom styling through the component's type prop
export const nodeTypes: NodeTypes = {
  "variable": WorkflowNodeComponent,
  "set": WorkflowNodeComponent,
  "if": WorkflowNodeComponent,
  "while": WorkflowNodeComponent,
  "command": WorkflowNodeComponent,
  "http": WorkflowNodeComponent,
  "json": WorkflowNodeComponent,
  "drive-file": WorkflowNodeComponent,
  "drive-read": WorkflowNodeComponent,
  "drive-search": WorkflowNodeComponent,
  "drive-list": WorkflowNodeComponent,
  "drive-folder-list": WorkflowNodeComponent,
  "drive-file-picker": WorkflowNodeComponent,
  "drive-save": WorkflowNodeComponent,
  "preview": WorkflowNodeComponent,
  "dialog": WorkflowNodeComponent,
  "prompt-value": WorkflowNodeComponent,
  "workflow": WorkflowNodeComponent,
  "mcp": WorkflowNodeComponent,
  "sleep": WorkflowNodeComponent,
};

export { WorkflowNodeComponent } from "./WorkflowNodeComponent";
