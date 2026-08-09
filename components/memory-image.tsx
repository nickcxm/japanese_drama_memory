"use client";

import { useState } from "react";

import type { Memory } from "@/lib/memories";

type MemoryImageProps = {
  memory: Memory;
  featured?: boolean;
};

export function MemoryImage({ memory, featured = false }: MemoryImageProps) {
  const [usingRemote, setUsingRemote] = useState(Boolean(memory.image.remoteUrl));
  const [failed, setFailed] = useState(false);
  const source = usingRemote ? memory.image.remoteUrl : memory.image.localPath;

  if (!source || failed) {
    return (
      <div className={`memory-art memory-art--${memory.kind}`} role="img" aria-label={memory.image.alt}>
        <span className="memory-art__grain" aria-hidden="true" />
        <span className="memory-art__number" aria-hidden="true">
          {memory.id.slice(-2).replace("-", "0")}
        </span>
        <span className="memory-art__label">影像缺席</span>
        <span className="memory-art__caption">
          {featured ? "LOCAL COPY / ON FILE" : "IMAGE UNAVAILABLE"}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="memory-art__image"
      src={source}
      alt={memory.image.alt}
      loading={featured ? "eager" : "lazy"}
      onError={() => {
        if (usingRemote && memory.image.localPath) {
          setUsingRemote(false);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}
