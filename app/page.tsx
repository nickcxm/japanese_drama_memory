import MemoryArchive from "@/components/memory-archive";
import { getMemories } from "@/lib/memories";

export default function Home() {
  const memories = getMemories();
  const initialSelectedId = memories[0]?.id ?? "";

  return <MemoryArchive memories={memories} initialSelectedId={initialSelectedId} />;
}
