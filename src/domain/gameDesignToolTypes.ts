export type ProjectId = string | number;

export type DocumentId = string;

export type StatusKey = "progress" | "done";

export type ViewKey =
  | "landing"
  | "dashboard"
  | "project"
  | "module"
  | "document"
  | "brainstorming"
  | "production"
  | "flow-builder"
  | "mda-guided"
  | "double-a-guided"
  | "fourkeys-guided"
  | "colors-guided"
  | "octalysis-guided"
  | "pens-guided"
  | "tetrad-guided"
  | "ludonarrative-guided"
  | "reedsy-wb-guided"
  | "unity-ld-guided";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type Project = {
  id: ProjectId;
  name: string;
  genre: string;
  platform: string;
  color: string;
  emoji: string;
  progress: number;
};

export type ModuleMeta = {
  id: string;
  icon: string;
  label: string;
  color: string;
  desc: string;
};

export type Document = {
  id: DocumentId;
  title: string;
  content: string;
  messages?: ChatMessage[];
  status: StatusKey;
  createdAt: string;
  updatedAt?: string | null;
  framework?: string;
  flowData?: {
    nodes: {
      id: string;
      type: string;
      x: number;
      y: number;
      w?: number;
      h?: number;
      label: string;
    }[];
    edges: {
      id: string;
      from: string;
      to: string;
      fromPort?: string;
      toPort?: string;
      label?: string;
    }[];
  };
};

export type ProjectModuleData = {
  docs?: Document[];
  tasks?: {
    id: string;
    title: string;
    desc: string;
    priority: string;
    category: string;
    column: string;
    createdAt: string;
    updatedAt?: string | null;
  }[];
  elements?: {
    id: string;
    type: string;
    x: number;
    y: number;
    w: number;
    h: number;
    text?: string;
    color?: string;
    textColor?: string;
    src?: string;
    fontSize?: number;
  }[];
  strokes?: {
    id: string;
    points: { x: number; y: number }[];
    color: string;
    width: number;
  }[];
};

export type DocumentModuleData = ProjectModuleData & { docs: Document[] };

export type ProjectData = {
  [projectId: string]: Record<string, ProjectModuleData | undefined> | undefined;
  [projectId: number]: Record<string, ProjectModuleData | undefined> | undefined;
};

export type ConfirmState = { type: "delete" | "clone"; id: ProjectId } | { type: "deleteDoc"; id: DocumentId } | null;

export type ModeChoice = "choice" | null;

export type MechanicNewMode = "choice" | "frameworks" | null;
