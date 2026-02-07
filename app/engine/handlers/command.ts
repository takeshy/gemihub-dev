import { GoogleGenAI } from "@google/genai";
import type { WorkflowNode, ExecutionContext, ServiceContext, PromptCallbacks } from "../types";
import { replaceVariables } from "./utils";

export interface CommandNodeResult {
  usedModel: string;
}

export async function handleCommandNode(
  node: WorkflowNode,
  context: ExecutionContext,
  serviceContext: ServiceContext,
  _promptCallbacks?: PromptCallbacks
): Promise<CommandNodeResult> {
  const promptTemplate = node.properties["prompt"];
  if (!promptTemplate) throw new Error("Command node missing 'prompt' property");

  const prompt = replaceVariables(promptTemplate, context);
  const originalPrompt = prompt;

  const modelName = replaceVariables(node.properties["model"] || "gemini-2.5-flash", context);
  const apiKey = serviceContext.geminiApiKey;

  if (!apiKey) throw new Error("Gemini API key not configured");

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
  });

  const fullResponse = response.text || "";

  const saveTo = node.properties["saveTo"];
  if (saveTo) {
    context.variables.set(saveTo, fullResponse);
    context.lastCommandInfo = {
      nodeId: node.id,
      originalPrompt,
      saveTo,
    };
  }

  return { usedModel: modelName };
}
