import type { TextMessage } from "../contracts.ts";

export type TextProviderRequest = {
  systemInstruction: string;
  messages: TextMessage[];
  maxOutputTokens: number;
  timeoutMs: number;
  requestId: string;
};

export type TextProviderResponse = {
  text: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};

export type TextProviderErrorCode = "provider_failure" | "timeout";

export class TextProviderError extends Error {
  code: TextProviderErrorCode;
  status?: number;

  constructor(
    code: TextProviderErrorCode,
    message: string,
    options?: { status?: number; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = "TextProviderError";
    this.code = code;
    this.status = options?.status;
  }
}

export type TextProvider = {
  generateText(request: TextProviderRequest): Promise<TextProviderResponse>;
};
