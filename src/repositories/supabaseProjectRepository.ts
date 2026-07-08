import type { Project, ProjectId } from "../domain/gameDesignToolTypes";
import { supabaseClient } from "../services/supabase/supabaseClient";

type ProjectRow = {
  id: string;
  name: string;
  genre: string;
  platform: string;
  color: string;
  emoji: string;
  progress: number;
};

type ProjectInsert = {
  name: string;
  genre?: string;
  platform?: string;
  color: string;
  emoji: string;
  progress?: number;
};

export type CreateCloudProjectInput = {
  name: string;
  genre?: string;
  platform?: string;
  color: string;
  emoji: string;
  progress?: number;
};

export type CloneCloudProjectOverrides = Partial<
  Pick<Project, "name" | "genre" | "platform" | "color" | "emoji" | "progress">
>;

export class SupabaseProjectRepositoryError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "SupabaseProjectRepositoryError";
  }
}

const PROJECT_COLUMNS = "id,name,genre,platform,color,emoji,progress";

function requireSupabaseClient() {
  if (!supabaseClient) {
    throw new SupabaseProjectRepositoryError("Supabase client is not configured");
  }

  return supabaseClient;
}

function normalizeText(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function toProjectInsert(input: CreateCloudProjectInput): ProjectInsert {
  return {
    name: normalizeText(input.name, ""),
    genre: normalizeText(input.genre, "Indefinido"),
    platform: normalizeText(input.platform, "Indefinida"),
    color: input.color,
    emoji: input.emoji,
    progress: input.progress ?? 0,
  };
}

function toCloudProjectId(projectId: ProjectId): string {
  if (typeof projectId !== "string") {
    throw new SupabaseProjectRepositoryError("Cloud project ids must be strings");
  }

  return projectId;
}

export function mapProjectRowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    genre: row.genre,
    platform: row.platform,
    color: row.color,
    emoji: row.emoji,
    progress: row.progress,
  };
}

async function loadProjects(): Promise<Project[]> {
  const client = requireSupabaseClient();

  const { data, error } = await client
    .from("projects")
    .select(PROJECT_COLUMNS)
    .order("created_at", { ascending: true });

  if (error) {
    throw new SupabaseProjectRepositoryError("Failed to load cloud projects", {
      cause: error,
    });
  }

  return ((data ?? []) as ProjectRow[]).map(mapProjectRowToProject);
}

async function createProject(input: CreateCloudProjectInput): Promise<Project> {
  const client = requireSupabaseClient();
  const projectInsert = toProjectInsert(input);

  if (!projectInsert.name) {
    throw new SupabaseProjectRepositoryError("Project name is required");
  }

  const { data, error } = await client
    .from("projects")
    .insert(projectInsert)
    .select(PROJECT_COLUMNS)
    .single();

  if (error) {
    throw new SupabaseProjectRepositoryError("Failed to create cloud project", {
      cause: error,
    });
  }

  return mapProjectRowToProject(data as ProjectRow);
}

async function deleteProject(projectId: ProjectId): Promise<void> {
  const client = requireSupabaseClient();

  const { error } = await client
    .from("projects")
    .delete()
    .eq("id", toCloudProjectId(projectId));

  if (error) {
    throw new SupabaseProjectRepositoryError("Failed to delete cloud project", {
      cause: error,
    });
  }
}

async function cloneProject(
  sourceProject: Project,
  overrides: CloneCloudProjectOverrides = {},
): Promise<Project> {
  return createProject({
    name: overrides.name ?? sourceProject.name + " (Cópia)",
    genre: overrides.genre ?? sourceProject.genre,
    platform: overrides.platform ?? sourceProject.platform,
    color: overrides.color ?? sourceProject.color,
    emoji: overrides.emoji ?? sourceProject.emoji,
    progress: overrides.progress ?? 0,
  });
}

export const supabaseProjectRepository = {
  loadProjects,
  createProject,
  deleteProject,
  cloneProject,
};
