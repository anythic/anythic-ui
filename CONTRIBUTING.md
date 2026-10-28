# Contributing to anythic/ui

Thank you for your interest in contributing to **anythic/ui**!

We welcome bug fixes, new components, accessibility improvements, documentation updates, and tests. Our goal is to make AI interfaces easier to build, customize, and maintain.

## Getting started

Before contributing:

- Search existing issues and pull requests to avoid duplicate work.
- Discuss substantial changes or new APIs in an issue first.
- Keep pull requests focused and easy to review.
- Never commit API keys, credentials, or private data.

### Requirements

- Node.js 20.9+ (Node 22 is pinned in `.nvmrc`)
- pnpm 10
- Git

### Local development

```bash
git clone https://github.com/anythic/anythic-ui.git
cd anythic-ui
pnpm install --frozen-lockfile
pnpm dev
```

Visit http://localhost:3000 to explore the documentation and component demos.

For the AI-powered live example, follow the setup instructions in the [README](README.md#live-model-demo).

## Repository structure

- `packages/ui/src` — React components, hooks, and shared utilities
- `packages/ui/test` — Vitest and Testing Library tests
- `apps/docs/app` — Next.js documentation and component examples
- `apps/docs/app/api/chat` — live AI demo server routes
- `apps/docs/lib` — documentation-specific helpers
- `packages/eslint-config` — shared linting rules
- `.changeset` — release notes and version management

## Contribution workflow

1. Synchronize your local `main` branch.
2. Create a descriptive feature or fix branch.
3. Implement your change with focused commits.
4. Add tests and update examples when applicable.
5. Run the required checks.
6. Open a pull request against `main`.

```bash
git switch main
git pull --ff-only origin main
git switch -c docs/your-improvement
```

Use descriptive branch names such as `fix/streaming-markdown`, `docs/component-guides`, or `feat/new-component`.

## Development guidelines

### Component design

- Prefer small, composable React components.
- Maintain consistent TypeScript interfaces.
- Keep public APIs predictable and documented.
- Avoid unnecessary runtime dependencies.
- Keep the library independent of specific AI providers.
- Place provider-specific integrations in the documentation app.

### Accessibility

Accessibility is a core requirement:

- Use semantic HTML and native controls whenever practical.
- Support keyboard navigation and visible focus states.
- Label icon-only buttons and interactive controls.
- Respect the user's reduced-motion preferences.
- Make built-in user-facing strings configurable.

### Testing and documentation

- Add regression tests for bug fixes.
- Cover relevant edge cases and streaming behavior.
- Update component demos when changing public behavior.
- Document new props and important usage patterns.
- Keep examples concise and reproducible.

## Quality checks

Run these checks before requesting review:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

To automatically format your changes:

```bash
pnpm format
```

CI runs the quality checks on pull requests and pushes to `main`.

## Changesets

User-visible changes to `@anythic/ui` require a changeset.

```bash
pnpm changeset
```

Select `@anythic/ui` and choose an appropriate release type:

- **Patch** — backward-compatible bug fixes
- **Minor** — new backward-compatible functionality
- **Major** — breaking API changes

Write a concise summary of the change and commit the generated `.changeset` file.

Documentation-only and internal changes do not require a changeset.

The release workflow manages package versioning, changelog updates, npm publishing, and GitHub releases.

## Pull request checklist

Before submitting, verify:

- [ ] My change is focused and clearly explained.
- [ ] I have added or updated relevant tests.
- [ ] Documentation and examples are updated where needed.
- [ ] Formatting, linting, typechecking, tests, and build pass.
- [ ] I have included a changeset when required.
- [ ] No secrets or unrelated generated files are included.

## Reporting bugs

A useful bug report contains:

1. A clear description of the issue.
2. Steps to reproduce the behavior.
3. Expected and actual results.
4. Relevant package and environment versions.
5. A minimal reproduction, when possible.

For feature requests, explain the problem, intended users, and expected behavior.

## Security

Please do not disclose security vulnerabilities in public issues.

Follow [SECURITY.md](SECURITY.md) for private vulnerability reporting.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).

Thank you for helping improve anythic/ui!
