import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { workspacesApi } from '../api/workspaces.api';
import { Workspace } from '../lib/types';

export function useWorkspaces() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const token = await getToken();
      return workspacesApi.getWorkspaces(token);
    },
    enabled: isLoaded && isSignedIn,
  });
}

export function useWorkspace(id: string) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  
  const pollingIntervalStr = process.env.NEXT_PUBLIC_POLLING_INTERVAL;
  const POLLING_INTERVAL = pollingIntervalStr ? parseInt(pollingIntervalStr, 10) : 5000;

  return useQuery({
    queryKey: ['workspaces', id],
    queryFn: async () => {
      const token = await getToken();
      return workspacesApi.getWorkspace(id, token);
    },
    enabled: !!id && isLoaded && isSignedIn,
    refetchInterval: (query) => {
      const data = query.state?.data as Workspace | undefined;
      if (!data) return false;
      const isProcessing = data.sources?.some(
        (s) => s.status !== 'READY' && s.status !== 'FAILED'
      );
      return isProcessing ? POLLING_INTERVAL : false;
    },
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const token = await getToken();
      return workspacesApi.createWorkspace(data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return workspacesApi.deleteWorkspace(id, token);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.removeQueries({ queryKey: ['workspaces', id] });
    },
  });
}
