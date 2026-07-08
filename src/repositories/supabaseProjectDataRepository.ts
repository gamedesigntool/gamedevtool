import type { ProjectId, ProjectModuleData } from "../domain/gameDesignToolTypes";
import { supabaseClient } from "../services/supabase/supabaseClient";

export type CloudProjectData = Record<string, ProjectModuleData | undefined>;

type ProjectDataRow = {
  project_id: string;
  data: CloudProjectData | null;
};

export class SupabaseProjectDataRepositoryError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "SupabaseProjectDataRepositoryError";
  }
}

const PROJECT_DATA_COLUMNS = "project_id,data";

function requireSupabaseClient() {
  if (!supabaseClient) {
    throw new SupabaseProjectDataRepositoryError("Supabase client is not configured");
  }

  return supabaseClient;
}

function toCloudProjectId(projectId: ProjectId): string {
  if (typeof projectId !== "string") {
    throw new SupabaseProjectDataRepositoryError("Cloud project ids must be strings");
  }

  return projectId;
}

function normalizeProjectData(data: CloudProjectData): CloudProjectData {
  return JSON.parse(JSON.stringify(data ?? {})) as CloudProjectData;
}

async function loadProjectDataRow(projectId: ProjectId): Promise<ProjectDataRow | null> {
  const client = requireSupabaseClient();

  const { data, error } = await client
    .from("project_data")
    .select(PROJECT_DATA_COLUMNS)
    .eq("project_id", toCloudProjectId(projectId))
    .maybeSingle();

  if (error) {
    throw new SupabaseProjectDataRepositoryError("Failed to load cloud project data", {
      cause: error,
    });
  }

  return (data as ProjectDataRow | null) ?? null;
}

async function loadProjectData(projectId: ProjectId): Promise<CloudProjectData> {
  const row = await loadProjectDataRow(projectId);
  return row?.data ?? {};
}

async function saveProjectData(projectId: ProjectId, data: CloudProjectData): Promise<CloudProjectData> {
  const client = requireSupabaseClient();
  const cloudProjectId = toCloudProjectId(projectId);

  const { data: savedData, error } = await client
    .from("project_data")
    .upsert(
      {
        project_id: cloudProjectId,
        data: normalizeProjectData(data),
      },
      { onConflict: "project_id" },
    )
    .select(PROJECT_DATA_COLUMNS)
    .single();

  if (error) {
    throw new SupabaseProjectDataRepositoryError("Failed to save cloud project data", {
      cause: error,
    });
  }

  return ((savedData as ProjectDataRow).data ?? {}) as CloudProjectData;
}

async function deleteProjectData(projectId: ProjectId): Promise<void> {
  const client = requireSupabaseClient();

  const { error } = await client
    .from("project_data")
    .delete()
    .eq("project_id", toCloudProjectId(projectId));

  if (error) {
    throw new SupabaseProjectDataRepositoryError("Failed to delete cloud project data", {
      cause: error,
    });
  }
}

async function cloneProjectData(
  sourceProjectId: ProjectId,
  targetProjectId: ProjectId,
): Promise<CloudProjectData | null> {
  const sourceRow = await loadProjectDataRow(sourceProjectId);

  if (!sourceRow) {
    return null;
  }

  return saveProjectData(targetProjectId, sourceRow.data ?? {});
}

export const supabaseProjectDataRepository = {
  loadProjectData,
  saveProjectData,
  deleteProjectData,
  cloneProjectData,
};
