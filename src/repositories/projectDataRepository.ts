import type { ProjectData } from "../domain/gameDesignToolTypes";
import { LS_KEYS, lsGet, lsSet } from "../services/localStorage";

export function getStoredProjectData(fallback: ProjectData): ProjectData {
  return lsGet(LS_KEYS.pData, fallback) as ProjectData;
}

export function saveStoredProjectData(projectData: ProjectData): void {
  lsSet(LS_KEYS.pData, projectData);
}
