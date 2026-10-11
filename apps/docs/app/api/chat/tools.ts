import { tool } from "ai";
import { z } from "zod";

// A pretend file system, so the agent has something to look at and delete
// without touching anything real. Each request starts from this listing.
const FILES = [
  { path: "notes/ideas.md", size: "2 KB" },
  { path: "notes/old-todo.txt", size: "1 KB" },
  { path: "reports/2025-draft.pdf", size: "840 KB" },
  { path: "reports/2026-final.pdf", size: "912 KB" },
];

export const tools = {
  get_weather: tool({
    description: "Get the current weather for a city. Returns demo data, not a real forecast.",
    inputSchema: z.object({ city: z.string().describe("City name, e.g. Tashkent") }),
    execute: async ({ city }) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      // Stable per city, so asking twice gives the same answer.
      const seed = [...city.toLowerCase()].reduce((sum, c) => sum + c.charCodeAt(0), 0);
      return {
        city,
        temperatureC: 8 + (seed % 22),
        condition: ["sunny", "partly cloudy", "cloudy", "light rain"][seed % 4],
        note: "Demo data",
      };
    },
  }),
  list_files: tool({
    description: "List the files in the user's (pretend) workspace.",
    inputSchema: z.object({}),
    execute: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return FILES;
    },
  }),
  delete_file: tool({
    description: "Delete a file from the user's (pretend) workspace. Requires the user's approval.",
    inputSchema: z.object({ path: z.string().describe("Path from list_files") }),
    execute: async ({ path }) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (!FILES.some((file) => file.path === path)) throw new Error(`No such file: ${path}`);
      return { deleted: path };
    },
  }),
};

export const SYSTEM_PROMPT = `You are the assistant in the live demo of anythic/ui, a React component library for AI interfaces.
Keep answers short and use markdown where it helps.
You have demo tools: get_weather returns made-up weather, and list_files / delete_file work on a pretend workspace.
When the user asks to clean up or delete files, list them first, then call delete_file for each file to remove; the user approves each deletion in the UI.`;
