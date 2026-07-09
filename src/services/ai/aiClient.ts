import type { ChatMessage } from "../../domain/gameDesignToolTypes";
import { getCurrentAuthSession } from "../auth/authSessionService";
import { supabaseClient } from "../supabase/supabaseClient";

export type TextGenerationCapability =
  | "document-chat"
  | "guide-chat"
  | "benchmarking"
  | "concept-generation";

export type TextGenerationRequest = {
  capability: TextGenerationCapability;
  projectId: string;
  moduleId?: string;
  documentId?: string;
  locale?: "pt" | "en";
  instructions?: string;
  contextSnapshot?: string;
  messages: ChatMessage[];
};

export type TextGenerationResult = {
  text: string;
  requestId: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};

export type AiClientErrorCode =
  | "unconfigured"
  | "unauthorized"
  | "invalid_request"
  | "provider_failure"
  | "timeout"
  | "unexpected_error";

type TextGenerationSuccessResponse = {
  ok: true;
  requestId: string;
  text: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};

type TextGenerationErrorResponse = {
  ok: false;
  requestId: string;
  error: {
    code: Exclude<AiClientErrorCode, "unconfigured">;
    message: string;
  };
};

type TextGenerationResponse =
  | TextGenerationSuccessResponse
  | TextGenerationErrorResponse;

export class AiClientError extends Error {
  code: AiClientErrorCode;
  requestId?: string;

  constructor(
    code: AiClientErrorCode,
    message: string,
    options?: { requestId?: string; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = "AiClientError";
    this.code = code;
    this.requestId = options?.requestId;
  }
}

function isTextGenerationResponse(value: unknown): value is TextGenerationResponse {
  if (!value || typeof value !== "object") return false;

  const response = value as Record<string, unknown>;
  return response.ok === true || response.ok === false;
}

function toAiClientError(error: unknown): AiClientError {
  if (error instanceof AiClientError) return error;

  return new AiClientError(
    "unexpected_error",
    "Unable to complete the AI request.",
    { cause: error },
  );
}

async function readFunctionErrorResponse(error: unknown): Promise<TextGenerationResponse | null> {
  const context = (error as { context?: unknown })?.context;

  if (!(context instanceof Response)) return null;

  try {
    const body = await context.clone().json();
    return isTextGenerationResponse(body) ? body : null;
  } catch {
    return null;
  }
}

async function generateText(request: TextGenerationRequest): Promise<TextGenerationResult> {
  if (!supabaseClient) {
    throw new AiClientError(
      "unconfigured",
      "Secure AI is unavailable because Supabase is not configured.",
    );
  }

  const authSession = await getCurrentAuthSession();

  if (authSession.status !== "authenticated") {
    throw new AiClientError(
      "unauthorized",
      "Authentication is required for secure AI.",
    );
  }

  try {
    const { data, error } = await supabaseClient.functions.invoke<TextGenerationResponse>(
      "text-generation",
      {
        body: request,
        headers: {
          Authorization: `Bearer ${authSession.session.access_token}`,
        },
      },
    );

    if (error) {
      const errorResponse = await readFunctionErrorResponse(error);

      if (errorResponse && !errorResponse.ok) {
        throw new AiClientError(errorResponse.error.code, errorResponse.error.message, {
          requestId: errorResponse.requestId,
          cause: error,
        });
      }

      throw new AiClientError(
        "unexpected_error",
        "Unable to complete the AI request.",
        { cause: error },
      );
    }

    if (!isTextGenerationResponse(data)) {
      throw new AiClientError(
        "unexpected_error",
        "Secure AI returned an unexpected response.",
      );
    }

    if (!data.ok) {
      throw new AiClientError(data.error.code, data.error.message, {
        requestId: data.requestId,
      });
    }

    return {
      text: data.text,
      requestId: data.requestId,
      usage: data.usage,
    };
  } catch (error) {
    throw toAiClientError(error);
  }
}

export const aiClient = {
  generateText,
};
