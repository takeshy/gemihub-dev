import type { WorkflowNodeType } from "~/engine/types";

export interface NodePropertyDef {
  key: string;
  label: string;
  required: boolean;
  placeholder?: string;
  multiline?: boolean;
  options?: string[];
}

export function getNodePropertyDefs(type: WorkflowNodeType): NodePropertyDef[] {
  switch (type) {
    case "variable":
      return [
        { key: "name", label: "Name", required: true, placeholder: "myVar" },
        { key: "value", label: "Value", required: false, placeholder: "hello" },
      ];
    case "set":
      return [
        { key: "name", label: "Name", required: true, placeholder: "myVar" },
        { key: "value", label: "Value", required: true, placeholder: "{{result}}" },
      ];
    case "if":
      return [
        { key: "condition", label: "Condition", required: true, placeholder: "{{x}} > 10" },
      ];
    case "while":
      return [
        { key: "condition", label: "Condition", required: true, placeholder: "{{count}} < 5" },
      ];
    case "command":
      return [
        { key: "prompt", label: "Prompt", required: true, multiline: true, placeholder: "Summarize the following text: {{input}}" },
        { key: "model", label: "Model", required: false, placeholder: "gemini-2.0-flash" },
        { key: "saveTo", label: "Save To", required: false, placeholder: "result" },
        { key: "systemPrompt", label: "System Prompt", required: false, multiline: true },
      ];
    case "http":
      return [
        { key: "url", label: "URL", required: true, placeholder: "https://api.example.com" },
        { key: "method", label: "Method", required: false, options: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
        { key: "headers", label: "Headers", required: false, multiline: true, placeholder: '{"Authorization": "Bearer ..."}' },
        { key: "body", label: "Body", required: false, multiline: true },
        { key: "saveTo", label: "Save To", required: false, placeholder: "response" },
      ];
    case "json":
      return [
        { key: "source", label: "Source", required: true, placeholder: "{{data}}" },
        { key: "path", label: "JSON Path", required: true, placeholder: "$.items[0].name" },
        { key: "saveTo", label: "Save To", required: false, placeholder: "extracted" },
      ];
    case "drive-file":
      return [
        { key: "path", label: "Path", required: true, placeholder: "notes/output.md" },
        { key: "content", label: "Content", required: false, multiline: true, placeholder: "{{result}}" },
        { key: "mode", label: "Mode", required: false, options: ["create", "append", "overwrite"] },
      ];
    case "drive-read":
      return [
        { key: "path", label: "Path", required: true, placeholder: "notes/input.md" },
        { key: "saveTo", label: "Save To", required: false, placeholder: "fileContent" },
      ];
    case "drive-search":
      return [
        { key: "query", label: "Query", required: true, placeholder: "search keywords" },
        { key: "saveTo", label: "Save To", required: false, placeholder: "results" },
      ];
    case "drive-list":
      return [
        { key: "folder", label: "Folder", required: false, placeholder: "notes/" },
        { key: "saveTo", label: "Save To", required: false, placeholder: "files" },
      ];
    case "drive-folder-list":
      return [
        { key: "folder", label: "Folder", required: false, placeholder: "/" },
        { key: "saveTo", label: "Save To", required: false, placeholder: "folders" },
      ];
    case "drive-file-picker":
      return [
        { key: "title", label: "Title", required: false, placeholder: "Select a file" },
        { key: "extensions", label: "Extensions", required: false, placeholder: "md,txt,yaml" },
        { key: "saveTo", label: "Save To", required: false, placeholder: "selectedFile" },
      ];
    case "drive-save":
      return [
        { key: "source", label: "Source", required: true, placeholder: "{{content}}" },
        { key: "path", label: "Path", required: true, placeholder: "output/result.md" },
      ];
    case "preview":
      return [
        { key: "content", label: "Content", required: true, multiline: true, placeholder: "{{result}}" },
      ];
    case "dialog":
      return [
        { key: "title", label: "Title", required: false, placeholder: "Choose an option" },
        { key: "message", label: "Message", required: false, multiline: true },
        { key: "options", label: "Options (comma-sep)", required: false, placeholder: "opt1,opt2,opt3" },
        { key: "button1", label: "Button 1", required: false, placeholder: "OK" },
        { key: "button2", label: "Button 2", required: false, placeholder: "Cancel" },
        { key: "saveTo", label: "Save To", required: false, placeholder: "choice" },
      ];
    case "prompt-value":
      return [
        { key: "title", label: "Title", required: false, placeholder: "Enter a value" },
        { key: "defaultValue", label: "Default", required: false },
        { key: "multiline", label: "Multiline", required: false, options: ["true", "false"] },
        { key: "saveTo", label: "Save To", required: false, placeholder: "userInput" },
      ];
    case "workflow":
      return [
        { key: "path", label: "Path", required: false, placeholder: "sub-workflow.yaml" },
        { key: "name", label: "Name", required: false, placeholder: "Sub Workflow" },
      ];
    case "mcp":
      return [
        { key: "url", label: "Server URL", required: true, placeholder: "http://localhost:3001" },
        { key: "tool", label: "Tool", required: true, placeholder: "tool_name" },
        { key: "arguments", label: "Arguments", required: false, multiline: true, placeholder: '{"key": "value"}' },
        { key: "saveTo", label: "Save To", required: false, placeholder: "mcpResult" },
      ];
    case "sleep":
      return [
        { key: "duration", label: "Duration (ms)", required: true, placeholder: "1000" },
      ];
    default:
      return [];
  }
}
