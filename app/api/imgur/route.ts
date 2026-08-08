const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const clientId = process.env.IMGUR_CLIENT_ID?.trim();

  if (!clientId) {
    return Response.json(
      { error: "IMGUR_CLIENT_ID is not configured on the server." },
      { status: 503 },
    );
  }

  const incoming = await request.formData();
  const file = incoming.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "A file field is required." }, { status: 400 });
  }

  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
    return Response.json(
      { error: "The image must be larger than 0 bytes and no larger than 10 MB." },
      { status: 400 },
    );
  }

  const payload = new FormData();
  payload.append("image", new Blob([await file.arrayBuffer()], { type: file.type }), file.name);

  const response = await fetch("https://api.imgur.com/3/image", {
    method: "POST",
    headers: { Authorization: `Client-ID ${clientId}` },
    body: payload,
  });

  const result = (await response.json()) as {
    success?: boolean;
    data?: { id?: string; link?: string; deletehash?: string };
    error?: string | { message?: string };
  };

  if (!response.ok || !result.success || !result.data?.link) {
    const message =
      typeof result.error === "string"
        ? result.error
        : result.error?.message || "Imgur rejected the upload.";

    return Response.json({ error: message }, { status: response.status || 502 });
  }

  return Response.json({
    id: result.data.id ?? null,
    url: result.data.link,
    deleteHash: result.data.deletehash ?? null,
    source: "imgur",
  });
}
