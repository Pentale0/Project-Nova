import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Check, Loader2, AlertTriangle, WifiOff } from 'lucide-react';
import { searchCatalog, CatalogEntry } from '../data/catalog';
import { MediaCategory } from '../types';
import { playHoverSound, playSelectSound } from '../utils/audio';
import { searchMediaTitles, MediaSearchResult } from '../utils/api';

interface TitleSearchProps {
  category: MediaCategory;
  /** Titles already in the list, to filter out of suggestions. */
  existing: string[];
  onSelect: (entry: { title: string; genres: string[]; year: number }) => void;
  /** Optional async lookup for titles neither the catalog nor live search finds. */
  onAiLookup?: (
    query: string,
    category: MediaCategory
  ) => Promise<{ title: string; year?: number; genres?: string[] }[]>;
  disabled?: boolean;
}

const CATEGORY_LABEL: Record<MediaCategory, string> = {
  movie: 'Movie',
  series: 'Series',
  anime: 'Anime',
  game: 'Game',
  book: 'Book',
  manga: 'Manga',
};

/** Provenance badge shown next to each suggestion. */
const SOURCE_LABEL: Record<string, string> = {
  anilist: 'AniList',
  cinemeta: 'IMDb',
  tvmaze: 'TVmaze',
  steam: 'Steam',
  openlibrary: 'Open Library',
  ai: 'AI',
};

/** One row in the dropdown, however it was found. */
interface Option {
  title: string;
  category: MediaCategory;
  year?: number;
  genres: string[];
  rating?: number;
  /** Catalog-only search blob, unused once an option is chosen. */
  search?: string;
  source: 'catalog' | 'ai' | MediaSearchResult['source'];
  platform?: 'steam';
}

const key = (title: string) => title.trim().toLowerCase();

/**
 * Type-ahead title picker for the culture tab.
 *
 * Three layers, cheapest first:
 *   1. the bundled catalog, which is instant and works offline;
 *   2. live lookup against free public databases (AniList, Cinemeta, TVmaze,
 *      Steam, Open Library) proxied through the server, debounced;
 *   3. the AI lookup, only when both of the above come up empty, so an obscure
 *      title can still be added.
 *
 * Each layer is labelled in the dropdown so it's obvious where a suggestion
 * came from. Full keyboard support: arrows move, Enter picks, Escape closes.
 */
