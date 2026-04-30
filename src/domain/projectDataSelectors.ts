import type { Document, DocumentModuleData, ProjectData, ProjectId } from "./gameDesignToolTypes";

export function getProjectModuleData(
  projectData: ProjectData,
  projectId?: ProjectId | null,
  moduleId?: string | null,
): DocumentModuleData {
  if (projectId == null || !moduleId) return { docs: [] };
  const data = projectData?.[projectId]?.[moduleId] || {};
  return { ...data, docs: data.docs || [] };
}

export function getProjectModuleDocuments(
  projectData: ProjectData,
  projectId?: ProjectId | null,
  moduleId?: string | null,
): Document[] {
  return getProjectModuleData(projectData, projectId, moduleId).docs || [];
}
