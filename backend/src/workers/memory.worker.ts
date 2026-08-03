import { inngestClient } from '../services/queue/inngest.client';
import { MemoryService } from '../services/memory/memory.service';
import Logger from '../config/logger';

export const extractUserMemoryJob = inngestClient.createFunction(
  { id: 'extract-user-memory', name: 'Extract User Memory', triggers: [{ event: 'memory/extract' }] },
  async ({ event, step }) => {
    const { userId, messages } = event.data;

    await step.run('extract-and-store-memory', async () => {
      Logger.info(`[MemoryWorker] Starting memory extraction for user ${userId}`);
      await MemoryService.addMemory(userId, messages);
      Logger.info(`[MemoryWorker] Finished memory extraction for user ${userId}`);
    });

    return { success: true };
  }
);
