# Asset Audit

Generated: 2026-05-02

Scope: local assets in `src/assets` and `public/images`, plus remote URLs referenced from source, public files, and scripts.

## Summary

- Local assets checked: 33
- Referenced local assets: 15
- Unreferenced local assets: 18
- Remote URLs in source: 17
- Remote image URLs in source: 0

## Local Assets

| Asset                                                  |     Size | Referenced |
| ------------------------------------------------------ | -------: | ---------- |
| `src/assets/favicons/apple-touch-icon.png`             |   5.4 KB | Yes        |
| `src/assets/favicons/favicon.ico`                      |  14.7 KB | Yes        |
| `src/assets/favicons/favicon.svg`                      |    749 B | Yes        |
| `src/assets/images/hta/ashley-bio.jpg`                 | 101.7 KB | Yes        |
| `src/assets/images/hta/christine-bio.jpg`              | 846.7 KB | Yes        |
| `src/assets/images/hta/dale-bio2.jpg`                  | 297.1 KB | Yes        |
| `src/assets/images/hta/hero-image.jpg`                 | 905.0 KB | Yes        |
| `src/assets/images/hta/hta_darklogo.png`               | 329.5 KB | No         |
| `src/assets/images/hta/liz-bio-3.png`                  |  2.39 MB | Yes        |
| `src/assets/images/hta/nate-bio.jpg`                   |  85.7 KB | Yes        |
| `src/assets/images/hta/visuals/community.svg`          |    568 B | No         |
| `src/assets/images/hta/visuals/editorial-geometry.svg` |    637 B | Yes        |
| `src/assets/images/hta/visuals/education.svg`          |    510 B | No         |
| `src/assets/images/hta/visuals/event-support.svg`      |    516 B | No         |
| `src/assets/images/hta/visuals/harm-reduction.svg`     |    446 B | No         |
| `src/assets/images/hta/visuals/integration.svg`        |    558 B | No         |
| `src/assets/images/hta/visuals/public-health-grid.svg` |   3.5 KB | Yes        |
| `src/assets/images/hta/visuals/research.svg`           |    501 B | No         |
| `src/assets/images/hta_background.png`                 | 342.9 KB | No         |
| `src/assets/images/hta_header_footer.png`              | 213.8 KB | Yes        |
| `src/assets/images/hta_logo.png`                       |  10.2 KB | No         |
| `src/assets/images/hta_social_share.png`               | 329.5 KB | Yes        |
| `src/assets/styles/tailwind.css`                       |  16.4 KB | Yes        |
| `public/images/hta/ashley-bio.jpg`                     | 101.7 KB | Yes        |
| `public/images/hta/bio-photo.jpg`                      |   1.6 KB | No         |
| `public/images/hta/christine-bio.jpg`                  | 846.7 KB | No         |
| `public/images/hta/dale-bio-2.jpeg`                    |  50.1 KB | No         |
| `public/images/hta/dale-bio2.jpg`                      | 297.1 KB | No         |
| `public/images/hta/elizabeth-bio.jpg`                  | 495.4 KB | No         |
| `public/images/hta/hero-image.jpg`                     | 905.0 KB | No         |
| `public/images/hta/liz-bio-3.png`                      |  2.39 MB | No         |
| `public/images/hta/nate-bio.jpg`                       |  85.7 KB | No         |
| `public/images/hta/shannon-bio.jpg`                    |  75.3 KB | No         |

## Remote Image URLs

No remote image URLs remain in source.

## Unreferenced Candidates

- `src/assets/images/hta/hta_darklogo.png`
- `src/assets/images/hta/visuals/community.svg`
- `src/assets/images/hta/visuals/education.svg`
- `src/assets/images/hta/visuals/event-support.svg`
- `src/assets/images/hta/visuals/harm-reduction.svg`
- `src/assets/images/hta/visuals/integration.svg`
- `src/assets/images/hta/visuals/research.svg`
- `src/assets/images/hta_background.png`
- `src/assets/images/hta_logo.png`
- `public/images/hta/bio-photo.jpg`
- `public/images/hta/christine-bio.jpg`
- `public/images/hta/dale-bio-2.jpeg`
- `public/images/hta/dale-bio2.jpg`
- `public/images/hta/elizabeth-bio.jpg`
- `public/images/hta/hero-image.jpg`
- `public/images/hta/liz-bio-3.png`
- `public/images/hta/nate-bio.jpg`
- `public/images/hta/shannon-bio.jpg`

## Notes

- The audit uses static text matching, so dynamic references should still be reviewed manually before deleting assets.
- Public images are treated as referenced when source includes their public URL, such as `/images/hta/example.jpg`.
- Remote non-image URLs include external program links, social/share links, and embedded service URLs.
- Per project direction, HTA/Dale-added assets are documented but not deleted automatically.
