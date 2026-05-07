import type { ChatMessage } from "../../domain/gameDesignToolTypes";

type SendAiMessageRequest = {
  system?: string;
  messages: ChatMessage[];
  maxTokens: number;
  fallback?: string;
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
  fallback = "Erro.",
}: SendAiMessageRequest): Promise<string> {
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    ...(system ? { system } : {}),
    messages,
  };

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await r.json()) as AnthropicMessagesResponse;
  return data.content?.[0]?.text || fallback;
}
