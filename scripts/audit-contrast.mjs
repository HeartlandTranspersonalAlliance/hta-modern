import { mkdirSync, writeFileSync } from 'node:fs';

const outFile = 'docs/audits/contrast-audit.md';

const hexToRgb = (hex) => {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((part) => part + part)
          .join('')
      : normalized;

  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
};

const mix = (front, back, alpha) => ({
  r: Math.round(front.r * alpha + back.r * (1 - alpha)),
  g: Math.round(front.g * alpha + back.g * (1 - alpha)),
  b: Math.round(front.b * alpha + back.b * (1 - alpha)),
});

const srgb = (channel) => {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminance = ({ r, g, b }) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);

const ratio = (fg, bg) => {
  const lighter = Math.max(luminance(fg), luminance(bg));
  const darker = Math.min(luminance(fg), luminance(bg));
  return (lighter + 0.05) / (darker + 0.05);
};

const color = (hex) => hexToRgb(hex);
const alpha = (hex, bg, opacity) => mix(color(hex), color(bg), opacity);

const checks = [
  {
    group: 'Light theme body and surfaces',
    rows: [
      ['Body text on page', '#20333a', '#f4f7f5'],
      ['Muted text on page', '#4c6166', '#f4f7f5'],
      ['Strong text on page', '#071624', '#f4f7f5'],
      ['Body text on surface card', '#20333a', '#ffffff'],
      ['Muted text on surface card', '#4c6166', '#ffffff'],
      ['Strong text on paper panel', '#071624', '#fffdf6'],
      ['Link on page', '#075f72', '#f4f7f5'],
      ['Link hover on page', '#063f4e', '#f4f7f5'],
    ],
  },
  {
    group: 'Light theme components',
    rows: [
      ['Primary button text', '#071624', '#f4c84a'],
      ['CTA title on light CTA', '#071624', '#edf5f2'],
      ['CTA muted text on light CTA', '#4c6166', '#edf5f2'],
      ['Footer muted text on light footer', '#516368', '#edf4f1'],
      ['Primary accent label on card', '#087086', '#ffffff'],
      ['Secondary accent label on card', '#26745f', '#ffffff'],
      ['Warm accent label on card', '#8a6500', '#ffffff'],
    ],
  },
  {
    group: 'Dark theme body and surfaces',
    rows: [
      ['Body text on page', '#e8f2f1', '#071624'],
      ['Muted text on page', '#c3d4d2', '#071624'],
      ['Strong text on page', '#ffffff', '#071624'],
      ['Body text on surface card', '#e8f2f1', '#0d2334'],
      ['Muted text on surface card', '#c3d4d2', '#0d2334'],
      ['Link on page', '#64d8f3', '#071624'],
      ['Link hover on page', '#ffffff', '#071624'],
    ],
  },
  {
    group: 'Dark and institutional components',
    rows: [
      ['Hero title on institutional navy', '#ffffff', '#09243a'],
      ['Hero body at 80 percent white', alpha('#ffffff', '#09243a', 0.8), '#09243a'],
      ['Hero stat label at 70 percent white', alpha('#ffffff', '#09243a', 0.7), '#09243a'],
      ['CTA title on dark CTA', '#ffffff', '#0a2b42'],
      ['CTA muted text on dark CTA', alpha('#ffffff', '#0a2b42', 0.78), '#0a2b42'],
      ['Footer muted text on dark footer', alpha('#ffffff', '#050d16', 0.78), '#050d16'],
      ['Primary accent label on dark card', '#64d8f3', '#0d2334'],
      ['Secondary accent label on dark card', '#82d8bd', '#0d2334'],
      ['Warm accent label on dark card', '#f6d36a', '#0d2334'],
    ],
  },
];

const formatColor = (value) => (typeof value === 'string' ? value : `rgb(${value.r} ${value.g} ${value.b})`);

const rows = checks.flatMap(({ group, rows }) =>
  rows.map(([name, fg, bg]) => {
    const score = ratio(typeof fg === 'string' ? color(fg) : fg, typeof bg === 'string' ? color(bg) : bg);
    return {
      group,
      name,
      fg: formatColor(fg),
      bg: formatColor(bg),
      ratio: score,
      pass: score >= 4.5,
    };
  })
);

const failures = rows.filter((row) => !row.pass);
const now = new Date().toISOString().slice(0, 10);

const markdown = `# Contrast Audit

Generated: ${now}

Scope: primary HTA design tokens and recurring component states after the frontend refinement passes. Ratios are calculated using WCAG relative luminance. Normal text target is WCAG AA 4.5:1.

## Summary

- Checks run: ${rows.length}
- WCAG AA normal-text failures: ${failures.length}
- Result: ${failures.length === 0 ? 'PASS' : 'NEEDS ATTENTION'}

## Results

| Area | Pair | Foreground | Background | Ratio | AA |
| --- | --- | --- | --- | ---: | --- |
${rows
  .map(
    (row) =>
      `| ${row.group} | ${row.name} | \`${row.fg}\` | \`${row.bg}\` | ${row.ratio.toFixed(2)} | ${row.pass ? 'Pass' : 'Fail'} |`
  )
  .join('\n')}

## Notes

- Gradient surfaces were tested against representative stops rather than every rendered pixel.
- Semi-transparent white hero, CTA, and footer text was composited against the relevant dark stop before measuring.
- This audit does not replace a browser-based review of every page state, but it covers the shared colors used by navigation, cards, CTAs, footer, hero sections, and form surfaces.
`;

mkdirSync('docs/audits', { recursive: true });
writeFileSync(outFile, markdown);

if (failures.length) {
  console.error(`Contrast audit failed: ${failures.length} pair(s) below 4.5:1.`);
  process.exitCode = 1;
} else {
  console.log(`Contrast audit passed: ${rows.length} pair(s) checked. Wrote ${outFile}.`);
}
