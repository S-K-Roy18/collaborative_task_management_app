import { create } from 'zustand';

interface Workspace {
  _id: string;
  name: string;
  description?: string;
  owner: string;
  members: any[];
  inviteCode?: string;
}

interface Organization {
  _id: string;
  name: string;
  owner: string;
  workspaces: Workspace[];
}

interface WorkspaceState {
  activeOrganization: Organization | null;
  activeWorkspace: Workspace | null;
  setActiveOrganization: (org: Organization | null) => void;
  setActiveWorkspace: (workspace: Workspace | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeOrganization: null,
  activeWorkspace: null,
  setActiveOrganization: (org) => set({ activeOrganization: org }),
  setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
}));
