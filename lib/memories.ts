import path from "node:path";
import { DatabaseSync } from "node:sqlite";

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

export interface MemoryImageUpload {
  provider: string;
  id: string | null;
  url: string;
  deleteHash: string | null;
  uploadedAt: string;
}

export interface MemoryImage {
  localPath: string | null;
  remoteUrl: string | null;
  assetId: string;
  remoteId: string | null;
  remoteDeleteHash: string | null;
  uploads: MemoryImageUpload[];
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

type MemoryRow = {
  id: string;
  kind: MemoryKind;
  title: string;
  title_en: string | null;
  series: string | null;
  episode: string | null;
  scene: string | null;
  location_json: string | null;
  story: string;
  history_json: string | null;
  captured_at: string | null;
  status: MemoryStatus;
  needs_confirmation_json: string;
  asset_id: string;
  local_path: string | null;
  remote_url: string | null;
  remote_id: string | null;
  remote_delete_hash: string | null;
  file_name: string | null;
  width: number | null;
  height: number | null;
  alt: string;
};

type TagRow = { memory_id: string; tag: string };
type KeywordRow = { memory_id: string; keyword: string };
type UploadRow = {
  asset_id: string;
  provider: string;
  provider_id: string | null;
  url: string;
  delete_hash: string | null;
  uploaded_at: string;
};

function parseJson<T>(value: string | null, fallback: T): T {
  return value ? (JSON.parse(value) as T) : fallback;
}

function groupBy<T>(rows: T[], getKey: (row: T) => string) {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const key = getKey(row);
    const current = grouped.get(key) ?? [];
    current.push(row);
    grouped.set(key, current);
  }
  return grouped;
}

export function getMemories(): Memory[] {
  const database = new DatabaseSync(path.join(process.cwd(), "data/memory.db"), { readOnly: true });

  try {
    const rows = database.prepare(`
      SELECT
        m.id, m.kind, m.title, m.title_en, m.series, m.episode, m.scene,
        m.location_json, m.story, m.history_json, m.captured_at, m.status,
        m.needs_confirmation_json,
        i.asset_id, i.local_path, i.remote_url, i.remote_id,
        i.remote_delete_hash, i.file_name, i.width, i.height, i.alt
      FROM memories m
      JOIN image_assets i ON i.memory_id = m.id
      ORDER BY m.rowid
    `).all() as unknown as MemoryRow[];
    const tagRows = database.prepare("SELECT memory_id, tag FROM memory_tags ORDER BY rowid").all() as unknown as TagRow[];
    const keywordRows = database.prepare("SELECT memory_id, keyword FROM memory_keywords ORDER BY rowid").all() as unknown as KeywordRow[];
    const uploadRows = database.prepare(`
      SELECT asset_id, provider, provider_id, url, delete_hash, uploaded_at
      FROM image_uploads ORDER BY upload_id
    `).all() as unknown as UploadRow[];
    const tagsByMemory = groupBy(tagRows, (row) => row.memory_id);
    const keywordsByMemory = groupBy(keywordRows, (row) => row.memory_id);
    const uploadsByAsset = groupBy(uploadRows, (row) => row.asset_id);

    return rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      title: row.title,
      titleEn: row.title_en ?? undefined,
      series: row.series ?? undefined,
      episode: row.episode,
      scene: row.scene,
      location: parseJson<MemoryLocation | null>(row.location_json, null),
      story: row.story,
      history: parseJson<MemoryHistory | null>(row.history_json, null),
      capturedAt: row.captured_at,
      tags: (tagsByMemory.get(row.id) ?? []).map((tag) => tag.tag),
      keywords: (keywordsByMemory.get(row.id) ?? []).map((keyword) => keyword.keyword),
      image: {
        assetId: row.asset_id,
        localPath: row.local_path,
        remoteUrl: row.remote_url,
        remoteId: row.remote_id,
        remoteDeleteHash: row.remote_delete_hash,
        uploads: (uploadsByAsset.get(row.asset_id) ?? []).map((upload) => ({
          provider: upload.provider,
          id: upload.provider_id,
          url: upload.url,
          deleteHash: upload.delete_hash,
          uploadedAt: upload.uploaded_at,
        })),
        fileName: row.file_name,
        width: row.width,
        height: row.height,
        alt: row.alt,
      },
      status: row.status,
      needsConfirmation: parseJson<string[]>(row.needs_confirmation_json, []),
    }));
  } finally {
    database.close();
  }
}
