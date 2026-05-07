import type { ChatMessage } from "../../domain/gameDesignToolTypes";

type SendAiMessageRequest = {
  system: string;
  messages: ChatMessage[];
  maxTokens: number;
};

type AnthropicMessagesResponse = {
  content?: {
    text?: string;
  }[];
};

export async function sendAiMessage({
  system,
  messages,
  maxTokens,
}: SendAiMessageRequest): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });
  const data = (await r.json()) as AnthropicMessagesResponse;
  return data.content?.[0]?.text || "Erro.";
}
