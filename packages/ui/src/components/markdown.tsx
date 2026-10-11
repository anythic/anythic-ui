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
  /** Overrides for how individual elements render, merged over the defaults. */
  components?: Components;
}

const REMARK_PLUGINS = [remarkGfm];

/**
 * Renders model output as markdown with styled elements and highlighted,
 * copyable code blocks. Raw HTML in the source is not rendered, and unsafe
 * link protocols such as `javascript:` are dropped.
 */
export function Markdown({
  children,
  streaming = false,
  codeTheme,
  components,
  className,
  ...props
}: MarkdownProps) {
  const source = streaming ? completeMarkdown(children) : children;

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
        <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={merged}>
          {source}
        </ReactMarkdown>
      </CodeThemeContext.Provider>
    </div>
  );
}

// The theme travels by context so `pre` can be a stable component: a new
// component type on each render would remount code blocks and drop their
// highlighting.
const CodeThemeContext = createContext<CodeTheme | undefined>(undefined);

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
  p: ({ node: _, ...props }) => <p className="my-3" {...props} />,
  h1: ({ node: _, ...props }) => <h1 className="mb-3 mt-6 text-2xl font-semibold" {...props} />,
  h2: ({ node: _, ...props }) => <h2 className="mb-3 mt-6 text-xl font-semibold" {...props} />,
  h3: ({ node: _, ...props }) => <h3 className="mb-2 mt-5 text-lg font-semibold" {...props} />,
  h4: ({ node: _, ...props }) => <h4 className="mb-2 mt-4 font-semibold" {...props} />,
  h5: ({ node: _, ...props }) => <h5 className="mb-2 mt-4 font-semibold" {...props} />,
  h6: ({ node: _, ...props }) => <h6 className="mb-2 mt-4 font-semibold" {...props} />,
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
  a: ({ node: _, ...props }) => (
    <a
      className="font-medium underline underline-offset-2 hover:no-underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  blockquote: ({ node: _, ...props }) => (
    <blockquote
      className="my-3 border-l-2 border-zinc-300 pl-3 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
      {...props}
    />
  ),
  code: ({ node: _, ...props }) => (
    <code
      className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.875em] dark:bg-zinc-800"
      {...props}
    />
  ),
  hr: ({ node: _, ...props }) => (
    <hr className="my-6 border-zinc-200 dark:border-zinc-800" {...props} />
  ),
  table: ({ node: _, ...props }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: ({ node: _, ...props }) => (
    <th
      className="border-b border-zinc-300 px-3 py-2 text-left font-semibold dark:border-zinc-700"
      {...props}
    />
  ),
  td: ({ node: _, ...props }) => (
    <td className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800" {...props} />
  ),
  img: ({ node: _, alt, ...props }) => (
    <img className="my-3 max-w-full rounded-lg" alt={alt ?? ""} {...props} />
  ),
};
