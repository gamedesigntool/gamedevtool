import type { Document, DocumentId, DocumentModuleData } from "./gameDesignToolTypes";

export function addDocumentToModule(moduleData: DocumentModuleData, document: Document): DocumentModuleData {
  return { ...moduleData, docs: [...(moduleData.docs || []), document] };
}

export function updateDocumentContent(
  moduleData: DocumentModuleData,
  documentId: DocumentId,
  content: string,
  updatedAt: string,
): DocumentModuleData {
  return {
    ...moduleData,
    docs: moduleData.docs.map((document) =>
      document.id === documentId ? { ...document, content, updatedAt } : document,
    ),
  };
}

export function renameDocumentInModule(
  moduleData: DocumentModuleData,
  documentId: DocumentId,
  title: string,
): DocumentModuleData {
  return {
    ...moduleData,
    docs: moduleData.docs.map((document) => (document.id === documentId ? { ...document, title } : document)),
  };
}

export function toggleDocumentStatusInModule(
  moduleData: DocumentModuleData,
  documentId: DocumentId,
): DocumentModuleData {
  return {
    ...moduleData,
    docs: moduleData.docs.map((document) =>
      document.id === documentId
        ? { ...document, status: document.status === "progress" ? "done" : "progress" }
        : document,
    ),
  };
}

export function deleteDocumentFromModule(
  moduleData: DocumentModuleData,
  documentId: DocumentId,
): DocumentModuleData {
  return { ...moduleData, docs: moduleData.docs.filter((document) => document.id !== documentId) };
}
