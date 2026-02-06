import {
  Variable, Settings, GitBranch, RotateCw, Brain, Globe, Braces,
  FileText, FileSearch, FolderOpen, FolderTree, FilePlus, Save,
  Eye, MessageSquare, TextCursorInput, Workflow, Plug, Timer
} from "lucide-react";
import type { WorkflowNodeType } from "~/engine/types";

interface PaletteItem {
  type: WorkflowNodeType;
  label: string;
  icon: typeof Variable;
  category: string;
  defaultProps: Record<string, string>;
}

const PALETTE_ITEMS: PaletteItem[] = [
  // Control Flow
  { type: "variable", label: "Variable", icon: Variable, category: "Control Flow", defaultProps: { name: "myVar", value: "" } },
  { type: "set", label: "Set", icon: Settings, category: "Control Flow", defaultProps: { name: "", value: "" } },
  { type: "if", label: "If", icon: GitBranch, category: "Control Flow", defaultProps: { condition: "" } },
  { type: "while", label: "While", icon: RotateCw, category: "Control Flow", defaultProps: { condition: "" } },
  { type: "sleep", label: "Sleep", icon: Timer, category: "Control Flow", defaultProps: { duration: "1000" } },

  // AI
  { type: "command", label: "LLM Command", icon: Brain, category: "AI & LLM", defaultProps: { prompt: "", saveTo: "result" } },

  // Drive
  { type: "drive-file", label: "Write File", icon: FileText, category: "Google Drive", defaultProps: { path: "", content: "", mode: "overwrite" } },
  { type: "drive-read", label: "Read File", icon: FileSearch, category: "Google Drive", defaultProps: { path: "", saveTo: "" } },
  { type: "drive-search", label: "Search Files", icon: FileSearch, category: "Google Drive", defaultProps: { query: "", saveTo: "" } },
  { type: "drive-list", label: "List Files", icon: FolderOpen, category: "Google Drive", defaultProps: { saveTo: "" } },
  { type: "drive-folder-list", label: "List Folders", icon: FolderTree, category: "Google Drive", defaultProps: { saveTo: "" } },
  { type: "drive-file-picker", label: "File Picker", icon: FilePlus, category: "Google Drive", defaultProps: { title: "Select a file", saveTo: "" } },
  { type: "drive-save", label: "Save File", icon: Save, category: "Google Drive", defaultProps: { source: "", path: "" } },
  { type: "preview", label: "Preview", icon: Eye, category: "Google Drive", defaultProps: { path: "" } },

  // Interactive
  { type: "dialog", label: "Dialog", icon: MessageSquare, category: "Interactive", defaultProps: { title: "Dialog", message: "", button1: "OK" } },
  { type: "prompt-value", label: "Input", icon: TextCursorInput, category: "Interactive", defaultProps: { title: "Input", saveTo: "" } },

  // External
  { type: "http", label: "HTTP Request", icon: Globe, category: "External", defaultProps: { url: "", method: "GET", saveTo: "" } },
  { type: "mcp", label: "MCP Tool", icon: Plug, category: "External", defaultProps: { url: "", tool: "", saveTo: "" } },

  // Data
  { type: "json", label: "JSON Parse", icon: Braces, category: "Data", defaultProps: { source: "", saveTo: "" } },

  // Integration
  { type: "workflow", label: "Sub-Workflow", icon: Workflow, category: "Integration", defaultProps: { path: "" } },
];

interface NodePaletteProps {
  onAddNode: (type: WorkflowNodeType, defaultProps: Record<string, string>) => void;
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  const categories = [...new Set(PALETTE_ITEMS.map(i => i.category))];

  return (
    <div className="w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Nodes
        </h3>
        {categories.map(category => (
          <div key={category} className="mb-4">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              {category}
            </h4>
            <div className="space-y-1">
              {PALETTE_ITEMS.filter(i => i.category === category).map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    onClick={() => onAddNode(item.type, item.defaultProps)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors text-left"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/workflow-node", JSON.stringify({
                        type: item.type,
                        defaultProps: item.defaultProps,
                      }));
                      e.dataTransfer.effectAllowed = "move";
                    }}
                  >
                    <Icon size={14} className="flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
