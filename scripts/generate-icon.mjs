// Генерирует icon-source.png (1024x1024, RGBA) — исходник для `tauri icon`.
// Тёмный фон #0d1117 + бирюзовый круг #2d8a6e (заглушка; замените на свой логотип).
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const SIZE = 1024;

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0); // width
ihdr.writeUInt32BE(SIZE, 4); // height
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type: RGBA
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

const raw = Buffer.alloc(SIZE * (1 + SIZE * 4));
const cx = SIZE / 2;
const cy = SIZE / 2;
const r = SIZE * 0.32;
const bg = [13, 17, 23]; // #0d1117
const fg = [45, 138, 110]; // #2d8a6e

let offset = 0;
for (let y = 0; y < SIZE; y++) {
  raw[offset++] = 0; // filter: none
  for (let x = 0; x < SIZE; x++) {
    const dx = x - cx;
    const dy = y - cy;
    const c = dx * dx + dy * dy <= r * r ? fg : bg;
    raw[offset++] = c[0];
    raw[offset++] = c[1];
    raw[offset++] = c[2];
    raw[offset++] = 255;
  }
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

writeFileSync(new URL('../icon-source.png', import.meta.url), png);
console.log('Generated icon-source.png:', png.length, 'bytes');
