# Contrast Audit

Generated: 2026-05-02

Scope: primary HTA design tokens and recurring component states after the frontend refinement passes. Ratios are calculated using WCAG relative luminance. Normal text target is WCAG AA 4.5:1.

## Summary

- Checks run: 31
- WCAG AA normal-text failures: 0
- Result: PASS

## Results

| Area                              | Pair                                | Foreground         | Background | Ratio | AA   |
| --------------------------------- | ----------------------------------- | ------------------ | ---------- | ----: | ---- |
| Light theme body and surfaces     | Body text on page                   | `#20333a`          | `#f4f7f5`  | 12.20 | Pass |
| Light theme body and surfaces     | Muted text on page                  | `#4c6166`          | `#f4f7f5`  |  6.07 | Pass |
| Light theme body and surfaces     | Strong text on page                 | `#071624`          | `#f4f7f5`  | 16.94 | Pass |
| Light theme body and surfaces     | Body text on surface card           | `#20333a`          | `#ffffff`  | 13.16 | Pass |
| Light theme body and surfaces     | Muted text on surface card          | `#4c6166`          | `#ffffff`  |  6.54 | Pass |
| Light theme body and surfaces     | Strong text on paper panel          | `#071624`          | `#fffdf6`  | 17.95 | Pass |
| Light theme body and surfaces     | Link on page                        | `#075f72`          | `#f4f7f5`  |  6.74 | Pass |
| Light theme body and surfaces     | Link hover on page                  | `#063f4e`          | `#f4f7f5`  | 10.65 | Pass |
| Light theme components            | Primary button text                 | `#071624`          | `#f4c84a`  | 11.49 | Pass |
| Light theme components            | CTA title on light CTA              | `#071624`          | `#edf5f2`  | 16.48 | Pass |
| Light theme components            | CTA muted text on light CTA         | `#4c6166`          | `#edf5f2`  |  5.90 | Pass |
| Light theme components            | Footer muted text on light footer   | `#516368`          | `#edf4f1`  |  5.64 | Pass |
| Light theme components            | Primary accent label on card        | `#087086`          | `#ffffff`  |  5.72 | Pass |
| Light theme components            | Secondary accent label on card      | `#26745f`          | `#ffffff`  |  5.61 | Pass |
| Light theme components            | Warm accent label on card           | `#8a6500`          | `#ffffff`  |  5.33 | Pass |
| Dark theme body and surfaces      | Body text on page                   | `#e8f2f1`          | `#071624`  | 16.01 | Pass |
| Dark theme body and surfaces      | Muted text on page                  | `#c3d4d2`          | `#071624`  | 11.89 | Pass |
| Dark theme body and surfaces      | Strong text on page                 | `#ffffff`          | `#071624`  | 18.27 | Pass |
| Dark theme body and surfaces      | Body text on surface card           | `#e8f2f1`          | `#0d2334`  | 14.08 | Pass |
| Dark theme body and surfaces      | Muted text on surface card          | `#c3d4d2`          | `#0d2334`  | 10.46 | Pass |
| Dark theme body and surfaces      | Link on page                        | `#64d8f3`          | `#071624`  | 11.01 | Pass |
| Dark theme body and surfaces      | Link hover on page                  | `#ffffff`          | `#071624`  | 18.27 | Pass |
| Dark and institutional components | Hero title on institutional navy    | `#ffffff`          | `#09243a`  | 15.85 | Pass |
| Dark and institutional components | Hero body at 80 percent white       | `rgb(206 211 216)` | `#09243a`  | 10.52 | Pass |
| Dark and institutional components | Hero stat label at 70 percent white | `rgb(181 189 196)` | `#09243a`  |  8.33 | Pass |
| Dark and institutional components | CTA title on dark CTA               | `#ffffff`          | `#0a2b42`  | 14.61 | Pass |
| Dark and institutional components | CTA muted text on dark CTA          | `rgb(201 208 213)` | `#0a2b42`  |  9.37 | Pass |
| Dark and institutional components | Footer muted text on dark footer    | `rgb(200 202 204)` | `#050d16`  | 11.88 | Pass |
| Dark and institutional components | Primary accent label on dark card   | `#64d8f3`          | `#0d2334`  |  9.68 | Pass |
| Dark and institutional components | Secondary accent label on dark card | `#82d8bd`          | `#0d2334`  |  9.57 | Pass |
| Dark and institutional components | Warm accent label on dark card      | `#f6d36a`          | `#0d2334`  | 11.05 | Pass |

## Notes

- Gradient surfaces were tested against representative stops rather than every rendered pixel.
- Semi-transparent white hero, CTA, and footer text was composited against the relevant dark stop before measuring.
- This audit does not replace a browser-based review of every page state, but it covers the shared colors used by navigation, cards, CTAs, footer, hero sections, and form surfaces.
