import { ArrowUpRight, MapPinned } from "lucide-react";

import type { MemoryLocation } from "@/lib/memories";

type MemoryMapProps = {
  location: MemoryLocation;
};

function getMapQuery(location: MemoryLocation) {
  if (location.latitude !== undefined && location.longitude !== undefined) {
    return `${location.latitude},${location.longitude}`;
  }

  return [location.label, location.city, location.prefecture, location.country].filter(Boolean).join(", ");
}

export function MemoryMap({ location }: MemoryMapProps) {
  const query = getMapQuery(location);
  const encodedQuery = encodeURIComponent(query);
  const embedUrl = `https://www.google.com/maps?q=${encodedQuery}&output=embed`;
  const externalUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;

  return (
    <section className="memory-map" aria-label={`${location.label}地图`}>
      <div className="memory-map__header">
        <span><MapPinned size={13} strokeWidth={1.5} /> LOCATION / MAP</span>
        <a href={externalUrl} target="_blank" rel="noreferrer">
          在 Google Maps 中打开 <ArrowUpRight size={12} strokeWidth={1.5} />
        </a>
      </div>
      <iframe
        title={`${location.label} Google Maps 地图`}
        src={embedUrl}
        loading="lazy"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </section>
  );
}
