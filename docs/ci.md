# Website CI and production releases

## Policy

`main` accepts direct pushes. No reviewer or approval wait is required. The **Website gate** protects production release, not entry into the branch: a failing direct push remains on `main` but cannot deploy. Administrators and anyone able to change trusted workflow code can change this policy.

The `Website CI` workflow runs on every PR into `main`, every push to `main`, manual dispatch, and merge-group event. There are no workflow path filters. PRs and merge groups never deploy. Manual dispatch must target `main` and cannot bypass checks.

Jobs have stable names: **Detect changes**, **Validate website**, **Website gate**, **Deploy Pages**. The gate passes only after successful detection and either an explicitly documentation-only result with skipped validation, or successful website validation. Errors, cancellations, missing outputs, and unexpected skips block it.

Only these exact paths are non-site documentation:

- `README.md`, `LICENSE.md`, `MIGRATION_NOTES.md`
- `docs/audits/asset-audit.md`, `docs/audits/contrast-audit.md`, `docs/ci.md`

Every other path is potentially site-affecting, including `AGENTS.md`, Markdown/MDX under `src`, public assets, unknown documentation, tests, lockfiles, Nix/build configuration, and workflows. Renames are represented as deletion plus addition so neither path is missed. PR comparisons use merge-base to head; pushes use the event's before/after SHAs. Missing history triggers full validation; failed comparison/API operations block the gate.

Production additionally compares to the last actual successful Pages publishing step. A successful docs-only or superseded run does not become the deployment baseline. History inspection is bounded to 500 successful main runs; no baseline found means full validation. Legacy `Deploy GitHub Pages` runs are recognized during migration. Thus a README push with pending site changes still builds, tests, and publishes the current commit. A README-only push with no pending changes does not install dependencies, build, run browsers, or deploy.

Superseded PR validation jobs are cancelled. Production validations have distinct run groups: out-of-order change-detection completion must not let an older run cancel newer validation. Stale production runs may finish validation, but a serialized deployment job checks the current `main` SHA before publishing. Deployments share the existing `pages` concurrency group with cancellation disabled. An active release completes; only the current validated head can subsequently publish. Documentation-only runs never enter deployment concurrency.

## Local verification

Use the existing Nix shell (Node 24):

```sh
HTA_AUTO_PREVIEW=0 LAN_PREVIEW_AUTO=0 direnv exec . npm ci
HTA_AUTO_PREVIEW=0 LAN_PREVIEW_AUTO=0 direnv exec . npx playwright install chromium
HTA_AUTO_PREVIEW=0 LAN_PREVIEW_AUTO=0 direnv exec . npm run test:ci
nix shell nixpkgs#actionlint -c actionlint .github/workflows/actions.yaml
```

On Linux, install the Playwright browser OS dependencies using `npx playwright install --with-deps chromium` in a supported environment. CI uses Ubuntu. Individual commands:

- `npm run test:policy`: dependency-free Node policy/Git fixtures.
- `npm run check`: Astro/TypeScript, ESLint, and Prettier.
- `npm run build`: static production output.
- `npm run test:e2e`: test that existing output; starts Astro preview on port 4341 with no existing-server reuse.

Playwright covers generated content routes, internal links/fragments, first-party assets, primary CTAs, client navigation, menu scrolling/focus, optional application embedding, and accessibility. Chromium runs at desktop and mobile sizes, with narrow and landscape menu cases. Google Forms is intercepted with synthetic HTML; other external requests are blocked. No email is sent, application submitted, or external record created. External links are checked by destination, not remote uptime. The legacy Decap CMS shell gets a local availability/configuration check; its external identity/editor functionality is not tested.

Failures produce a local `playwright-report/` and `test-results/`, ignored by Git and lint. CI uploads them for seven days on failure. Traces contain synthetic/local page data, not production credentials. Tests have zero retries; repeatable failures are never converted into passing results through retries.

Automated axe results do not establish full accessibility conformance. Manual screen-reader, zoom, visual review, Safari/Firefox, real email delivery, and third-party form accessibility remain outside this suite. This pipeline is not a dependency-security audit or a performance budget.

## GitHub and hosting settings

Verified during implementation: GitHub Pages uses Actions; the `github-pages` environment permits only the **branch** `main`, has no required reviewers or wait timer, and `main` has no branch protection/ruleset. No setting changes were necessary. Netlify is not an active deployment target according to the owner; obsolete `netlify.toml` is removed. No preview deployment provider is configured.

Rollout and ongoing configuration:

1. The pipeline is active on `main`. Site-affecting pushes automatically validate and deploy; documentation-only changes skip website work unless site changes remain undeployed.
2. Confirm **Settings → Pages → Build and deployment → Source = GitHub Actions**.
3. Confirm **Settings → Environments → github-pages** has no required reviewers or wait timer and only `main` under selected deployment branches/tags (branch rule, not a tag wildcard).
4. Confirm the old standalone deployment workflow has been removed, and disable its historical workflow entry with `gh workflow disable 235574760 --repo HeartlandTranspersonalAlliance/hta-modern` so old manual runs cannot be reused. Disable any independently configured hosting/GitHub App deployment if one is later discovered; it would bypass this gate.
5. Exercise a real PR and controlled main release. Confirm the gate, artifact SHA, and publishing step in Actions. Local fixtures cannot prove GitHub runner scheduling, token permissions, or OIDC behavior.

Optional stricter policy, **not enabled**: add a main ruleset requiring PRs, **Website gate** from GitHub Actions, up-to-date branches (or merge queue), one approval, blocked force pushes/deletions, and no routine bypass actors. That conflicts with unrestricted direct pushes. Authors cannot approve their own PRs. If a merge queue is enabled later, retain the `merge_group` trigger; merge groups validate but never deploy.

## Deployment and rollback

`dist` is built once, tested, and uploaded by the validation job. The exact same run's Pages artifact is published only after the gate. Deployment does not reinstall dependencies or rebuild. Only the deployment job has Pages write and OIDC permissions; PR code has no production credentials. Checkout does not persist credentials and actions are SHA-pinned.

Verify the successful **Publish Pages** step and SHA, then reload `https://heartlandtranspersonalalliance.github.io/hta-modern/` and inspect the changed route. A green gate alone does not mean a release happened. Stale or already-published runs intentionally skip publishing.

To roll back, revert the unwanted site commit on a new commit on `main` (or review it in a PR), then let all checks and the deployment complete. Do not dispatch an old SHA, upload arbitrary output, or recreate an ungated workflow. If a release fails, inspect the job logs and fix/re-run the current main workflow; manual dispatch still detects pending site changes and performs full validation. No human approval is required.

## Implementation verification

Verified locally on macOS through Nix/Node 24: clean `npm ci`, five policy test groups (including temporary Git-history fixtures), Astro/TypeScript, ESLint, Prettier, production build, and all 50 Chromium desktop/mobile tests with `CI=true`. `actionlint` passed. Injecting a missing internal destination into the built homepage caused the route check to fail; the original build was restored and the clean suite passed afterward. Read-only deployment-history detection returned the currently published SHA `2ac9231ecdaf6af8e67351cbf73f3c237fe348a5`.

Rolled out to `main` as `21ba42a74364b88555204cec0b721d6925623d30`. [The first gated release](https://github.com/HeartlandTranspersonalAlliance/hta-modern/actions/runs/35290838827) passed Linux validation, the Website gate, artifact handoff, and OIDC Pages publication. The historical manual deployment workflow is disabled. GitHub concurrency races and PR-specific execution remain covered by local policy tests and configuration review rather than a production stress test.
