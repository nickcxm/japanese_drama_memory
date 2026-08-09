"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Camera, Film, MapPin, RefreshCw } from "lucide-react";

import { MemoryImage } from "@/components/memory-image";
import type { Memory, MemoryKind } from "@/lib/memories";

type MemoryArchiveProps = {
  memories: Memory[];
  initialSelectedId: string;
};

const kindLabels: Record<MemoryKind, string> = {
  drama: "日剧画面",
  travel: "旅行片段",
  advertisement: "广告考古",
  object: "生活物件",
};

function formatDate(date: string | null) {
  if (!date) return "拍摄时间未记录";
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "long" }).format(new Date(date));
}

export default function MemoryArchive({ memories, initialSelectedId }: MemoryArchiveProps) {
  const [selectedId, setSelectedId] = useState(initialSelectedId || memories[0]?.id || "");
  const selectedMemory = memories.find((memory) => memory.id === selectedId) ?? memories[0];
  const selectedIndex = Math.max(0, memories.findIndex((memory) => memory.id === selectedMemory?.id));

  useEffect(() => {
    if (memories.length < 2) return;

    const randomizeOnLoad = window.setTimeout(() => {
      setSelectedId(memories[Math.floor(Math.random() * memories.length)].id);
    }, 0);

    return () => window.clearTimeout(randomizeOnLoad);
  }, [memories]);

  const showRandomMemory = () => {
    if (memories.length < 2) return;
    const candidates = memories.filter((memory) => memory.id !== selectedMemory?.id);
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    if (next) setSelectedId(next.id);
  };

  if (!selectedMemory) {
    return <main className="site-shell"><div className="empty-state">还没有可展示的记忆。</div></main>;
  }

  return (
    <main className="site-shell site-shell--memory">
      <nav className="topbar topbar--quiet" aria-label="主导航">
        <a className="brand" href="#memory" aria-label="日本的记忆，回到当前记忆">
          <span className="brand__mark">余白</span>
          <span className="brand__name">日本的记忆</span>
        </a>
        <div className="topbar__meta">
          <span className="topbar__edition">A PERSONAL ARCHIVE</span>
          <a className="quiet-link" href="/archive">记忆索引</a>
          <button className="quiet-button" type="button" onClick={showRandomMemory}>
            换一段记忆 <RefreshCw size={14} strokeWidth={1.8} />
          </button>
        </div>
      </nav>

      <section className="memory-page" id="memory" aria-label="随机记忆">
        <div className="memory-page__aside" aria-hidden="true">
          <span>SCENE</span>
          <span>PLACE</span>
          <span>THING</span>
        </div>

        <div className="memory-page__heading">
          <span className="memory-page__index">{String(selectedIndex + 1).padStart(2, "0")}</span>
          <p className="memory-page__kind">{kindLabels[selectedMemory.kind]}</p>
          <p className="memory-page__series">{selectedMemory.series ?? "一段还没有名字的路"}</p>
        </div>

        <div className="memory-visual">
          <MemoryImage key={selectedMemory.id} memory={selectedMemory} featured />
          <div className="memory-visual__caption" aria-label="画面基础信息">
            <span>{selectedMemory.series ?? kindLabels[selectedMemory.kind]}</span>
            <strong>{selectedMemory.location?.label ?? "室内场景"}</strong>
          </div>
        </div>

        <div className="memory-copy">
          <p className="memory-copy__kicker">{selectedMemory.titleEn}</p>
          <h1>{selectedMemory.title}</h1>
          <p className="memory-copy__story">{selectedMemory.story}</p>

          {selectedMemory.history && (
            <div className="history-note history-note--light">
              <span className="history-note__label">HISTORY THREAD</span>
              <strong>{selectedMemory.history.title}</strong>
              <p>{selectedMemory.history.summary}</p>
              {selectedMemory.history.sourceUrl && (
                <a href={selectedMemory.history.sourceUrl} target="_blank" rel="noreferrer">
                  查阅资料 <ArrowUpRight size={13} strokeWidth={1.5} />
                </a>
              )}
            </div>
          )}

          <dl className="memory-facts">
            <div>
              <dt><MapPin size={13} /> 地点</dt>
              <dd>{selectedMemory.location?.label ?? "室内场景"}</dd>
            </div>
            <div>
              <dt><Camera size={13} /> 时间</dt>
              <dd>{formatDate(selectedMemory.capturedAt)}</dd>
            </div>
            <div>
              <dt><Film size={13} /> 场景</dt>
              <dd>{selectedMemory.scene ?? "场景信息未记录"}</dd>
            </div>
          </dl>
        </div>

        <div className="memory-page__footer">
          <div className="tag-row" aria-label="记忆标签">
            {selectedMemory.tags.slice(0, 5).map((tag) => <span className="tag" key={tag}>#{tag}</span>)}
          </div>
          <button className="next-memory" type="button" onClick={showRandomMemory}>
            <span>再看一段</span>
            <ArrowUpRight size={17} strokeWidth={1.5} />
          </button>
        </div>
      </section>

      <footer className="footer footer--quiet">
        <span>日本的记忆</span>
        <span>SCENES, PLACES &amp; THINGS</span>
      </footer>
    </main>
  );
}
