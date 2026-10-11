import { useEffect, useState } from "react";

/**
 * Copies text to the clipboard and reports `copied` for two seconds after,
 * for "Copied" feedback. A denied clipboard leaves `copied` false.
 */
export function useCopy(): { copied: boolean; copy: (text: string) => Promise<void> } {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard access can be denied; there is nothing useful to show.
    }
  };

  return { copied, copy };
}
