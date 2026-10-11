import { act, createEvent, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AttachmentList, PromptInput } from "../src";
import { checkFiles, formatBytes, matchesAccept } from "../src/lib/files";

const file = (name: string, type: string, size = 10) =>
  new File([new Uint8Array(size)], name, { type });

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

describe("file rules", () => {
  it("matches accept by MIME type, wildcard and extension", () => {
    expect(matchesAccept(file("a.png", "image/png"), "image/*")).toBe(true);
    expect(matchesAccept(file("a.pdf", "application/pdf"), "image/*, .pdf")).toBe(true);
    expect(matchesAccept(file("a.txt", "text/plain"), "image/*,.pdf")).toBe(false);
    expect(matchesAccept(file("a.txt", "text/plain"), undefined)).toBe(true);
  });

  it("rejects by type, then size, then count", () => {
    const { accepted, rejected } = checkFiles(
      [
        file("a.png", "image/png"),
        file("b.exe", "application/x-msdownload"),
        file("c.png", "image/png", 999),
        file("d.png", "image/png"),
      ],
      1,
      { accept: "image/*", maxSize: 100, maxFiles: 2 },
    );
    expect(accepted.map((f) => f.name)).toEqual(["a.png"]);
    expect(rejected.map((r) => [r.file.name, r.reason])).toEqual([
      ["b.exe", "type"],
      ["c.png", "size"],
      ["d.png", "count"],
    ]);
  });

  it("formats sizes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(840 * 1024)).toBe("840 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});

describe("AttachmentList", () => {
  it("shows images as thumbnails and other files by name and size", () => {
    render(
      <AttachmentList
        items={[file("photo.png", "image/png"), file("notes.pdf", "application/pdf", 2048)]}
      />,
    );
    expect(screen.getByRole("img", { name: "photo.png" })).toHaveAttribute("src", "blob:preview");
    expect(screen.getByText("notes.pdf")).toBeInTheDocument();
    expect(screen.getByText("2.0 KB")).toBeInTheDocument();
  });

  it("revokes preview URLs when a file goes away", () => {
    const { unmount } = render(<AttachmentList items={[file("photo.png", "image/png")]} />);
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });

  it("only loads safe URLs for uploaded attachments", () => {
    render(
      <AttachmentList
        items={[
          { name: "ok.png", type: "image/png", url: "https://cdn.example.com/ok.png" },
          { name: "bad.png", type: "image/png", url: "javascript:alert(1)" },
        ]}
      />,
    );
    expect(screen.getByRole("img", { name: "ok.png" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "bad.png" })).not.toBeInTheDocument();
    expect(screen.getByText("bad.png")).toBeInTheDocument();
  });

  it("offers a remove button per item when removable", () => {
    const onRemove = vi.fn();
    render(
      <AttachmentList
        items={[file("a.txt", "text/plain"), file("b.txt", "text/plain")]}
        onRemove={onRemove}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove b.txt" }));
    expect(onRemove).toHaveBeenCalledWith(1);
  });
});

describe("PromptInput attachments", () => {
  const fileInput = (container: HTMLElement) =>
    container.querySelector('input[type="file"]') as HTMLInputElement;
  const pick = (container: HTMLElement, files: File[]) =>
    fireEvent.change(fileInput(container), { target: { files } });

  it("has no attach button unless enabled", () => {
    render(<PromptInput onSubmit={() => {}} />);
    expect(screen.queryByRole("button", { name: "Attach files" })).not.toBeInTheDocument();
  });

  it("sends picked files, even without text, and clears them", () => {
    const onSubmit = vi.fn();
    const { container } = render(<PromptInput onSubmit={onSubmit} attachments />);
    const report = file("report.pdf", "application/pdf");
    pick(container, [report]);
    expect(screen.getByText("report.pdf")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(onSubmit).toHaveBeenCalledWith("", [report]);
    expect(screen.queryByText("report.pdf")).not.toBeInTheDocument();
  });

  it("removes a file before sending", () => {
    const { container } = render(<PromptInput onSubmit={() => {}} attachments />);
    pick(container, [file("a.txt", "text/plain")]);
    fireEvent.click(screen.getByRole("button", { name: "Remove a.txt" }));
    expect(screen.queryByText("a.txt")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("reports files that break the rules", () => {
    const onReject = vi.fn();
    const { container } = render(
      <PromptInput onSubmit={() => {}} attachments={{ accept: "image/*", onReject }} />,
    );
    expect(fileInput(container)).toHaveAttribute("accept", "image/*");
    pick(container, [file("a.png", "image/png"), file("b.zip", "application/zip")]);
    expect(onReject).toHaveBeenCalledWith([expect.objectContaining({ reason: "type" })]);
    expect(screen.getByRole("img", { name: "a.png" })).toBeInTheDocument();
  });

  it("accepts dropped files and shows a drop hint while dragging", () => {
    const { container } = render(<PromptInput onSubmit={() => {}} attachments />);
    const form = container.querySelector("form")!;
    const dataTransfer = { types: ["Files"], files: [file("drop.txt", "text/plain")] };

    fireEvent.dragEnter(form, { dataTransfer });
    expect(screen.getByText("Drop files to attach")).toBeInTheDocument();
    fireEvent.drop(form, { dataTransfer });
    expect(screen.queryByText("Drop files to attach")).not.toBeInTheDocument();
    expect(screen.getByText("drop.txt")).toBeInTheDocument();
  });

  it("attaches pasted images without pasting anything into the text", () => {
    render(<PromptInput onSubmit={() => {}} attachments />);
    const box = screen.getByRole("textbox");
    const paste = createEvent.paste(box, {
      clipboardData: { files: [file("shot.png", "image/png")], getData: () => "" },
    });
    fireEvent(box, paste);
    expect(paste.defaultPrevented).toBe(true);
    expect(screen.getByRole("img", { name: "shot.png" })).toBeInTheDocument();
  });

  it("gives the files back when an async submit fails", async () => {
    const failure = new Error("upload failed");
    let reject!: (error: Error) => void;
    const onSubmit = vi.fn(() => new Promise<void>((_, r) => (reject = r)));
    const { container } = render(<PromptInput onSubmit={onSubmit} attachments />);
    pick(container, [file("big.pdf", "application/pdf")]);
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.queryByText("big.pdf")).not.toBeInTheDocument();

    const unhandled = new Promise((r) => process.once("unhandledRejection", r));
    await act(async () => reject(failure));
    expect(await unhandled).toBe(failure);
    expect(screen.getByText("big.pdf")).toBeInTheDocument();
  });
});
