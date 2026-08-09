import type { Metadata } from "next";

import MemoryIndex from "@/components/memory-index";
import { getMemories } from "@/lib/memories";

export const metadata: Metadata = {
  title: "记忆索引 · 日本的记忆",
  description: "按标签、关键词、剧名和地点浏览日本的记忆。",
};

export default function ArchivePage() {
  return <MemoryIndex memories={getMemories()} />;
}
