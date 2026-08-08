"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Camera,
  ChevronRight,
  Compass,
  Film,
  ImagePlus,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  TrainFront,
} from "lucide-react";

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

const kindIcons: Record<MemoryKind, typeof Film> = {
  drama: Film,
  travel: TrainFront,
  advertisement: Sparkles,
  object: Camera,
};

function getMemorySearchText(memory: Memory) {
  return [
    memory.title,
    memory.titleEn,
    memory.series,
    memory.episode,
    memory.scene,
    memory.story,
    memory.capturedAt,
    memory.location?.label,
    memory.location?.city,
    memory.location?.prefecture,
    ...memory.tags,
    ...memory.keywords,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}

function formatDate(date: string | null) {
  if (!date) return "日期待确认";
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(new Date(date));
}

export default function MemoryArchive({ memories, initialSelectedId }: MemoryArchiveProps) {
  const [query, setQuery] = useState("");
  const [activeKind, setActiveKind] = useState<MemoryKind | "all">("all");
  const [selectedId, setSelectedId] = useState(initialSelectedId || memories[0]?.id || "");

  const selectedMemory = memories.find((memory) => memory.id === selectedId) ?? memories[0];
  const tags = useMemo(
    () => Array.from(new Set(memories.flatMap((memory) => memory.tags))).slice(0, 12),
    [memories],
  );
  const filteredMemories = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return memories.filter((memory) => {
      const matchesKind = activeKind === "all" || memory.kind === activeKind;
      const matchesQuery = !normalizedQuery || getMemorySearchText(memory).includes(normalizedQuery);
      return matchesKind && matchesQuery;
    });
  }, [activeKind, memories, query]);

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

  const jumpToArchive = () => {
    document.getElementById("archive")?.scrollIntoView({ behavior: "smooth" });
  };

  const uniqueLocations = new Set(memories.map((memory) => memory.location?.label).filter(Boolean)).size;

  return (
    <main className="site-shell">
      <nav className="topbar" aria-label="主导航">
        <a className="brand" href="#top" aria-label="日本的记忆，回到首页">
          <span className="brand__mark">余白</span>
          <span className="brand__name">日本的记忆</span>
        </a>
        <div className="topbar__meta">
          <span className="topbar__edition">PERSONAL ARCHIVE / 01</span>
          <button className="quiet-button" type="button" onClick={showRandomMemory}>
            随机一页 <RefreshCw size={14} strokeWidth={1.8} />
          </button>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero__copy">
          <p className="eyebrow"><span className="eyebrow__dot" /> 记忆档案 / MEMORY ARCHIVE</p>
          <h1>从一帧画面，<br /><em>回到一段日本。</em></h1>
          <p className="hero__intro">
            记录日剧里擦肩而过的地点、物件与广告，也记录我亲自走过的路。每一张图，都是时间留下的小小证据。
          </p>
          <div className="hero__actions">
            <button className="primary-button" type="button" onClick={jumpToArchive}>
              浏览记忆索引 <ArrowUpRight size={16} />
            </button>
            <span className="hero__note">现在从 3 个待整理片段开始</span>
          </div>
        </div>

        <aside className="feature-panel" aria-label="随机记忆">
          <div className="feature-panel__header">
            <span>随机记忆 / FEATURED MEMORY</span>
            <button className="icon-button" type="button" onClick={showRandomMemory} aria-label="换一条随机记忆">
              <RefreshCw size={16} />
            </button>
          </div>
          {selectedMemory ? (
            <>
              <div className="feature-panel__art">
                <MemoryImage memory={selectedMemory} featured />
                <div className="feature-panel__stamp">{selectedMemory.status === "draft" ? "DRAFT" : "ARCHIVE"}</div>
              </div>
              <div className="feature-panel__body">
                <div className="card-kicker"><Film size={13} /> {kindLabels[selectedMemory.kind]}</div>
                <h2>{selectedMemory.title}</h2>
                <p className="feature-panel__english">{selectedMemory.titleEn}</p>
                <p className="feature-panel__story">{selectedMemory.story}</p>
                {selectedMemory.history && (
                  <div className="history-note">
                    <span className="history-note__label">HISTORY THREAD / 历史线索</span>
                    <strong>{selectedMemory.history.title}</strong>
                    <p>{selectedMemory.history.summary}</p>
                  </div>
                )}
                <div className="feature-panel__facts">
                  <span><MapPin size={14} /> {selectedMemory.location?.label ?? "地点待确认"}</span>
                  <span><Camera size={14} /> {formatDate(selectedMemory.capturedAt)}</span>
                </div>
                <div className="tag-row" aria-label="记忆标签">
                  {selectedMemory.tags.slice(0, 4).map((tag) => <span className="tag" key={tag}>#{tag}</span>)}
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">还没有可展示的记忆。</div>
          )}
        </aside>
      </section>

      <section className="stats-strip" aria-label="档案统计">
        <div><strong>{String(memories.length).padStart(2, "0")}</strong><span>记忆片段</span></div>
        <div><strong>{String(tags.length).padStart(2, "0")}</strong><span>关键词标签</span></div>
        <div><strong>{String(uniqueLocations).padStart(2, "0")}</strong><span>已标记地点</span></div>
        <p>一张图，对应一个 URL。<br />本地原图始终保留。</p>
      </section>

      <section className="archive-section" id="archive">
        <div className="section-heading">
          <div>
            <p className="eyebrow">INDEX / 记忆索引</p>
            <h2>按标签，重新遇见它们。</h2>
          </div>
          <p className="section-heading__aside">记录的不只是画面，<br />还有画面以外的历史。</p>
        </div>

        <div className="archive-toolbar">
          <label className="search-box">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">搜索记忆</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索日剧、地点、啤酒、广告……"
            />
            {query && <button type="button" className="search-clear" onClick={() => setQuery("")} aria-label="清除搜索">×</button>}
          </label>
          <div className="filter-row" aria-label="记忆类型筛选">
            <button className={`filter-pill ${activeKind === "all" ? "is-active" : ""}`} type="button" onClick={() => setActiveKind("all")}>全部</button>
            {(Object.keys(kindLabels) as MemoryKind[]).map((kind) => {
              const Icon = kindIcons[kind];
              return <button className={`filter-pill ${activeKind === kind ? "is-active" : ""}`} type="button" onClick={() => setActiveKind(kind)} key={kind}><Icon size={14} /> {kindLabels[kind]}</button>;
            })}
          </div>
        </div>

        <div className="tag-cloud" aria-label="热门标签">
          <span className="tag-cloud__label"><Tag size={14} /> 热门标签</span>
          {tags.map((tag) => <button type="button" key={tag} className={`tag tag--button ${query === tag ? "is-selected" : ""}`} onClick={() => setQuery(tag)}>#{tag}</button>)}
        </div>

        <div className="archive-result-line">
          <span>{filteredMemories.length} 条记录</span>
          {query && <span className="archive-result-line__query">正在搜索 “{query}”</span>}
        </div>

        {filteredMemories.length > 0 ? (
          <div className="memory-grid">
            {filteredMemories.map((memory, index) => {
              const Icon = kindIcons[memory.kind];
              return (
                <article className={`memory-card ${selectedMemory?.id === memory.id ? "is-featured" : ""}`} key={memory.id}>
                  <button className="memory-card__select" type="button" onClick={() => setSelectedId(memory.id)} aria-label={`查看${memory.title}`}>
                    <div className="memory-card__art"><MemoryImage memory={memory} /></div>
                    <div className="memory-card__topline"><span>{String(index + 1).padStart(2, "0")} / {String(filteredMemories.length).padStart(2, "0")}</span><span>{memory.status === "draft" ? "待整理" : "已归档"}</span></div>
                  </button>
                  <div className="memory-card__body">
                    <div className="card-kicker"><Icon size={13} /> {kindLabels[memory.kind]}</div>
                    <h3>{memory.title}</h3>
                    <p className="memory-card__english">{memory.titleEn}</p>
                    <div className="memory-card__meta"><span>{memory.series ?? "独立旅行记忆"}</span><span>{memory.episode ?? "EP · 待确认"}</span></div>
                    <p className="memory-card__story">{memory.story}</p>
                    <div className="tag-row">{memory.tags.map((tag) => <span className="tag" key={tag}>#{tag}</span>)}</div>
                    <button className="text-link" type="button" onClick={() => setSelectedId(memory.id)}>展开这条记忆 <ChevronRight size={15} /></button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="no-results"><Search size={20} /><strong>没有找到这组记忆。</strong><span>试试其他关键词，或清除筛选条件。</span><button className="text-link" type="button" onClick={() => { setQuery(""); setActiveKind("all"); }}>清除筛选 <ChevronRight size={15} /></button></div>
        )}
      </section>

      <section className="collection-note">
        <div className="collection-note__icon"><ImagePlus size={22} /></div>
        <div>
          <p className="eyebrow">NEXT CHAPTER / 下一章</p>
          <h2>把原图交给时间，也交给我。</h2>
          <p>收到照片后，我会先读取拍摄时间与 GPS 信息，再和你确认地点、集数和画面线索。图片会保存在本地，并可额外上传一份到 Imgur；远程链接失效时，网站自动回退到本地原图。</p>
        </div>
        <div className="collection-note__route"><Compass size={16} /> 旅行 · 广告 · 日剧 · 物件</div>
      </section>

      <footer className="footer"><span>日本的记忆 / A personal archive of scenes, places & things.</span><span>MADE WITH TIME · 2026</span></footer>
    </main>
  );
}
