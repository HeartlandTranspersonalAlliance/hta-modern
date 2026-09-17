import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const favicon = await readFile(new URL('../src/assets/favicons/favicon.svg', import.meta.url));
await sharp(favicon)
  .resize(180, 180)
  .png()
  .toFile(new URL('../src/assets/favicons/apple-touch-icon.png', import.meta.url).pathname);
const png = await sharp(favicon).resize(32, 32).png().toBuffer();
const ico = Buffer.alloc(22);
ico.writeUInt16LE(1, 2);
ico.writeUInt16LE(1, 4);
ico[6] = 32;
ico[7] = 32;
ico.writeUInt16LE(1, 10);
ico.writeUInt16LE(32, 12);
ico.writeUInt32LE(png.length, 14);
ico.writeUInt32LE(22, 18);
await writeFile(new URL('../src/assets/favicons/favicon.ico', import.meta.url), Buffer.concat([ico, png]));
await sharp(await readFile(new URL('../src/assets/images/hta/social-card.svg', import.meta.url)))
  .png()
  .toFile(new URL('../src/assets/images/hta_social_share.png', import.meta.url).pathname);
