import { useEffect, useRef, useState, type HTMLAttributes } from "react";
import { cn } from "../lib/cn";
import { CheckIcon, CopyIcon } from "../icons";
import { useCopy } from "../hooks/use-copy";

export interface CodeTheme {
  light: string;
  dark: string;
}

export interface CodeBlockProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  code: string;
  /** Language for highlighting, e.g. `ts`. Unknown languages show as plain text. */
  language?: string;
  /** Shiki theme names for light and dark mode. */
  theme?: CodeTheme;
  /** Set to false to hide the copy button. */
  copyable?: boolean;
  /** Replaces the copy button's text, e.g. for translation. */
  labels?: Partial<CodeBlockLabels>;
}

export interface CodeBlockLabels {
  copy: string;
  copied: string;
}

const DEFAULT_THEME: CodeTheme = { light: "github-light", dark: "github-dark" };
const DEFAULT_LABELS: CodeBlockLabels = { copy: "Copy", copied: "Copied" };

/**
 * A code block with syntax highlighting and a copy button. It renders as
 * plain text first, then highlights once Shiki has loaded, so it never
 * blocks the first paint. Re-highlighting while code streams in is coalesced:
 * at most one run is in flight, and the next one uses the latest code.
 */
export function CodeBlock({
  code,
  language,
  theme = DEFAULT_THEME,
  copyable = true,
  labels: labelsProp,
  className,
  ...props
}: CodeBlockProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const html = useHighlightedHtml(code, language, theme);
  const { copied, copy } = useCopy();

  return (
    <div
      data-language={language}
      className={cn(
        "group/code relative overflow-hidden rounded-lg border border-border bg-muted text-sm",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-xs text-muted-foreground">
        <span className="font-mono">{language || "text"}</span>
        {copyable && (
          <button
            type="button"
            onClick={() => copy(code)}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
            <span aria-live="polite">{copied ? labels.copied : labels.copy}</span>
          </button>
        )}
      </div>
      {html ? (
        <div
          className={cn(
            "overflow-x-auto [&_pre]:p-3 [&_pre]:font-mono [&_pre]:leading-relaxed [&_pre]:outline-none",
            // Shiki emits both palettes as variables; pick one per scheme.
            "[&_.shiki_span]:text-(--shiki-light) dark:[&_.shiki_span]:text-(--shiki-dark)",
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto p-3 font-mono leading-relaxed">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

type Highlight = (code: string, language: string | undefined, theme: CodeTheme) => Promise<string>;

let highlighter: Promise<Highlight> | undefined;

/** Loads Shiki on first use, so apps that never show code never fetch it. */
function loadHighlighter(): Promise<Highlight> {
  highlighter ??= import("shiki").then(
    ({ codeToHtml, bundledLanguages, bundledLanguagesAlias }) => {
      return (code, language, theme) => {
        const lang =
          language && (language in bundledLanguages || language in bundledLanguagesAlias)
            ? language
            : "text";
        return codeToHtml(code, {
          lang,
          themes: { light: theme.light, dark: theme.dark },
          defaultColor: false,
        });
      };
    },
  );
  return highlighter;
}

function useHighlightedHtml(
  code: string,
  language: string | undefined,
  theme: CodeTheme,
): string | undefined {
  const [html, setHtml] = useState<string>();
  const latest = useRef({ code, language, theme });
  const running = useRef(false);
  const dirty = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // The theme is compared by its names, so an inline object does not re-highlight.
  const { light, dark } = theme;
  useEffect(() => {
    latest.current = { code, language, theme: { light, dark } };
    dirty.current = true;
    if (running.current) return;
    running.current = true;

    (async () => {
      try {
        const highlight = await loadHighlighter();
        while (dirty.current && mounted.current) {
          dirty.current = false;
          const { code, language, theme } = latest.current;
          const result = await highlight(code, language, theme);
          if (mounted.current) setHtml(result);
        }
      } catch {
        // Highlighting is an enhancement; the plain block stays on failure.
      } finally {
        running.current = false;
      }
    })();
  }, [code, language, light, dark]);

  return html;
}
