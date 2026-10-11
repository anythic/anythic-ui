import {
  createContext,
  isValidElement,
  useContext,
  useMemo,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../lib/cn";
import { completeMarkdown } from "../lib/complete-markdown";
import { remarkCitations } from "../lib/remark-citations";
import { Citation, type Source } from "./citation";
import { CodeBlock, type CodeTheme } from "./code-block";

export interface MarkdownProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Markdown source, GitHub-flavoured (tables, task lists, strikethrough). */
  children: string;
  /**
   * Whether more text is still arriving. While true, syntax the stream cut
   * off mid-way is closed so it renders cleanly instead of as raw markers.
   */
  streaming?: boolean;
  /** Shiki theme names for code blocks in light and dark mode. */
  codeTheme?: CodeTheme;
  /**
   * Sources the text cites. Markers like `[1]` or `[1, 3]` that point at one
   * of them (numbered from 1) render as `Citation`s; pair with `Sources`.
   */
  sources?: Source[];
  /** Overrides for how individual elements render, merged over the defaults. */
  components?: Components;
}

const NO_SOURCES: Source[] = [];

/**
 * Renders model output as markdown with styled elements and highlighted,
 * copyable code blocks. Raw HTML in the source is not rendered, and unsafe
 * link protocols such as `javascript:` are dropped.
 */
export function Markdown({
  children,
  streaming = false,
  codeTheme,
  sources = NO_SOURCES,
  components,
  className,
  ...props
}: MarkdownProps) {
  let source = streaming ? completeMarkdown(children) : children;
  // Hold back a citation that is still arriving, like "[1", so it appears
  // once, as a chip, instead of as raw text first.
  if (streaming && sources.length > 0) source = source.replace(/\[[\d,\s]*$/, "");

  const remarkPlugins = useMemo(
    () => (sources.length > 0 ? [remarkGfm, remarkCitations(sources.length)] : [remarkGfm]),
    [sources.length],
  );

  const merged = useMemo<Components>(
    () => (components ? { ...defaultComponents, ...components } : defaultComponents),
    [components],
  );

  return (
    <div
      aria-busy={streaming}
      data-streaming={streaming || undefined}
      className={cn(
        "break-words leading-relaxed [&>:first-child]:mt-0 [&>:last-child]:mb-0",
        className,
      )}
      {...props}
    >
      <CodeThemeContext.Provider value={codeTheme}>
        <SourcesContext.Provider value={sources}>
          <ReactMarkdown remarkPlugins={remarkPlugins} components={merged}>
            {source}
          </ReactMarkdown>
        </SourcesContext.Provider>
      </CodeThemeContext.Provider>
    </div>
  );
}

// The theme and sources travel by context so `pre` and `sup` can be stable
// components: a new component type on each render would remount code blocks
// and drop their highlighting.
const CodeThemeContext = createContext<CodeTheme | undefined>(undefined);
const SourcesContext = createContext<Source[]>(NO_SOURCES);

function Sup({ children, ...props }: { children?: ReactNode; "data-citation"?: unknown }) {
  const sources = useContext(SourcesContext);
  const index = Number(props["data-citation"]);
  const source = sources[index - 1];
  if (!source) return <sup {...props}>{children}</sup>;
  return <Citation source={source} index={index} />;
}

function Pre({ children }: { children?: ReactNode }) {
  const theme = useContext(CodeThemeContext);
  const code = codeElement(children);
  if (!code) return <pre>{children}</pre>;
  const language = /language-(\S+)/.exec(code.props.className ?? "")?.[1];
  return (
    <CodeBlock
      code={String(code.props.children ?? "").replace(/\n$/, "")}
      language={language}
      theme={theme}
      className="my-4"
    />
  );
}

type CodeElement = ReactElement<{ className?: string; children?: ReactNode }>;

function codeElement(children: ReactNode): CodeElement | undefined {
  return isValidElement(children) ? (children as CodeElement) : undefined;
}

const defaultComponents: Components = {
  pre: ({ children }) => <Pre>{children}</Pre>,
  sup: ({ node: _, ...props }) => <Sup {...props} />,
  p: ({ node: _, ...props }) => <p className="my-3" {...props} />,
  h1: ({ node: _, children, ...props }) => (
    <h1 className="mb-3 mt-6 text-2xl font-semibold" {...props}>
      {children}
    </h1>
  ),
  h2: ({ node: _, children, ...props }) => (
    <h2 className="mb-3 mt-6 text-xl font-semibold" {...props}>
      {children}
    </h2>
  ),
  h3: ({ node: _, children, ...props }) => (
    <h3 className="mb-2 mt-5 text-lg font-semibold" {...props}>
      {children}
    </h3>
  ),
  h4: ({ node: _, children, ...props }) => (
    <h4 className="mb-2 mt-4 font-semibold" {...props}>
      {children}
    </h4>
  ),
  h5: ({ node: _, children, ...props }) => (
    <h5 className="mb-2 mt-4 font-semibold" {...props}>
      {children}
    </h5>
  ),
  h6: ({ node: _, children, ...props }) => (
    <h6 className="mb-2 mt-4 font-semibold" {...props}>
      {children}
    </h6>
  ),
  ul: ({ node: _, className, ...props }) => (
    <ul
      className={cn(
        "my-3 list-disc pl-6 [&_ul]:my-1 [&_ol]:my-1",
        // Task lists from GFM bring their own checkboxes.
        className === "contains-task-list" && "list-none pl-1",
      )}
      {...props}
    />
  ),
  ol: ({ node: _, ...props }) => (
    <ol className="my-3 list-decimal pl-6 [&_ul]:my-1 [&_ol]:my-1" {...props} />
  ),
  li: ({ node: _, ...props }) => <li className="my-1 [&>input]:mr-2" {...props} />,
  a: ({ node: _, children, ...props }) => (
    <a
      className="font-medium underline underline-offset-2 hover:no-underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  blockquote: ({ node: _, ...props }) => (
    <blockquote className="my-3 border-l-2 border-border pl-3 text-muted-foreground" {...props} />
  ),
  code: ({ node: _, ...props }) => (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.875em]" {...props} />
  ),
  hr: ({ node: _, ...props }) => <hr className="my-6 border-border" {...props} />,
  table: ({ node: _, ...props }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: ({ node: _, ...props }) => (
    <th className="border-b border-border px-3 py-2 text-left font-semibold" {...props} />
  ),
  td: ({ node: _, ...props }) => <td className="border-b border-border px-3 py-2" {...props} />,
  img: ({ node: _, alt, ...props }) => (
    <img className="my-3 max-w-full rounded-lg" alt={alt ?? ""} {...props} />
  ),
};
