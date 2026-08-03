import { Router } from 'express';
import { serve } from 'inngest/express';
import { inngestClient } from '../services/queue/inngest.client';
import { processSourceJob } from '../workers/ingestion.worker';
import { extractUserMemoryJob } from '../workers/memory.worker';

const router = Router();

router.use(
  '/',
  serve({
    client: inngestClient,
    functions: [processSourceJob, extractUserMemoryJob],
  })
);

export default router;
