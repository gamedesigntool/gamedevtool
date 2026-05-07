import type { Project } from "../domain/gameDesignToolTypes";
import { LS_KEYS, lsGet, lsSet } from "../services/localStorage";

export function getStoredProjects(fallback: Project[]): Project[] {
  return lsGet(LS_KEYS.projects, fallback) as Project[];
}

export function saveStoredProjects(projects: Project[]): void {
  lsSet(LS_KEYS.projects, projects);
}
