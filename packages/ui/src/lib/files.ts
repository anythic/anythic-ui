export type FileRejectionReason = "type" | "size" | "count";

export interface FileRejection {
  file: File;
  reason: FileRejectionReason;
}

export interface FileRules {
  /** Same syntax as the `accept` attribute: `image/*`, `.pdf`, `text/plain`. */
  accept?: string;
  /** Maximum size of one file, in bytes. */
  maxSize?: number;
  /** Maximum number of files attached at once. */
  maxFiles?: number;
}

/** Whether a file matches an `accept` string. Browsers do not enforce it for drops and pastes. */
export function matchesAccept(file: File, accept: string | undefined): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => {
      if (rule.startsWith(".")) return name.endsWith(rule);
      if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
      return type === rule;
    });
}

/** Splits new files into those that fit the rules alongside `existing` and those that do not. */
export function checkFiles(
  files: File[],
  existing: number,
  rules: FileRules,
): { accepted: File[]; rejected: FileRejection[] } {
  const accepted: File[] = [];
  const rejected: FileRejection[] = [];
  for (const file of files) {
    if (!matchesAccept(file, rules.accept)) rejected.push({ file, reason: "type" });
    else if (rules.maxSize !== undefined && file.size > rules.maxSize)
      rejected.push({ file, reason: "size" });
    else if (rules.maxFiles !== undefined && existing + accepted.length >= rules.maxFiles)
      rejected.push({ file, reason: "count" });
    else accepted.push(file);
  }
  return { accepted, rejected };
}

/** A short human size, e.g. `840 KB`. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}
