# Repository Guidelines

## Project Structure & Module Organization

This repository is an Astro + Tailwind static site. Primary code lives in `src/`:

- `src/pages/`: route entrypoints (`.astro`, dynamic routes such as `[...blog]`).
- `src/components/`: reusable UI blocks (`blog`, `widgets`, `common`, `ui`).
- `src/layouts/`: shared page shells.
- `src/assets/`: processed assets (images, styles, favicons).
- `src/data/` and `src/content/`: structured and editorial content.
  Use `public/` for static files served as-is (for example `public/images/*`). Build output goes to `dist/` (and `dist-offline/` for offline packaging).

## Build, Test, and Development Commands

Run all commands from repo root:

- `npm ci`: install exact dependencies for local/CI parity.
- `npm run dev`: start Astro dev server (`localhost:4321`).
- `npm run build`: production build to `dist/`.
- `npm run build:offline`: build plus offline bundle generation.
- `npm run preview`: serve the built site locally.
- `npm run check`: run Astro checks, ESLint, and Prettier checks.
- `npm run fix`: auto-fix lint issues and format files.
  Development environment note: work from the project’s Nix shell. If a tool is missing while running checks/builds, install or expose the required package in-shell on demand, then re-run the command.

## Coding Style & Naming Conventions

Use 2-space indentation, UTF-8, LF line endings (`.editorconfig`). Prettier is authoritative (`singleQuote: true`, `semi: true`, `printWidth: 120`) with `prettier-plugin-astro`. ESLint uses Astro + TypeScript rules; unused args should be prefixed with `_` when intentionally ignored. Keep component and layout filenames in PascalCase (for example `Header.astro`), and keep route/content paths descriptive and lowercase when URL-facing.

## Testing Guidelines

There is currently no dedicated unit/integration test suite in this repo. Treat `npm run check` and `npm run build` as required validation before opening a PR. If you add tests, colocate them near the feature and use `*.test.*` naming so they are easy to discover.

## Commit & Pull Request Guidelines

Recent commit history favors short, imperative subjects (for example: `Fix GitHub Pages asset serving and base-path links`). Follow that style, keep commits focused, and avoid mixing refactors with content-only edits. For PRs, include:

- a clear summary of behavior/user-facing changes,
- linked issue(s) when applicable,
- screenshots for UI changes,
- confirmation that `npm run check` and `npm run build` pass.

## Deployment Notes

GitHub Actions builds on pushes/PRs and deploys `dist/` to GitHub Pages from `main`. Keep `astro.config.ts` and site base settings aligned with the deployment target before merging.
