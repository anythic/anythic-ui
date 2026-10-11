import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["react", "react-dom"],
  // Every export is a client component or hook. Bundling drops per-file
  // directives, so the directive is re-added to the output instead.
  banner: { js: '"use client";' },
});
