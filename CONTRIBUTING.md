# Contributing to anythic/ui

Thanks for helping out! Bug reports, ideas and pull requests are all welcome.

## Setup

You need Node 20.9+ and pnpm 10 (`corepack enable` picks the right version).

```sh
pnpm install
pnpm dev
```

`pnpm dev` builds `@anythic/ui` in watch mode and starts the docs app at http://localhost:3000, where every component has a demo. The live demo at `/live` also needs a model key; see [Live demo](README.md#live-demo).

## Repository layout

| Path                     | What lives there                                  |
| ------------------------ | ------------------------------------------------- |
| `packages/ui/src`        | The library: components, hooks and helpers        |
| `packages/ui/test`       | Tests, with Vitest and Testing Library            |
| `apps/docs/app`          | The docs app and its demos (Next.js)              |
| `apps/docs/app/api/chat` | The live demo's server route, model and tools     |
| `apps/docs/lib`          | Docs-only helpers, such as the AI SDK part mapper |
| `packages/eslint-config` | Shared ESLint configs: `base`, `react`, `next`    |

## Before you open a pull request

Run the same checks CI runs:

```sh
pnpm format       # Prettier
pnpm lint         # ESLint, including React hook and accessibility rules
pnpm typecheck
pnpm test
pnpm build
```

## Guidelines

- **Keep pull requests focused.** One component or fix per pull request is easiest to review.
- **Add tests** for new behavior and bug fixes, next to the existing ones in `packages/ui/test`.
- **Add or update a demo** in `apps/docs` when you add or change a component.
- **Stay provider-agnostic.** Components take plain props (`text`, `status`, `input`) and never import a model SDK. Provider-specific glue belongs in the docs app.
- **Accessibility is part of done.** Use real buttons, label icon-only controls, keep focus visible, and respect `prefers-reduced-motion`.
- **Make text translatable.** Any built-in string a user sees should be overridable through a `labels` or `label` prop.
- **Dependencies are a cost.** Ask in an issue before adding a runtime dependency to `@anythic/ui`.

## Reporting bugs and security issues

Open an issue with steps to reproduce. For security problems, please follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
