import { IngestionQueue, IngestionJobPayload } from "./queue.interface";
import { inngestClient } from "./inngest.client";

export class InngestAdapter implements IngestionQueue {
  async enqueueSource(payload: IngestionJobPayload): Promise<void> {
    await inngestClient.send({
      name: "source/ingest",
      data: payload,
    });
  }
}

export const ingestionQueue = new InngestAdapter();
