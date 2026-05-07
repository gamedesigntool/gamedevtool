import type { Project, ProjectId } from "./gameDesignToolTypes";

export type CreateProjectInput = {
  name: string;
  genre: string;
  platform: string;
};

export function createProjectEntity(
  input: CreateProjectInput,
  id: ProjectId,
  color: string,
  emoji: string,
): Project {
  return {
    id,
    name: input.name,
    genre: input.genre || "Indefinido",
    platform: input.platform || "Indefinida",
    color,
    emoji,
    progress: 0,
  };
}

export function addProject(projects: Project[], project: Project): Project[] {
  return [...projects, project];
}

export function removeProject(projects: Project[], projectId: ProjectId): Project[] {
  return projects.filter((project) => project.id !== projectId);
}

export function cloneProjectInList(
  projects: Project[],
  projectId: ProjectId,
  newId: ProjectId,
  color: string,
  emoji: string,
): Project[] {
  const sourceProject = projects.find((project) => project.id === projectId);
  if (!sourceProject) return projects;
  return [
    ...projects,
    {
      ...sourceProject,
      id: newId,
      name: sourceProject.name + " (Cópia)",
      color,
      emoji,
      progress: 0,
    },
  ];
}
