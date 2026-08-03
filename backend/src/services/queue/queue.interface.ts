export interface IngestionJobPayload {
  workspaceId: string;
  sourceId: string;
}

export interface IngestionQueue {
  enqueueSource(payload: IngestionJobPayload): Promise<void>;
}
