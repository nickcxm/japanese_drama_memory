"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, MapPin, Search, X } from "lucide-react";
import Link from "next/link";

import { MemoryImage } from "@/components/memory-image";
import { MemoryMap } from "@/components/memory-map";
import type { Memory, MemoryKind } from "@/lib/memories";

type MemoryIndexProps = {
  memories: Memory[];
};

const kindLabels: Record<MemoryKind, string> = {
  drama: "日剧画面",
  travel: "旅行片段",
  advertisement: "广告考古",
  object: "生活物件",
};

function formatDate(date: string | null) {
  if (!date) return "时间未记录";
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "long" }).format(new Date(date));
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

export default function MemoryIndex({ memories }: MemoryIndexProps) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [previewMemory, setPreviewMemory] = useState<Memory | null>(null);

  const tagOptions = useMemo(() => {
    return Array.from(new Set(memories.flatMap((memory) => memory.tags))).sort((a, b) => a.localeCompare(b, "zh-CN"));
  }, [memories]);

  const filteredMemories = useMemo(() => {
    const normalizedQuery = normalize(query);
    const normalizedTag = activeTag ? normalize(activeTag) : null;

    return memories.filter((memory) => {
      const searchable = [
        ...memory.tags,
        ...memory.keywords,
        memory.title,
        memory.titleEn ?? "",
        memory.series ?? "",
        memory.location?.label ?? "",
      ].map(normalize);

      const matchesQuery = !normalizedQuery || searchable.some((value) => value.includes(normalizedQuery));
      const matchesTag = !normalizedTag || memory.tags.some((tag) => normalize(tag) === normalizedTag);
      return matchesQuery && matchesTag;
    });
  }, [activeTag, memories, query]);

  useEffect(() => {
    if (!previewMemory) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewMemory(null);
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [previewMemory]);

  return (
    <main className="site-shell site-shell--index">
      <nav className="topbar topbar--quiet" aria-label="主导航">
        <Link className="brand" href="/" aria-label="日本的记忆，回到首页">
          <span className="brand__mark">余白</span>
          <span className="brand__name">日本的记忆</span>
        </Link>
        <div className="topbar__meta">
          <span className="topbar__edition">MEMORY INDEX</span>
          <Link className="quiet-link" href="/">回到随机记忆</Link>
        </div>
      </nav>

      <header className="index-header">
        <div>
          <p className="index-header__eyebrow">MEMORY ARCHIVE / INDEX</p>
          <h1>记忆索引</h1>
          <p className="index-header__intro">从标签、物件和路过的地点，重新找到一帧画面。</p>
        </div>
        <p className="index-header__count"><strong>{filteredMemories.length}</strong> / {memories.length} 条记忆</p>
      </header>

      <section className="index-tools" aria-label="搜索与筛选">
        <label className="index-search">
          <Search size={16} strokeWidth={1.5} aria-hidden="true" />
          <span className="sr-only">搜索标签或关键词</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索标签、关键词、剧名或地点"
          />
          {query && (
            <button className="index-search__clear" type="button" onClick={() => setQuery("")} aria-label="清除搜索">
              <X size={15} strokeWidth={1.6} />
            </button>
          )}
        </label>
        <div className="index-tags" aria-label="标签筛选">
          <button
            className={`index-tag ${activeTag === null ? "is-active" : ""}`}
            type="button"
            onClick={() => setActiveTag(null)}
          >
            全部
          </button>
          {tagOptions.map((tag) => (
            <button
              className={`index-tag ${activeTag === tag ? "is-active" : ""}`}
              type="button"
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      </section>

      {filteredMemories.length > 0 ? (
        <section className="memory-grid" aria-label="记忆列表">
          {filteredMemories.map((memory, index) => (
            <article className="memory-card" key={memory.id}>
              <button
                className="memory-card__preview"
                type="button"
                onClick={() => setPreviewMemory(memory)}
                aria-label={`预览：${memory.title}`}
              >
                <div className="memory-card__media">
                  <MemoryImage key={memory.id} memory={memory} />
                  <span className="memory-card__zoom">点击预览 <ArrowUpRight size={13} strokeWidth={1.5} /></span>
                </div>
              </button>
              <div className="memory-card__body">
                <div className="memory-card__meta">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>{kindLabels[memory.kind]}</span>
                </div>
                <h2>{memory.title}</h2>
                <p className="memory-card__series">{memory.series ?? memory.titleEn ?? "一段生活片段"}</p>
                <dl className="memory-card__facts">
                  <div>
                    <dt><MapPin size={12} /> 地点</dt>
                    <dd>{memory.location?.label ?? "室内场景"}</dd>
                  </div>
                  <div>
                    <dt><CalendarDays size={12} /> 时间</dt>
                    <dd>{formatDate(memory.capturedAt)}</dd>
                  </div>
                </dl>
                <div className="tag-row" aria-label={`${memory.title} 的标签`}>
                  {memory.tags.map((tag) => <button className="tag tag--button" type="button" key={tag} onClick={() => setActiveTag(tag)}>#{tag}</button>)}
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="index-empty">
          <p>没有找到这段记忆。</p>
          <button type="button" onClick={() => { setQuery(""); setActiveTag(null); }}>清除筛选</button>
        </div>
      )}

      <footer className="footer footer--quiet">
        <span>日本的记忆</span>
        <span>SCENES, PLACES &amp; THINGS</span>
      </footer>

      {previewMemory && (
        <div className="memory-preview" role="presentation" onMouseDown={() => setPreviewMemory(null)}>
          <div className="memory-preview__dialog" role="dialog" aria-modal="true" aria-label={`${previewMemory.title} 图片预览`} onMouseDown={(event) => event.stopPropagation()}>
            <button className="memory-preview__close" type="button" onClick={() => setPreviewMemory(null)} aria-label="关闭图片预览">
              <X size={20} strokeWidth={1.4} />
            </button>
            <div className="memory-preview__media">
              <MemoryImage key={`${previewMemory.id}-preview`} memory={previewMemory} featured />
            </div>
            <div className="memory-preview__copy">
              <p className="memory-preview__eyebrow">{kindLabels[previewMemory.kind]} / {previewMemory.series ?? "生活片段"}</p>
              <h2>{previewMemory.title}</h2>
              <p>{previewMemory.location?.label ?? "室内场景"} · {formatDate(previewMemory.capturedAt)}</p>
              <div className="tag-row" aria-label="预览记忆的标签">
                {previewMemory.tags.map((tag) => <span className="tag" key={tag}>#{tag}</span>)}
              </div>
              {previewMemory.location && <MemoryMap location={previewMemory.location} />}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
