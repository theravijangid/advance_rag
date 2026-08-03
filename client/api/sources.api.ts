import { apiConnector } from '../lib/api-client';
import { Source } from '../lib/types';

export const sourcesApi = {
  uploadSourceFile: async (workspaceId: string, file: File, token: string | null): Promise<Source> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiConnector.post<Source>(
      `/workspaces/${workspaceId}/sources`,
      formData,
      token,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },

  registerUrlSource: async (
    workspaceId: string,
    data: { url: string },
    token: string | null
  ): Promise<Source> => {
    return apiConnector.post<Source>(`/workspaces/${workspaceId}/sources/url`, data, token);
  },

  deleteSource: async (workspaceId: string, sourceId: string, token: string | null): Promise<void> => {
    return apiConnector.delete<void>(`/workspaces/${workspaceId}/sources/${sourceId}`, token);
  },

  retrySource: async (workspaceId: string, sourceId: string, token: string | null): Promise<Source> => {
    return apiConnector.post<Source>(`/workspaces/${workspaceId}/sources/${sourceId}/retry`, {}, token);
  },

  getSourceViewBlob: async (workspaceId: string, sourceId: string, token: string | null): Promise<Blob> => {
    return apiConnector.get<Blob>(`/workspaces/${workspaceId}/sources/${sourceId}/view`, token, { responseType: 'blob' });
  },
};
