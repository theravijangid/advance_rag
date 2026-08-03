import { apiConnector } from '../lib/api-client';
import { Workspace } from '../lib/types';

export const workspacesApi = {
  getWorkspaces: async (token: string | null): Promise<Workspace[]> => {
    return apiConnector.get<Workspace[]>('/workspaces', token);
  },

  getWorkspace: async (id: string, token: string | null): Promise<Workspace> => {
    return apiConnector.get<Workspace>(`/workspaces/${id}`, token);
  },

  createWorkspace: async (
    data: { name: string; description?: string },
    token: string | null
  ): Promise<Workspace> => {
    return apiConnector.post<Workspace>('/workspaces', data, token);
  },

  updateWorkspace: async (
    id: string,
    data: { name?: string; description?: string },
    token: string | null
  ): Promise<Workspace> => {
    return apiConnector.put<Workspace>(`/workspaces/${id}`, data, token);
  },

  deleteWorkspace: async (id: string, token: string | null): Promise<void> => {
    return apiConnector.delete<void>(`/workspaces/${id}`, token);
  },
};
