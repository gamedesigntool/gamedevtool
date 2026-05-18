import type { Project } from "../../domain/gameDesignToolTypes";
import { localProjectRepository } from "../../repositories/projectRepository";

export function loadInitialProjects(fallback: Project[]): Promise<Project[]> {
  return localProjectRepository.loadProjects({ fallback });
}
