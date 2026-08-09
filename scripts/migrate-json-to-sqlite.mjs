import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = path.join(projectRoot, "db/schema.sql");
const memoriesPath = path.join(projectRoot, "data/memories.json");
const assetsPath = path.join(projectRoot, "data/image-assets.json");
const databasePath = path.join(projectRoot, "data/memory.db");

function jsonValue(value) {
  return value == null ? null : JSON.stringify(value);
}

function insertUpload(statement, assetId, upload) {
  if (!upload?.provider || !upload.url) return;
  statement.run(
    assetId,
    upload.provider,
    upload.id ?? null,
    upload.url,
    upload.deleteHash ?? null,
    upload.uploadedAt ?? new Date().toISOString(),
  );
}

async function main() {
  if (!existsSync(memoriesPath)) {
    if (existsSync(databasePath)) {
      console.log(`database already exists: ${databasePath}`);
      return;
    }
    throw new Error(`Seed file not found: ${memoriesPath}`);
  }

  const memories = JSON.parse(await readFile(memoriesPath, "utf8"));
  const assetsManifest = existsSync(assetsPath)
    ? JSON.parse(await readFile(assetsPath, "utf8"))
    : { assets: [] };
  const manifestByAssetId = new Map(assetsManifest.assets.map((asset) => [asset.assetId, asset]));
  const database = new DatabaseSync(databasePath);

  try {
    database.exec(readFileSync(schemaPath, "utf8"));
    database.exec("BEGIN");

    const insertMemory = database.prepare(`
      INSERT INTO memories (
        id, kind, title, title_en, series, episode, scene, location_json,
        story, history_json, captured_at, status, needs_confirmation_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        kind = excluded.kind,
        title = excluded.title,
        title_en = excluded.title_en,
        series = excluded.series,
        episode = excluded.episode,
        scene = excluded.scene,
        location_json = excluded.location_json,
        story = excluded.story,
        history_json = excluded.history_json,
        captured_at = excluded.captured_at,
        status = excluded.status,
        needs_confirmation_json = excluded.needs_confirmation_json,
        updated_at = CURRENT_TIMESTAMP
    `);
    const deleteTags = database.prepare("DELETE FROM memory_tags WHERE memory_id = ?");
    const insertTag = database.prepare("INSERT OR IGNORE INTO memory_tags (memory_id, tag) VALUES (?, ?)");
    const deleteKeywords = database.prepare("DELETE FROM memory_keywords WHERE memory_id = ?");
    const insertKeyword = database.prepare("INSERT OR IGNORE INTO memory_keywords (memory_id, keyword) VALUES (?, ?)");
    const insertImage = database.prepare(`
      INSERT INTO image_assets (
        asset_id, memory_id, local_path, remote_url, remote_id,
        remote_delete_hash, file_name, width, height, alt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(asset_id) DO UPDATE SET
        memory_id = excluded.memory_id,
        local_path = excluded.local_path,
        remote_url = excluded.remote_url,
        remote_id = excluded.remote_id,
        remote_delete_hash = excluded.remote_delete_hash,
        file_name = excluded.file_name,
        width = excluded.width,
        height = excluded.height,
        alt = excluded.alt
    `);
    const insertUploadStatement = database.prepare(`
      INSERT OR IGNORE INTO image_uploads
        (asset_id, provider, provider_id, url, delete_hash, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const memory of memories) {
      insertMemory.run(
        memory.id,
        memory.kind,
        memory.title,
        memory.titleEn ?? null,
        memory.series ?? null,
        memory.episode ?? null,
        memory.scene ?? null,
        jsonValue(memory.location),
        memory.story,
        jsonValue(memory.history),
        memory.capturedAt ?? null,
        memory.status ?? "published",
        JSON.stringify(memory.needsConfirmation ?? []),
      );

      deleteTags.run(memory.id);
      for (const tag of memory.tags ?? []) insertTag.run(memory.id, tag);
      deleteKeywords.run(memory.id);
      for (const keyword of memory.keywords ?? []) insertKeyword.run(memory.id, keyword);

      const image = memory.image;
      if (!image?.assetId) throw new Error(`Missing image.assetId for ${memory.id}`);
      insertImage.run(
        image.assetId,
        memory.id,
        image.localPath ?? null,
        image.remoteUrl ?? null,
        image.remoteId ?? null,
        image.remoteDeleteHash ?? null,
        image.fileName ?? null,
        image.width ?? null,
        image.height ?? null,
        image.alt,
      );

      for (const upload of image.uploads ?? []) insertUpload(insertUploadStatement, image.assetId, upload);
      for (const upload of manifestByAssetId.get(image.assetId)?.uploads ?? []) {
        insertUpload(insertUploadStatement, image.assetId, upload);
      }
    }

    database.exec("COMMIT");
    database.exec("PRAGMA optimize");
    console.log(`migrated ${memories.length} memories into ${databasePath}`);
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  } finally {
    database.close();
  }
}

main().catch((error) => {
  console.error(`migration failed: ${error.message}`);
  process.exitCode = 1;
});
