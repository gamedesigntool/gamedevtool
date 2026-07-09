import type { TextMessage } from "../contracts.ts";
import {
  TextProviderError,
  type TextProvider,
  type TextProviderRequest,
  type TextProviderResponse,
} from "./textProvider.ts";

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_TEXT_MODEL = "claude-sonnet-4-20250514";

type AnthropicContentBlock = {
  type?: string;
  text?: string;
};

type AnthropicUsage = {
  input_tokens?: number;
  output_tokens?: number;
};

type AnthropicMessagesResponse = {
  content?: AnthropicContentBlock[];
  usage?: AnthropicUsage;
};

function mapMessage(message: TextMessage) {
  return {
    role: message.role,
    content: message.content,
  };
}

function readText(data: AnthropicMessagesResponse): string {
  const text = data.content
    ?.filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new TextProviderError(
      "provider_failure",
      "Text provider returned an empty response.",
    );
  }

  return text;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function createAnthropicTextProvider(): TextProvider {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  const model = Deno.env.get("ANTHROPIC_TEXT_MODEL") || DEFAULT_TEXT_MODEL;

  return {
    async generateText(request: TextProviderRequest): Promise<TextProviderResponse> {
      if (!apiKey) {
        throw new TextProviderError(
          "provider_failure",
          "Text provider is not configured.",
        );
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), request.timeoutMs);

      try {
        const response = await fetch(ANTHROPIC_MESSAGES_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "anthropic-version": ANTHROPIC_VERSION,
            "x-api-key": apiKey,
          },
          signal: controller.signal,
          body: JSON.stringify({
            model,
            max_tokens: request.maxOutputTokens,
            system: request.systemInstruction,
            messages: request.messages.map(mapMessage),
          }),
        });

        if (!response.ok) {
          throw new TextProviderError(
            "provider_failure",
            "Text provider request failed.",
            { status: response.status },
          );
        }

        let data: AnthropicMessagesResponse;

        try {
          data = await response.json() as AnthropicMessagesResponse;
        } catch (error) {
          throw new TextProviderError(
            "provider_failure",
            "Text provider returned invalid JSON.",
            { cause: error },
          );
        }

        return {
          text: readText(data),
          usage: {
            inputTokens: data.usage?.input_tokens,
            outputTokens: data.usage?.output_tokens,
          },
        };
      } catch (error) {
        if (error instanceof TextProviderError) {
          throw error;
        }

        if (isAbortError(error)) {
          throw new TextProviderError(
            "timeout",
            "Text provider request timed out.",
            { cause: error },
          );
        }

        throw new TextProviderError(
          "provider_failure",
          "Text provider request failed.",
          { cause: error },
        );
      } finally {
        clearTimeout(timeoutId);
      }
    },
  };
}
