import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const outFile = 'docs/audits/asset-audit.md';
const sourceRoots = ['src', 'public', 'scripts'];
const assetRoots = ['src/assets', 'public/images'];
const textExtensions = new Set([
  '.astro',
  '.css',
  '.js',
  '.mjs',
  '.ts',
  '.md',
  '.mdx',
  '.yaml',
  '.yml',
  '.json',
  '.html',
  '.xml',
  '.txt',
]);

const walk = (dir) => {
  let files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files = files.concat(walk(path));
    } else {
      files.push(path);
    }
  }
  return files;
};

const allSourceFiles = sourceRoots.flatMap((root) => walk(root)).filter((path) => textExtensions.has(extname(path)));
const sourceText = allSourceFiles.map((path) => `${path}\n${readFileSync(path, 'utf8')}`).join('\n');

const allAssets = assetRoots.flatMap((root) => walk(root));
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasToken = (text, token) => new RegExp(`(^|['"(:=\\s])${escapeRegExp(token)}($|['")\\s])`, 'm').test(text);
const assetRows = allAssets.map((path) => {
  const rel = relative('.', path);
  const aliases = [rel, rel.replace(/^src\//, '~/'), rel.replace(/^public/, ''), rel.replace(/^public\//, '/')].filter(
    Boolean
  );
  const referenced = aliases.some((alias) => hasToken(sourceText, alias));

  return {
    path: rel,
    referenced,
    size: statSync(path).size,
  };
});

const remoteMatches = [...sourceText.matchAll(/https?:\/\/[^'")\s<>]+/g)].map((match) => match[0]);
const remoteUrls = [...new Set(remoteMatches)].sort();
const imageUrls = remoteUrls.filter(
  (url) =>
    /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(url) || url.includes('images.unsplash.com') || url.includes('pixabay.com')
);
const unused = assetRows.filter((row) => !row.referenced);
const now = new Date().toISOString().slice(0, 10);

const formatBytes = (bytes) => {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  if (bytes > 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
};

const markdown = `# Asset Audit

Generated: ${now}

Scope: local assets in \`src/assets\` and \`public/images\`, plus remote URLs referenced from source, public files, and scripts.

## Summary

- Local assets checked: ${assetRows.length}
- Referenced local assets: ${assetRows.length - unused.length}
- Unreferenced local assets: ${unused.length}
- Remote URLs in source: ${remoteUrls.length}
- Remote image URLs in source: ${imageUrls.length}

## Local Assets

| Asset | Size | Referenced |
| --- | ---: | --- |
${assetRows.map((row) => `| \`${row.path}\` | ${formatBytes(row.size)} | ${row.referenced ? 'Yes' : 'No'} |`).join('\n')}

## Remote Image URLs

${imageUrls.length ? imageUrls.map((url) => `- ${url}`).join('\n') : 'No remote image URLs remain in source.'}

## Unreferenced Candidates

${unused.length ? unused.map((row) => `- \`${row.path}\``).join('\n') : 'No unreferenced local assets were detected.'}

## Notes

- The audit uses static text matching, so dynamic references should still be reviewed manually before deleting assets.
- Public images are treated as referenced when source includes their public URL, such as \`/images/hta/example.jpg\`.
- Remote non-image URLs include external program links, social/share links, and embedded service URLs.
- Per project direction, HTA/Dale-added assets are documented but not deleted automatically.
`;

mkdirSync('docs/audits', { recursive: true });
writeFileSync(outFile, markdown);
console.log(`Asset audit checked ${assetRows.length} local asset(s). Wrote ${outFile}.`);
