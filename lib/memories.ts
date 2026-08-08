import memoriesJson from "@/data/memories.json";

export type MemoryKind = "drama" | "travel" | "advertisement" | "object";
export type MemoryStatus = "draft" | "published";

export interface MemoryLocation {
  label: string;
  city?: string;
  prefecture?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface MemoryHistory {
  subject: string;
  title: string;
  summary: string;
  sourceUrl?: string;
}

export interface MemoryImage {
  localPath: string | null;
  remoteUrl: string | null;
  fileName: string | null;
  width: number | null;
  height: number | null;
  alt: string;
}

export interface Memory {
  id: string;
  kind: MemoryKind;
  title: string;
  titleEn?: string;
  series?: string;
  episode: string | null;
  scene: string | null;
  location: MemoryLocation | null;
  story: string;
  history: MemoryHistory | null;
  capturedAt: string | null;
  tags: string[];
  keywords: string[];
  image: MemoryImage;
  status: MemoryStatus;
  needsConfirmation: string[];
}

export function getMemories(): Memory[] {
  return memoriesJson as Memory[];
}
