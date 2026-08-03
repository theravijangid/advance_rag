import { systemPromptConfig } from '../../enums/system_prompts'
import { MemoryClient } from 'mem0ai'
import { streamText } from 'ai'
import appConfig from '../../config/config'
import Logger from '../../config/logger'
import { ModelRegistry } from '../rag/model-registry.service'
import { enumConfig } from '../../enums/enums'

export class MemoryService {
  private static getClient() {
    if (!appConfig.mem0.apiKey) {
      Logger.warn('[MemoryService] MEM0_API_KEY is not set. Memory operations will fail.')
    }
    return new MemoryClient({ apiKey: appConfig.mem0.apiKey })
  }

  static async addMemory(userId: string, messages: { role: 'user' | 'assistant'; content: string }[]) {
    try {
      const client = this.getClient()
      await client.add(messages, { user_id: userId })
      Logger.info(`[MemoryService] Successfully extracted and stored memory for user ${userId}`)
    } catch (error) {
      Logger.error(`[MemoryService] Failed to add memory for user ${userId}: ${error}`)
    }
  }

  static async searchMemory(userId: string, query: string) {
    try {
      const client = this.getClient()
      const results = await client.search(query, {
        filters: {
          user_id: userId,
        },
      })
      return results
    } catch (error) {
      Logger.error(`[MemoryService] Failed to search memory for user ${userId}: ${error}`)
      return []
    }
  }

  static async chatWithMemory(userId: string, messages: any[]) {
    const lastUserMsg = messages[messages.length - 1]?.content || ''
    const memories = await this.searchMemory(userId, lastUserMsg)

    const model = ModelRegistry.getModel(enumConfig.modelPurpose.generalConversation)

    const memoryList = Array.isArray(memories) ? memories : (memories as any).results || []
    const memoryContext = memoryList.map((m: any) => `- ${m.memory}`).join('\n')

    const result = streamText({
      model,
      system: systemPromptConfig.MEMORY_SYSTEM_PROMPT(memoryContext),
      messages,
    })

    return { result }
  }
}
