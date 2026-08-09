import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const databasePath = path.join(projectRoot, "data/memory.db");
const maxUploadBytes = 10 * 1024 * 1024;

function loadLocalEnv() {
  for (const fileName of [".env.local", ".env"]) {
    const filePath = path.join(projectRoot, fileName);
    if (!existsSync(filePath)) continue;

    for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
      }
    }
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    memoryId: args.find((arg) => arg.startsWith("--memory-id="))?.slice("--memory-id=".length) ?? null,
    force: args.includes("--force"),
  };
}

function imageMimeType(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".gif") return "image/gif";
  if (extension === ".webp") return "image/webp";
  return "image/jpeg";
}

async function uploadImage(filePath, fileName, clientId) {
  const file = await readFile(filePath);
  if (file.length === 0 || file.length > maxUploadBytes) {
    throw new Error(`${fileName} must be larger than 0 bytes and no larger than 10 MB.`);
  }

  const form = new FormData();
  form.append("image", new Blob([file], { type: imageMimeType(fileName) }), fileName);
  const response = await fetch("https://api.imgur.com/3/image", {
    method: "POST",
    headers: { Authorization: `Client-ID ${clientId}` },
    body: form,
  });
  const result = await response.json();

  if (!response.ok || !result.success || !result.data?.link) {
    const error = typeof result.error === "string" ? result.error : result.error?.message;
    throw new Error(error || `Imgur rejected ${fileName} (HTTP ${response.status}).`);
  }

  return {
    provider: "imgur",
    id: result.data.id ?? null,
    url: result.data.link,
    deleteHash: result.data.deletehash ?? null,
    uploadedAt: new Date().toISOString(),
  };
}

async function main() {
  loadLocalEnv();
  const clientId = process.env.IMGUR_CLIENT_ID?.trim();
  if (!clientId) throw new Error("IMGUR_CLIENT_ID is not configured in .env.local or the environment.");
  if (!existsSync(databasePath)) throw new Error(`Database not found: ${databasePath}`);

  const { memoryId, force } = parseArgs();
  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA foreign_keys = ON");

  try {
    const memoryQuery = memoryId
      ? database.prepare(`
          SELECT m.id, i.asset_id, i.local_path, i.file_name
          FROM memories m JOIN image_assets i ON i.memory_id = m.id
          WHERE m.id = ? ORDER BY m.rowid
        `)
      : database.prepare(`
          SELECT m.id, i.asset_id, i.local_path, i.file_name
          FROM memories m JOIN image_assets i ON i.memory_id = m.id
          ORDER BY m.rowid
        `);
    const memories = memoryId ? memoryQuery.all(memoryId) : memoryQuery.all();
    if (memoryId && memories.length === 0) throw new Error(`Memory not found: ${memoryId}`);

    const uploadsQuery = database.prepare(`
      SELECT provider, provider_id, url, delete_hash, uploaded_at
      FROM image_uploads WHERE asset_id = ? ORDER BY upload_id DESC
    `);
    const insertUpload = database.prepare(`
      INSERT INTO image_uploads
        (asset_id, provider, provider_id, url, delete_hash, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const updateImage = database.prepare(`
      UPDATE image_assets
      SET remote_url = ?, remote_id = ?, remote_delete_hash = ?
      WHERE asset_id = ?
    `);

    let uploadedCount = 0;
    for (const memory of memories) {
      const uploads = uploadsQuery.all(memory.asset_id);
      const existingImgur = uploads.find((upload) => upload.provider === "imgur" && upload.url);
      if (existingImgur && !force) {
        console.log(`skip ${memory.asset_id} (${memory.id}): ${existingImgur.url}`);
        continue;
      }

      const localPath = memory.local_path
        ? path.join(projectRoot, "public", memory.local_path.replace(/^\//, ""))
        : null;
      if (!localPath || !existsSync(localPath)) {
        throw new Error(`Local image missing for ${memory.id}: ${memory.local_path}`);
      }

      console.log(`upload ${memory.asset_id} (${memory.id})...`);
      const nextUpload = await uploadImage(localPath, memory.file_name ?? path.basename(localPath), clientId);
      insertUpload.run(
        memory.asset_id,
        nextUpload.provider,
        nextUpload.id,
        nextUpload.url,
        nextUpload.deleteHash,
        nextUpload.uploadedAt,
      );
      updateImage.run(nextUpload.url, nextUpload.id, nextUpload.deleteHash, memory.asset_id);
      uploadedCount += 1;
      console.log(`  ${nextUpload.url}`);
    }

    database.exec("PRAGMA optimize");
    console.log(`done: uploaded ${uploadedCount}, selected ${memories.length}`);
  } finally {
    database.close();
  }
}

main().catch((error) => {
  console.error(`upload failed: ${error.message}`);
  process.exitCode = 1;
});
