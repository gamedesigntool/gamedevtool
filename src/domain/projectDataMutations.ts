import type { ProjectData, ProjectId, ProjectModuleData } from "./gameDesignToolTypes";

export function setProjectModuleData(
  projectData: ProjectData,
  projectId: ProjectId,
  moduleId: string,
  moduleData: ProjectModuleData,
): ProjectData {
  return {
    ...projectData,
    [projectId]: {
      ...(projectData[projectId] || {}),
      [moduleId]: moduleData,
    },
  };
}
