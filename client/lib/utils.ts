import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractAnnotation(message: any, type: string) {
  if (!message?.annotations || !Array.isArray(message.annotations)) return null;

  for (const item of message.annotations) {
    // Case 1: Historical message directly containing the annotation
    if (item?.type === type) return item;

    // Case 2: Streaming message wrapped in _annotations (AI SDK wrapping)
    if (item?._annotations && Array.isArray(item._annotations)) {
      const found = item._annotations.find((a: any) => a?.type === type);
      if (found) return found;
    }
  }
  return null;
}
