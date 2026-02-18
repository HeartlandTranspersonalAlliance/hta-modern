import { cp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, 'dist');
const offlineDir = path.join(projectRoot, 'dist-offline');

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      return [full];
    })
  );
  return files.flat();
};

const relPrefixForFile = (filePath, rootDir) => {
  const relDir = path.relative(rootDir, path.dirname(filePath));
  if (!relDir) return './';
  const depth = relDir.split(path.sep).length;
  return '../'.repeat(depth);
};

const rewriteHtml = (html, prefix) => {
  return html
    .replace(/(href|src|poster)=(["'])\/(?!\/)/g, `$1=$2${prefix}`)
    .replace(/(srcset)=(["'])\/(?!\/)/g, `$1=$2${prefix}`)
    .replace(/(content)=(["'])\/(?!\/)/g, `$1=$2${prefix}`)
    .replace(/,\s*\/(?!\/)/g, `, ${prefix}`)
    .replace(/url\(\/(?!\/)/g, `url(${prefix}`);
};

const rewriteCssOrJs = (content) => {
  return content
    .replace(/\"\/_astro\//g, '"./_astro/')
    .replace(/\'\/_astro\//g, "'./_astro/")
    .replace(/\(\/_astro\//g, '(./_astro/')
    .replace(/url\(\/_astro\//g, 'url(./_astro/');
};

await rm(offlineDir, { recursive: true, force: true });
await cp(distDir, offlineDir, { recursive: true });

const files = await walk(offlineDir);

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (!['.html', '.css', '.js', '.mjs'].includes(ext)) continue;

  const content = await readFile(file, 'utf8');

  let rewritten = content;
  if (ext === '.html') {
    const prefix = relPrefixForFile(file, offlineDir);
    rewritten = rewriteHtml(content, prefix);
  } else {
    rewritten = rewriteCssOrJs(content);
  }

  if (rewritten !== content) {
    await writeFile(file, rewritten, 'utf8');
  }
}

const indexPath = path.join(offlineDir, 'index.html');
const indexExists = await stat(indexPath).then(() => true).catch(() => false);
if (indexExists) {
  console.log('Offline bundle ready at dist-offline/index.html');
}
