import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { sourcesApi } from '../api/sources.api';

export function useUploadSource(workspaceId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      const token = await getToken();
      return sourcesApi.uploadSourceFile(workspaceId, file, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId] });
    },
  });
}

export function useRegisterUrlSource(workspaceId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (payload: { url: string, name?: string, type: 'website' | 'youtube' }) => {
      const token = await getToken();
      return sourcesApi.registerUrlSource(workspaceId, payload, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId] });
    },
  });
}

export function useDeleteSource(workspaceId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (sourceId: string) => {
      const token = await getToken();
      return sourcesApi.deleteSource(workspaceId, sourceId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId] });
    },
  });
}

export function useRetrySource(workspaceId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (sourceId: string) => {
      const token = await getToken();
      return sourcesApi.retrySource(workspaceId, sourceId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId] });
    },
  });
}

export function useSourceViewBlob(workspaceId: string, sourceId: string | undefined) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['source-view-blob', workspaceId, sourceId],
    queryFn: async () => {
      if (!sourceId) return null;
      const token = await getToken();
      return sourcesApi.getSourceViewBlob(workspaceId, sourceId, token);
    },
    enabled: !!workspaceId && !!sourceId && isLoaded && isSignedIn,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
}
