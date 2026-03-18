"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";

import { useVisualizationStore } from "@/store/visualization-store";
import { collectSearchMatches } from "@/lib/search";

export function Search() {
  const root = useVisualizationStore((s) => s.root);
  const setFilter = useVisualizationStore((s) => s.setFilter);
  const zoomTo = useVisualizationStore((s) => s.zoomTo);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [dropdownDismissed, setDropdownDismissed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce query → store
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setFilter("searchQuery", query || undefined);
      setDropdownDismissed(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, setFilter]);

  // Compute matching commits
  const matches = useMemo(() => {
    if (!root || !debouncedQuery) return [];
    return collectSearchMatches(root, debouncedQuery)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [root, debouncedQuery]);

  const totalMatches = useMemo(() => {
    if (!root || !debouncedQuery) return 0;
    return collectSearchMatches(root, debouncedQuery).length;
  }, [root, debouncedQuery]);

  // Derive dropdown visibility
  const showDropdown =
    !dropdownDismissed && matches.length > 0 && debouncedQuery.length > 0;

  const handleClear = () => {
    setQuery("");
    setDebouncedQuery("");
    setFilter("searchQuery", undefined);
    setDropdownDismissed(true);
    inputRef.current?.focus();
  };

  const handleResultClick = (hash: string) => {
    setDropdownDismissed(true);
    zoomTo(hash);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setDropdownDismissed(true);
      inputRef.current?.blur();
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Keep dropdown open if focus moves within the container
    if (containerRef.current?.contains(e.relatedTarget as Node)) return;
    setDropdownDismissed(true);
  };

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      {/* Search input */}
      <div className="flex items-center gap-1.5 rounded-md border-2 border-border bg-input px-2.5 py-1.5 transition-shadow focus-within:shadow-hard">
        <MagnifyingGlass
          size={16}
          weight="bold"
          className="shrink-0 text-muted-foreground"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (matches.length > 0 && debouncedQuery)
              setDropdownDismissed(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search commits…"
          className="w-36 bg-transparent font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none md:w-48"
        />
        {query && (
          <button
            onClick={handleClear}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={14} weight="bold" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {showDropdown && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-72 rounded-md border-2 border-border bg-card shadow-hard">
          <div className="border-b border-border px-3 py-1.5">
            <span className="font-heading text-xs text-muted-foreground">
              {totalMatches} match{totalMatches !== 1 ? "es" : ""}
            </span>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {matches.map((commit) => (
              <li key={commit.hash}>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleResultClick(commit.hash);
                  }}
                  className="flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors hover:bg-muted"
                >
                  <span className="truncate font-body text-sm text-foreground">
                    {commit.message}
                  </span>
                  <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                    <span>{commit.author.name}</span>
                    <span>·</span>
                    <span>{formatRelativeDate(commit.date)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
