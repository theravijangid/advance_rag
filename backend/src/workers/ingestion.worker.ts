import { inngestClient } from '../services/queue/inngest.client';
import { SourceIngestionProcessor } from './ingestion.processor';

export const processSourceJob = inngestClient.createFunction(
  { 
    id: 'ingest-source', 
    name: 'Ingest Document Source',
    triggers: [{ event: 'source/ingest' }]
  },
  async ({ event, step }) => {
    const { workspaceId, sourceId } = event.data;

    await step.run('process-source', async () => {
      await SourceIngestionProcessor.processSource(workspaceId, sourceId);
    });

    return { success: true, sourceId };
  }
);