export const TitleSearch: React.FC<TitleSearchProps> = ({
  category,
  existing,
  onSelect,
  onAiLookup,
  disabled,
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const [liveResults, setLiveResults] = useState<MediaSearchResult[] | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  const [aiResults, setAiResults] = useState<
    { title: string; year?: number; genres?: string[] }[] | null
  >(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = 'title-search-listbox';

  const existingLower = useMemo(
    () => existing.map((t) => key(t)),
    [existing]
  );

  // Layer 1: bundled catalog. Synchronous, so the dropdown is never empty
  // while the network round trip is in flight.
  const catalogMatches = useMemo(() => {
    if (!query.trim()) return [];
    return searchCatalog(query, category, 8).filter(
      (m) => !existingLower.includes(key(m.title))
    );
  }, [query, category, existingLower]);

  // Layer 2: live databases.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setLiveResults(null);
      setLiveError(null);
      setLiveLoading(false);
      return;
    }

    const controller = new AbortController();
    setLiveLoading(true);
    setLiveError(null);

    const timer = setTimeout(async () => {
      try {
        const results = await searchMediaTitles({
          query: trimmed,
          category,
          limit: 8,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setLiveResults(
          results
            .filter((r) => !existingLower.includes(key(r.title)))
            .slice(0, 8)
        );
        setLiveError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        // Not fatal: the catalog layer is still usable, so surface it quietly.
        setLiveResults(null);
        setLiveError(
          err instanceof Error ? err.message : 'Live search unavailable.'
        );
      } finally {
        if (!controller.signal.aborted) setLiveLoading(false);
      }
    }, 600);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, category, existingLower]);

  // Layer 3: AI, and only once the cheaper layers have genuinely come up
  // empty for this query. `liveSettled` keeps a failed search from looking
  // like "still loading" and stalling the AI fallback forever.
  const liveSettled =
    query.trim().length < 2 || (!liveLoading && liveResults !== null);
  const needsAi =
    Boolean(query.trim()) &&
    catalogMatches.length === 0 &&
    (liveResults?.length ?? 0) === 0 &&
    liveSettled;

  useEffect(() => {
    if (!needsAi || !onAiLookup) {
      setAiResults(null);
      setAiError(null);
      setAiLoading(false);
      return;
    }

    let cancelled = false;
    setAiLoading(true);
    setAiError(null);

    const timer = setTimeout(async () => {
      try {
        const results = await onAiLookup(query.trim(), category);
        if (cancelled) return;
        setAiResults(
          results
            .filter((r) => !existingLower.includes(key(r.title)))
            .slice(0, 5)
        );
      } catch (err) {
        if (cancelled) return;
        setAiError(
          err instanceof Error ? err.message : 'AI lookup failed. Try again.'
        );
        setAiResults(null);
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [needsAi, onAiLookup, query, existingLower, category]);

  // Merge the layers, dropping titles already offered by an earlier layer so
  // the same film never appears twice.
  const options = useMemo(() => {
    const seen = new Set<string>();
    const merged: Option[] = [];

    const push = (option: Option) => {
      const k = key(option.title);
      if (!k || seen.has(k)) return;
      seen.add(k);
      merged.push(option);
    };

    for (const m of catalogMatches) {
      push({
        title: m.title,
        category: m.category,
        year: m.year,
        genres: m.genres,
        search: m.search,
        source: 'catalog',
      });
    }
    for (const r of liveResults ?? []) {
      push({
        title: r.title,
        category: r.category,
        year: r.year,
        genres: r.genres ?? [],
        rating: r.rating,
        source: r.source,
        platform: r.platform,
      });
    }
    for (const r of aiResults ?? []) {
      push({
        title: r.title,
        category,
        year: r.year,
        genres: r.genres ?? [],
        source: 'ai',
      });
    }

    return merged;
  }, [catalogMatches, liveResults, aiResults, category]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const choose = (entry: { title: string; genres: string[]; year: number }) => {
    playSelectSound();
    onSelect(entry);
    setQuery('');
    setOpen(false);
    setLiveResults(null);
    setAiResults(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlight((h) => (options.length ? (h + 1) % options.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) =>
        options.length ? (h - 1 + options.length) % options.length : 0
      );
    } else if (e.key === 'Enter') {
      if (open && options[highlight]) {
        e.preventDefault();
        const picked = options[highlight];
        choose({
          title: picked.title,
          genres: picked.genres ?? [],
          year: picked.year ?? 0,
        });
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    }
  };

  const showDropdown = open && query.trim().length > 0;
  const hasOptions = options.length > 0;
  const busy = liveLoading || aiLoading;

  return (
    <div ref={rootRef} className="relative">
      <label className="block text-xs uppercase font-extrabold text-sky-100 mb-1">
        Search {CATEGORY_LABEL[category]}:
      </label>

      <div className="relative">
        <Search className="w-4 h-4 text-white/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            showDropdown && options[highlight]
              ? `${listboxId}-opt-${highlight}`
              : undefined
          }
          autoComplete="off"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={`Type to search ${CATEGORY_LABEL[category].toLowerCase()}...`}
          className="w-full pl-9 pr-9 py-1.5 bg-[#002673] border-2 border-white text-xs text-white font-bold placeholder:text-white/40 focus:border-[#38BDF8] focus:outline-none disabled:opacity-50"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setOpen(false);
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-[#FF0055] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        )}

        {busy && (
          <Loader2
            className="w-4 h-4 text-sky-300 absolute right-9 top-1/2 -translate-y-1/2 animate-spin"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="absolute z-30 left-0 right-0 mt-1 bg-[#001740] border-2 border-white shadow-[4px_4px_0px_#001F5C] max-h-72 overflow-y-auto"
          role="listbox"
          id={listboxId}
        >
          {hasOptions ? (
            <>
              {options.map((entry, idx) => {
                const isActive = idx === highlight;
                const meta = [
                  entry.year,
                  (entry.genres ?? []).slice(0, 3).join(', '),
                  entry.rating !== undefined ? `${entry.rating}/100` : '',
                  SOURCE_LABEL[entry.source] ?? '',
                ]
                  .filter(Boolean)
                  .join(' • ');

                return (
                  <div
                    key={`${entry.title}-${idx}`}
                    id={`${listboxId}-opt-${idx}`}
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setHighlight(idx)}
                    onMouseDown={(e) => {
                      // mousedown fires before the input's blur; prevent it
                      // losing focus before the click handler runs.
                      e.preventDefault();
                      choose({
                        title: entry.title,
                        genres: entry.genres ?? [],
                        year: entry.year ?? 0,
                      });
                    }}
                    onMouseUp={(e) => e.preventDefault()}
                    className={`px-2.5 py-2 flex items-center gap-2 cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-white text-[#002673]'
                        : 'text-white hover:bg-[#002673]'
                    }`}
                  >
                    <Check
                      className={`w-3.5 h-3.5 shrink-0 stroke-[3] ${
                        isActive ? 'text-[#FF0055]' : 'text-transparent'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-p3r text-xs font-black truncate">
                        {entry.title}
                      </div>
                      <div
                        className={`text-[10px] font-mono truncate ${
                          isActive ? 'text-[#002673]/70' : 'text-sky-200/80'
                        }`}
                      >
                        {meta}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Steam has no console coverage; say so rather than letting the
                  gap look like "this game simply doesn't exist". */}
              {options.some((o) => o.platform === 'steam') && (
                <div className="px-2.5 py-1.5 text-[10px] font-mono text-white/50 border-t border-white/15 flex items-center gap-1.5">
                  <WifiOff className="w-3 h-3 shrink-0" />
                  Steam results only — no PlayStation, Xbox or Switch titles.
                </div>
              )}

              {liveError && (
                <div className="px-2.5 py-1.5 text-[10px] font-mono text-amber-300/80 border-t border-white/15">
                  Live search unavailable: {liveError}
                </div>
              )}
            </>
          ) : busy ? (
            <div className="px-3 py-3 text-[11px] font-mono font-bold text-sky-200 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>SEARCHING FREE DATABASES...</span>
            </div>
          ) : aiError ? (
            <div className="px-3 py-3 text-[11px] font-mono font-bold text-[#FF0055] flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px stroke-[3]" />
              <span>{aiError}</span>
            </div>
          ) : liveError ? (
            <div className="px-3 py-3 text-[11px] font-mono font-bold text-amber-300/90 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px stroke-[3]" />
              <span>
                Live search is down and nothing matched the bundled catalog.
                {onAiLookup ? ' Trying AI...' : ' Type the full title manually below.'}
              </span>
            </div>
          ) : (
            <div className="px-3 py-3 text-[11px] font-mono font-bold text-white/70">
              No matches. Type a full title manually below.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
