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

async function parseAnthropicResponse(response: Response): Promise<AnthropicMessagesResponse> {
  try {
    return (await response.json()) as AnthropicMessagesResponse;
  } catch {
    throw new Error("AI provider returned invalid JSON.");
  }
}

function getResponseText(data: AnthropicMessagesResponse): string {
  const text = data.content?.[0]?.text;
  if (!text) throw new Error("AI provider response did not include text.");
  return text;
}

export async function sendAiMessage(request: SendAiMessageRequest): Promise<string> {
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: request.maxTokens,
    ...(request.system ? { system: request.system } : {}),
    messages: request.messages,
  };

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    throw new Error(`AI provider request failed with status ${r.status}.`);
  }

  return getResponseText(await parseAnthropicResponse(r));
}
