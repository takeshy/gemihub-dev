import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Variable, Settings, GitBranch, RotateCw, Brain, Globe, Braces,
  FileText, FileSearch, FolderOpen, FolderTree, FilePlus, Save,
  Eye, MessageSquare, TextCursorInput, Workflow, Plug, Timer
} from "lucide-react";
import type { FlowNodeData } from "~/utils/workflow-to-reactflow";
import type { WorkflowNodeType } from "~/engine/types";

const nodeConfig: Record<WorkflowNodeType, {
  icon: typeof Variable;
  color: string;
  bgColor: string;
  category: string;
}> = {
  "variable":          { icon: Variable, color: "text-purple-600", bgColor: "bg-purple-50 border-purple-300 dark:bg-purple-950 dark:border-purple-700", category: "Control" },
  "set":               { icon: Settings, color: "text-purple-600", bgColor: "bg-purple-50 border-purple-300 dark:bg-purple-950 dark:border-purple-700", category: "Control" },
  "if":                { icon: GitBranch, color: "text-orange-600", bgColor: "bg-orange-50 border-orange-300 dark:bg-orange-950 dark:border-orange-700", category: "Control" },
  "while":             { icon: RotateCw, color: "text-orange-600", bgColor: "bg-orange-50 border-orange-300 dark:bg-orange-950 dark:border-orange-700", category: "Control" },
  "command":           { icon: Brain, color: "text-blue-600", bgColor: "bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-700", category: "AI" },
  "http":              { icon: Globe, color: "text-green-600", bgColor: "bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-700", category: "External" },
  "json":              { icon: Braces, color: "text-gray-600", bgColor: "bg-gray-50 border-gray-300 dark:bg-gray-800 dark:border-gray-600", category: "Data" },
  "drive-file":        { icon: FileText, color: "text-emerald-600", bgColor: "bg-emerald-50 border-emerald-300 dark:bg-emerald-950 dark:border-emerald-700", category: "Drive" },
  "drive-read":        { icon: FileSearch, color: "text-emerald-600", bgColor: "bg-emerald-50 border-emerald-300 dark:bg-emerald-950 dark:border-emerald-700", category: "Drive" },
  "drive-search":      { icon: FileSearch, color: "text-emerald-600", bgColor: "bg-emerald-50 border-emerald-300 dark:bg-emerald-950 dark:border-emerald-700", category: "Drive" },
  "drive-list":        { icon: FolderOpen, color: "text-emerald-600", bgColor: "bg-emerald-50 border-emerald-300 dark:bg-emerald-950 dark:border-emerald-700", category: "Drive" },
  "drive-folder-list": { icon: FolderTree, color: "text-emerald-600", bgColor: "bg-emerald-50 border-emerald-300 dark:bg-emerald-950 dark:border-emerald-700", category: "Drive" },
  "drive-file-picker": { icon: FilePlus, color: "text-emerald-600", bgColor: "bg-emerald-50 border-emerald-300 dark:bg-emerald-950 dark:border-emerald-700", category: "Drive" },
  "drive-save":        { icon: Save, color: "text-emerald-600", bgColor: "bg-emerald-50 border-emerald-300 dark:bg-emerald-950 dark:border-emerald-700", category: "Drive" },
  "preview":           { icon: Eye, color: "text-cyan-600", bgColor: "bg-cyan-50 border-cyan-300 dark:bg-cyan-950 dark:border-cyan-700", category: "Drive" },
  "dialog":            { icon: MessageSquare, color: "text-yellow-600", bgColor: "bg-yellow-50 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-700", category: "Interactive" },
  "prompt-value":      { icon: TextCursorInput, color: "text-yellow-600", bgColor: "bg-yellow-50 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-700", category: "Interactive" },
  "workflow":          { icon: Workflow, color: "text-indigo-600", bgColor: "bg-indigo-50 border-indigo-300 dark:bg-indigo-950 dark:border-indigo-700", category: "Integration" },
  "mcp":               { icon: Plug, color: "text-red-600", bgColor: "bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-700", category: "External" },
  "sleep":             { icon: Timer, color: "text-gray-600", bgColor: "bg-gray-50 border-gray-300 dark:bg-gray-800 dark:border-gray-600", category: "Control" },
};

export function WorkflowNodeComponent({ data, selected }: NodeProps) {
  const flowData = data as unknown as FlowNodeData;
  const nodeType = flowData.workflowNode.type;
  const config = nodeConfig[nodeType] || nodeConfig["variable"];
  const Icon = config.icon;

  return (
    <div
      className={`px-3 py-2 rounded-lg border-2 shadow-sm min-w-[180px] max-w-[240px] ${config.bgColor} ${
        selected ? "ring-2 ring-blue-500 ring-offset-1" : ""
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-3 !h-3" />

      <div className="flex items-center gap-2">
        <Icon size={16} className={`${config.color} flex-shrink-0`} />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">
            {nodeType}
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {flowData.label}
          </div>
        </div>
      </div>

      {(nodeType === "if" || nodeType === "while") ? (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="!bg-green-500 !w-3 !h-3"
            style={{ left: "30%" }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="!bg-red-500 !w-3 !h-3"
            style={{ left: "70%" }}
          />
        </>
      ) : (
        <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !w-3 !h-3" />
      )}
    </div>
  );
}
