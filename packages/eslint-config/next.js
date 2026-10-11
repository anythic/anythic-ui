import nextPlugin from "@next/eslint-plugin-next";
import globals from "globals";
import tseslint from "typescript-eslint";
import react from "./react.js";

/** For Next.js apps: the React rules plus Next.js's own, with Node globals for server code. */
export default tseslint.config(...react, nextPlugin.configs["core-web-vitals"], {
  languageOptions: { globals: { ...globals.node } },
});
