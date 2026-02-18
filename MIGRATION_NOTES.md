# HTA Migration Notes (Jekyll -> Astro)

## What was migrated
- Site identity and metadata (`src/config.yaml`) now use Heartland Transpersonal Alliance + GitHub Pages defaults.
- Global navigation and footer were rewritten for HTA pages and initiatives (`src/navigation.ts`).
- Homepage redesigned for a modern nonprofit/corporate feel (`src/pages/index.astro`).
- Existing program content was repurposed into:
  - `src/pages/initiatives.astro`
  - `src/pages/board.astro`
  - `src/pages/board-app.astro`
  - `src/pages/about.astro`
  - `src/pages/contact.astro`
- News routing switched from `/blog` to `/news`.
- The existing HTA news post was ported into Astro content collections:
  - `src/data/post/hta/board-update-ashley-bennett-elected.md`
- Existing HTA images were copied into:
  - `src/assets/images/hta/` (for Astro components)
  - `public/images/hta/` (for Markdown post images)

## Content collection note
The post loader now points to `src/data/post/hta` in `src/content/config.ts`.
This avoids pulling AstroWind sample posts into HTA news.

## Next migration steps
- Migrate any additional HTA posts from `hta-site/_posts/` into `src/data/post/hta/`.
- Add any missing board member profile images/content as needed.
- Optionally archive/remove unused AstroWind demo routes (`/services`, `/pricing`, `/homes/*`, `/landing/*`).

## Offline preview build
- Run `npm run build:offline` to generate `dist-offline/`.
- Open `dist-offline/index.html` directly from disk for file-based preview.

## GitHub Pages deploy
- Workflow file: `.github/workflows/deploy-pages.yml`
- Trigger: push to `main`
- Deploy actions: `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`
- Current site target: `https://heartlandtranspersonalalliance.github.io/hta-site/`

When you are ready for a custom domain later, set the domain in GitHub Pages settings and update `src/config.yaml` (`site` and `base`) accordingly.
