/**
 * The URL itself if it is http(s), otherwise undefined. Source URLs come
 * from models and tools, so anything else (`javascript:`, `data:`) must
 * never become a link.
 */
export function safeHref(url: string): string | undefined {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

/** A short, readable site name for a URL, e.g. `example.com`. */
export function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
