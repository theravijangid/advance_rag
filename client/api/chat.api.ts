import { apiConnector } from '../lib/api-client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Record<string, any>;
  createdAt: string;
}

export interface ConversationHistory {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export const chatApi = {
  getConversation: async (
    workspaceId: string,
    conversationId: string,
    token: string | null
  ): Promise<ConversationHistory> => {
    return apiConnector.get<ConversationHistory>(
      `/workspaces/${workspaceId}/chat/${conversationId}`,
      token
    );
  },
};
