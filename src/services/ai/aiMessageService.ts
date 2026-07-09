import type { ChatMessage } from "../../domain/gameDesignToolTypes";
import { AiClientError, aiClient, type TextGenerationCapability } from "./aiClient";

type SendAiMessageRequest = {
  capability: TextGenerationCapability;
  projectId: string | number;
  moduleId?: string;
  documentId?: string;
  locale?: "pt" | "en";
  system?: string;
  messages: ChatMessage[];
  maxTokens: number;
  fallback?: string;
};

export async function sendAiMessage(request: SendAiMessageRequest): Promise<string> {
  const response = await aiClient.generateText({
    capability: request.capability,
    projectId: String(request.projectId),
    moduleId: request.moduleId,
    documentId: request.documentId,
    locale: request.locale,
    instructions: request.system,
    messages: request.messages,
  });

  return response.text;
}

export function getAiMessageErrorText(error: unknown): string {
  const code = error instanceof AiClientError ? error.code : "unexpected_error";
  const requestId = error instanceof AiClientError ? error.requestId : undefined;

  const message = {
    unconfigured: "A IA segura precisa do Supabase configurado para funcionar.",
    unauthorized: "Entre na sua conta para usar a IA neste projeto.",
    invalid_request: "Não foi possível enviar esta solicitação para a IA.",
    rate_limited: "Você atingiu o limite diário de uso da IA. Tente novamente amanhã.",
    timeout: "A IA demorou demais para responder. Tente novamente.",
    provider_failure: "Não foi possível gerar uma resposta agora. Tente novamente em instantes.",
    unexpected_error: "Não foi possível concluir a solicitação de IA.",
  }[code];

  return requestId ? `${message} ID da solicitação: ${requestId}` : message;
}
