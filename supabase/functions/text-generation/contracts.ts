export type TextCapability =
  | "document-chat"
  | "guide-chat"
  | "benchmarking"
  | "concept-generation";

export type TextMessage = {
  role: "user" | "assistant";
  content: string;
};

export type TextGenerationRequest = {
  capability: TextCapability;
  projectId: string;
  moduleId?: string;
  documentId?: string;
  locale?: "pt" | "en";
  instructions?: string;
  contextSnapshot?: string;
  messages: TextMessage[];
};

export type TextGenerationSuccessResponse = {
  ok: true;
  requestId: string;
  text: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};

export type TextGenerationErrorCode =
  | "unauthorized"
  | "invalid_request"
  | "provider_failure"
  | "timeout"
  | "unexpected_error";

export type TextGenerationErrorResponse = {
  ok: false;
  requestId: string;
  error: {
    code: TextGenerationErrorCode;
    message: string;
  };
};

export type TextGenerationResponse =
  | TextGenerationSuccessResponse
  | TextGenerationErrorResponse;

export const TEXT_CAPABILITIES: TextCapability[] = [
  "document-chat",
  "guide-chat",
  "benchmarking",
  "concept-generation",
];
