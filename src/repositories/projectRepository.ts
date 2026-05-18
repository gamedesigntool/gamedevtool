import type { Project } from "../domain/gameDesignToolTypes";
import { LS_KEYS, lsGet, lsSet } from "../services/localStorage";

export type LoadProjectsOptions = {
  fallback: Project[];
};

export type ProjectRepository = {
  loadProjects(options: LoadProjectsOptions): Promise<Project[]>;
  saveProjects(projects: Project[]): Promise<void>;
};

export function getStoredProjects(fallback: Project[]): Project[] {
  return lsGet(LS_KEYS.projects, fallback) as Project[];
}

export function saveStoredProjects(projects: Project[]): void {
  lsSet(LS_KEYS.projects, projects);
}

export const localProjectRepository: ProjectRepository = {
  async loadProjects({ fallback }) {
    return getStoredProjects(fallback);
  },

  async saveProjects(projects) {
    saveStoredProjects(projects);
  },
};
