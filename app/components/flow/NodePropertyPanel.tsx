import { useCallback } from "react";
import { X } from "lucide-react";
import type { Node } from "@xyflow/react";
import type { FlowNodeData } from "~/utils/workflow-to-reactflow";
import type { WorkflowNodeType } from "~/engine/types";

// Define which properties each node type uses
const NODE_PROPERTIES: Record<WorkflowNodeType, { key: string; label: string; multiline?: boolean }[]> = {
  "variable": [
    { key: "name", label: "Variable Name" },
    { key: "value", label: "Value" },
  ],
  "set": [
    { key: "name", label: "Variable Name" },
    { key: "value", label: "Expression" },
  ],
  "if": [
    { key: "condition", label: "Condition" },
  ],
  "while": [
    { key: "condition", label: "Condition" },
  ],
  "command": [
    { key: "prompt", label: "Prompt", multiline: true },
    { key: "model", label: "Model" },
    { key: "saveTo", label: "Save To" },
    { key: "attachments", label: "Attachments" },
  ],
  "http": [
    { key: "url", label: "URL" },
    { key: "method", label: "Method" },
    { key: "contentType", label: "Content Type" },
    { key: "headers", label: "Headers", multiline: true },
    { key: "body", label: "Body", multiline: true },
    { key: "saveTo", label: "Save To" },
    { key: "saveStatus", label: "Save Status To" },
    { key: "throwOnError", label: "Throw on Error" },
  ],
  "json": [
    { key: "source", label: "Source Variable" },
    { key: "saveTo", label: "Save To" },
  ],
  "drive-file": [
    { key: "path", label: "File Path" },
    { key: "content", label: "Content", multiline: true },
    { key: "mode", label: "Mode (overwrite/append/create)" },
  ],
  "drive-read": [
    { key: "path", label: "File Path" },
    { key: "saveTo", label: "Save To" },
  ],
  "drive-search": [
    { key: "query", label: "Search Query" },
    { key: "searchContent", label: "Search Content (true/false)" },
    { key: "limit", label: "Limit" },
    { key: "saveTo", label: "Save To" },
  ],
  "drive-list": [
    { key: "folder", label: "Folder" },
    { key: "limit", label: "Limit" },
    { key: "saveTo", label: "Save To" },
  ],
  "drive-folder-list": [
    { key: "folder", label: "Parent Folder" },
    { key: "saveTo", label: "Save To" },
  ],
  "drive-file-picker": [
    { key: "title", label: "Dialog Title" },
    { key: "path", label: "Direct Path (skip dialog)" },
    { key: "extensions", label: "Extensions (csv)" },
    { key: "saveTo", label: "Save To" },
    { key: "savePathTo", label: "Save Path To" },
  ],
  "drive-save": [
    { key: "source", label: "Source Variable" },
    { key: "path", label: "Save Path" },
    { key: "savePathTo", label: "Save Path To" },
  ],
  "preview": [
    { key: "path", label: "File Path" },
    { key: "saveTo", label: "Save To" },
  ],
  "dialog": [
    { key: "title", label: "Title" },
    { key: "message", label: "Message", multiline: true },
    { key: "options", label: "Options (comma-separated)" },
    { key: "multiSelect", label: "Multi-Select (true/false)" },
    { key: "markdown", label: "Markdown (true/false)" },
    { key: "button1", label: "Button 1" },
    { key: "button2", label: "Button 2" },
    { key: "inputTitle", label: "Input Title" },
    { key: "multiline", label: "Multiline Input (true/false)" },
    { key: "saveTo", label: "Save To" },
  ],
  "prompt-value": [
    { key: "title", label: "Prompt Title" },
    { key: "default", label: "Default Value" },
    { key: "multiline", label: "Multiline (true/false)" },
    { key: "saveTo", label: "Save To" },
  ],
  "workflow": [
    { key: "path", label: "Workflow Path" },
    { key: "name", label: "Workflow Name" },
    { key: "input", label: "Input Mapping (JSON)", multiline: true },
    { key: "output", label: "Output Mapping (JSON)", multiline: true },
    { key: "prefix", label: "Variable Prefix" },
  ],
  "mcp": [
    { key: "url", label: "MCP Server URL" },
    { key: "tool", label: "Tool Name" },
    { key: "args", label: "Arguments (JSON)", multiline: true },
    { key: "headers", label: "Headers (JSON)", multiline: true },
    { key: "saveTo", label: "Save To" },
  ],
  "sleep": [
    { key: "duration", label: "Duration (ms)" },
  ],
};

interface NodePropertyPanelProps {
  node: Node<FlowNodeData>;
  onClose: () => void;
  onUpdateNode: (nodeId: string, properties: Record<string, string>) => void;
  onDeleteNode: (nodeId: string) => void;
}

export function NodePropertyPanel({
  node,
  onClose,
  onUpdateNode,
  onDeleteNode,
}: NodePropertyPanelProps) {
  const flowData = node.data as unknown as FlowNodeData;
  const wNode = flowData.workflowNode;
  const properties = NODE_PROPERTIES[wNode.type] || [];

  const handleChange = useCallback(
    (key: string, value: string) => {
      const newProps = { ...wNode.properties, [key]: value };
      if (value === "") {
        delete newProps[key];
      }
      onUpdateNode(node.id, newProps);
    },
    [node.id, wNode.properties, onUpdateNode]
  );

  return (
    <div className="w-full bg-white dark:bg-gray-900 overflow-y-auto">
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">{wNode.type}</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {node.id}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-3 space-y-3">
        {/* Node ID */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Node ID
          </label>
          <input
            type="text"
            value={node.id}
            disabled
            className="w-full px-2 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-500"
          />
        </div>

        {/* Properties */}
        {properties.map((prop) => (
          <div key={prop.key}>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              {prop.label}
            </label>
            {prop.multiline ? (
              <textarea
                value={wNode.properties[prop.key] || ""}
                onChange={(e) => handleChange(prop.key, e.target.value)}
                rows={3}
                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-y"
              />
            ) : (
              <input
                type="text"
                value={wNode.properties[prop.key] || ""}
                onChange={(e) => handleChange(prop.key, e.target.value)}
                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            )}
          </div>
        ))}

        {/* Delete button */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => onDeleteNode(node.id)}
            className="w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 border border-red-300 dark:border-red-700 rounded transition-colors"
          >
            Delete Node
          </button>
        </div>
      </div>
    </div>
  );
}
