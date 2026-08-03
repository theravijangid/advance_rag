import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { chatApi } from '../api/chat.api';

export function useChatHistory(workspaceId: string, conversationId: string | null) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['chat-history', workspaceId, conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      const token = await getToken();
      return chatApi.getConversation(workspaceId, conversationId, token);
    },
    enabled: !!workspaceId && !!conversationId && isLoaded && isSignedIn,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
