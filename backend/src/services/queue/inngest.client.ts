import { Inngest } from "inngest";
import { IngestionJobPayload } from "./queue.interface";

type Events = {
  "source/ingest": {
    data: IngestionJobPayload;
  };
  "memory/extract": {
    data: {
      userId: string;
      messages: { role: 'user' | 'assistant'; content: string }[];
    };
  };
};

export const inngestClient = new Inngest({
  id: "adaptive-rag-backend",
  schemas: {
    events: {} as Events,
  },
});
