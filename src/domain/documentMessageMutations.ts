import type { ChatMessage, DocumentId, DocumentModuleData, ProjectData, ProjectId } from "./gameDesignToolTypes";

export function setDocumentMessagesInProjectData(
  projectData: ProjectData,
  projectId: ProjectId,
  moduleId: string,
  documentId: DocumentId,
  messages: ChatMessage[],
): ProjectData {
  const rawModuleData = projectData?.[projectId]?.[moduleId] || {};
  const moduleData: DocumentModuleData = { ...rawModuleData, docs: rawModuleData.docs || [] };

  if (!moduleData.docs.some((document) => document.id === documentId)) return projectData;

  return {
    ...projectData,
    [projectId]: {
      ...(projectData[projectId] || {}),
      [moduleId]: {
        ...moduleData,
        docs: moduleData.docs.map((document) =>
          document.id === documentId ? { ...document, messages } : document,
        ),
      },
    },
  };
}

export function appendDocumentMessageInProjectData(
  projectData: ProjectData,
  projectId: ProjectId,
  moduleId: string,
  documentId: DocumentId,
  message: ChatMessage,
): ProjectData {
  const rawModuleData = projectData?.[projectId]?.[moduleId] || {};
  const moduleData: DocumentModuleData = { ...rawModuleData, docs: rawModuleData.docs || [] };
  const document = moduleData.docs.find((item) => item.id === documentId);

  if (!document) return projectData;

  return setDocumentMessagesInProjectData(projectData, projectId, moduleId, documentId, [
    ...(document.messages || []),
    message,
  ]);
}
