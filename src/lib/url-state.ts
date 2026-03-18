import type { SizeEncoding, ColorEncoding } from "@/types";

// ---------------------------------------------------------------------------
// URL State types
// ---------------------------------------------------------------------------

export interface UrlState {
  zoom?: string[];
  selected?: string;
  size?: SizeEncoding;
  color?: ColorEncoding;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const VALID_SIZE_ENCODINGS: SizeEncoding[] = [
  "linesChanged",
  "fileCount",
  "commitCount",
];
const VALID_COLOR_ENCODINGS: ColorEncoding[] = [
  "type",
  "author",
  "recency",
  "churn",
];

export function isValidSizeEncoding(v: string): v is SizeEncoding {
  return (VALID_SIZE_ENCODINGS as string[]).includes(v);
}

export function isValidColorEncoding(v: string): v is ColorEncoding {
  return (VALID_COLOR_ENCODINGS as string[]).includes(v);
}

// ---------------------------------------------------------------------------
// Defaults (omitted from URL to keep it short)
// ---------------------------------------------------------------------------

const DEFAULT_SIZE: SizeEncoding = "linesChanged";
const DEFAULT_COLOR: ColorEncoding = "type";

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

export function parseUrlState(search: string): UrlState {
  const params = new URLSearchParams(search);
  const state: UrlState = {};

  const zoom = params.get("zoom");
  if (zoom) {
    state.zoom = zoom.split(",").filter(Boolean);
  }

  const selected = params.get("selected");
  if (selected) state.selected = selected;

  const size = params.get("size");
  if (size && isValidSizeEncoding(size)) state.size = size;

  const color = params.get("color");
  if (color && isValidColorEncoding(color)) state.color = color;

  const searchQ = params.get("search");
  if (searchQ) state.search = searchQ;

  const dateFrom = params.get("dateFrom");
  if (dateFrom) state.dateFrom = dateFrom;

  const dateTo = params.get("dateTo");
  if (dateTo) state.dateTo = dateTo;

  return state;
}

// ---------------------------------------------------------------------------
// Serialize
// ---------------------------------------------------------------------------

export function serializeToParams(state: UrlState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.zoom && state.zoom.length > 0) {
    params.set("zoom", state.zoom.join(","));
  }
  if (state.selected) {
    params.set("selected", state.selected);
  }
  if (state.size && state.size !== DEFAULT_SIZE) {
    params.set("size", state.size);
  }
  if (state.color && state.color !== DEFAULT_COLOR) {
    params.set("color", state.color);
  }
  if (state.search) {
    params.set("search", state.search);
  }
  if (state.dateFrom) {
    params.set("dateFrom", state.dateFrom);
  }
  if (state.dateTo) {
    params.set("dateTo", state.dateTo);
  }

  return params;
}

export function buildUrlString(params: URLSearchParams): string {
  const qs = params.toString();
  return qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
}
