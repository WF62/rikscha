'use client';
import { useEffect } from 'react';

// Minimal QR Code encoder (EPC SEPA format, MIT)
function getBit(x: number, i: number) { return ((x >>> i) & 1) !== 0; }

class BitBuffer {
  data: number[] = []; length = 0;
  appendBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      if (this.length >= this.data.length * 8) this.data.push(0);
      if (getBit(val, i)) this.data[this.data.length - 1] |= 1 << (7 - (this.length % 8));
      this.length++;
    }
  }
  getByte(i: number) { return this.data[i >> 3]; }
}

class ReedSolomon {
  coefficients: number[];
  constructor(degree: number) {
    this.coefficients = new Array(degree).fill(0);
    this.coefficients[degree - 1] = 1;
    let root = 1;
    for (let i = 0; i < degree; i++) {
      for (let j = 0; j < this.coefficients.length; j++) {
        this.coefficients[j] = ReedSolomon.mul(this.coefficients[j], root);
        if (j + 1 < this.coefficients.length) this.coefficients[j] ^= this.coefficients[j + 1];
      }
      root = ReedSolomon.mul(root, 0x02);
    }
  }
  getRemainder(data: number[]) {
    const r = new Array(this.coefficients.length).fill(0);
    for (const b of data) { const f = b ^ r.shift()!; r.push(0); for (let i = 0; i < r.length; i++) r[i] ^= ReedSolomon.mul(this.coefficients[i], f); }
    return r;
  }
  static mul(x: number, y: number) { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z; }
}

const ECC_BLOCKS = [
  [-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],
  [-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],
  [-1,1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],
  [-1,1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81],
];
const ECC_CW = [
  [-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
  [-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],
  [-1,13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
  [-1,17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
];

function getRawMods(ver: number) {
  let r = (16 * ver + 128) * ver + 64;
  if (ver >= 2) { const na = Math.floor(ver / 7) + 2; r -= (25 * na - 10) * na - 55; if (ver >= 7) r -= 36; }
  return r;
}
function getDataCW(ver: number, ecl: number) { return Math.floor(getRawMods(ver) / 8) - ECC_CW[ecl][ver] * ECC_BLOCKS[ecl][ver]; }

function makeQR(text: string) {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) { bytes.push(0xC0 | (c >> 6)); bytes.push(0x80 | (c & 0x3F)); }
    else { bytes.push(0xE0 | (c >> 12)); bytes.push(0x80 | ((c >> 6) & 0x3F)); bytes.push(0x80 | (c & 0x3F)); }
  }
  const ecl = 1; // MEDIUM
  let ver = 1;
  for (; ver <= 40; ver++) { if (4 + 8 + bytes.length * 8 <= getDataCW(ver, ecl) * 8) break; }

  const bb = new BitBuffer();
  bb.appendBits(0x4, 4); bb.appendBits(bytes.length, ver < 10 ? 8 : 16);
  for (const b of bytes) bb.appendBits(b, 8);
  const cap = getDataCW(ver, ecl) * 8;
  bb.appendBits(0, Math.min(4, cap - bb.length));
  bb.appendBits(0, (8 - bb.length % 8) % 8);
  for (let pad = 0xEC; bb.length < cap; pad ^= 0xEC ^ 0x11) bb.appendBits(pad, 8);
  const dataCW: number[] = [];
  for (let i = 0; i < bb.length; i += 8) dataCW.push(bb.getByte(i));

  const numBlocks = ECC_BLOCKS[ecl][ver], blockEcc = ECC_CW[ecl][ver];
  const raw = Math.floor(getRawMods(ver) / 8), shortBlocks = numBlocks - raw % numBlocks;
  const shortLen = Math.floor(raw / numBlocks);
  const blocks: number[][] = []; let k = 0;
  for (let i = 0; i < numBlocks; i++) {
    const dat = dataCW.slice(k, k + shortLen - blockEcc + (i < shortBlocks ? 0 : 1)); k += dat.length;
    const block = [...dat, ...new ReedSolomon(blockEcc).getRemainder(dat)];
    blocks.push(block);
  }
  const allCW: number[] = [];
  for (let i = 0; i < blocks[0].length; i++) for (let j = 0; j < blocks.length; j++) if (i !== shortLen - blockEcc || j >= shortBlocks) allCW.push(blocks[j][i]);

  const size = ver * 4 + 17;
  const mod = Array.from({length: size}, () => new Array(size).fill(false));
  const fn = Array.from({length: size}, () => new Array(size).fill(false));
  const setF = (x: number, y: number, v: boolean) => { mod[y][x] = v; fn[y][x] = true; };

  const finder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const xx = cx + dx, yy = cy + dy;
      if (xx >= 0 && xx < size && yy >= 0 && yy < size) setF(xx, yy, Math.max(Math.abs(dx), Math.abs(dy)) !== 2 && Math.max(Math.abs(dx), Math.abs(dy)) !== 4);
    }
  };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  for (let i = 0; i < size; i++) { setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }

  const ap = ver === 1 ? [] : (() => {
    const na = Math.floor(ver / 7) + 2, step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (na * 2 - 2)) * 2;
    const r = [6]; for (let p = size - 7; r.length < na; p -= step) r.splice(1, 0, p); return r;
  })();
  for (let i = 0; i < ap.length; i++) for (let j = 0; j < ap.length; j++) {
    if ((i === 0 && j === 0) || (i === 0 && j === ap.length - 1) || (i === ap.length - 1 && j === 0)) continue;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setF(ap[j] + dx, ap[i] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }

  const drawFmt = (mask: number) => {
    const ecFmt = (ecl as number) === 0 ? 1 : (ecl as number) === 1 ? 0 : (ecl as number) === 2 ? 3 : 2;
    const data = ecFmt << 3 | mask; let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = (data << 10 | rem) ^ 0x5412;
    for (let i = 0; i <= 5; i++) setF(8, i, getBit(bits, i));
    setF(8, 7, getBit(bits, 6)); setF(8, 8, getBit(bits, 7)); setF(7, 8, getBit(bits, 8));
    for (let i = 9; i < 15; i++) setF(14 - i, 8, getBit(bits, i));
    for (let i = 0; i < 8; i++) setF(size - 1 - i, 8, getBit(bits, i));
    for (let i = 8; i < 15; i++) setF(8, size - 15 + i, getBit(bits, i));
    setF(8, size - 8, true);
  };
  drawFmt(0);

  if (ver >= 7) {
    let rem = ver; for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
    const bits = ver << 12 | rem;
    for (let i = 0; i < 18; i++) { setF(size - 11 + i % 3, Math.floor(i / 3), getBit(bits, i)); setF(Math.floor(i / 3), size - 11 + i % 3, getBit(bits, i)); }
  }

  let ci = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j, upward = ((right + 1) & 2) === 0, y = upward ? size - 1 - vert : vert;
      if (!fn[y][x] && ci < allCW.length * 8) { mod[y][x] = getBit(allCW[ci >>> 3], 7 - (ci & 7)); ci++; }
    }
  }

  // find best mask
  let bestMask = 0, bestPenalty = Infinity;
  for (let m = 0; m < 8; m++) {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (!fn[y][x]) {
        const inv = [0,1,2,3,4,5,6,7].map(k => [
          (x+y)%2===0, y%2===0, x%3===0, (x+y)%3===0,
          (Math.floor(y/2)+Math.floor(x/3))%2===0, x*y%2+x*y%3===0,
          (x*y%2+x*y%3)%2===0, ((x+y)%2+x*y%3)%2===0
        ][k])[m];
        if (inv) mod[y][x] = !mod[y][x];
      }
    }
    let pen = 0;
    for (let y2 = 0; y2 < size - 1; y2++) for (let x2 = 0; x2 < size - 1; x2++) {
      const c = mod[y2][x2]; if (c===mod[y2][x2+1]&&c===mod[y2+1][x2]&&c===mod[y2+1][x2+1]) pen += 3;
    }
    if (pen < bestPenalty) { bestPenalty = pen; bestMask = m; }
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (!fn[y][x]) {
        const inv = [0,1,2,3,4,5,6,7].map(k => [
          (x+y)%2===0, y%2===0, x%3===0, (x+y)%3===0,
          (Math.floor(y/2)+Math.floor(x/3))%2===0, x*y%2+x*y%3===0,
          (x*y%2+x*y%3)%2===0, ((x+y)%2+x*y%3)%2===0
        ][k])[m];
        if (inv) mod[y][x] = !mod[y][x];
      }
    }
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (!fn[y][x]) {
      const inv = [0,1,2,3,4,5,6,7].map(k => [
        (x+y)%2===0, y%2===0, x%3===0, (x+y)%3===0,
        (Math.floor(y/2)+Math.floor(x/3))%2===0, x*y%2+x*y%3===0,
        (x*y%2+x*y%3)%2===0, ((x+y)%2+x*y%3)%2===0
      ][k])[bestMask];
      if (inv) mod[y][x] = !mod[y][x];
    }
  }
  drawFmt(bestMask);
  return { modules: mod, size };
}

function drawOnCanvas(id: string, text: string) {
  const canvas = document.getElementById(id) as HTMLCanvasElement | null;
  if (!canvas) return;
  try {
    const qr = makeQR(text);
    const ctx = canvas.getContext('2d')!;
    const scale = Math.floor(160 / (qr.size + 8));
    const offset = Math.floor((160 - qr.size * scale) / 2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 160, 160);
    ctx.fillStyle = '#000000';
    for (let y = 0; y < qr.size; y++)
      for (let x = 0; x < qr.size; x++)
        if (qr.modules[y][x]) ctx.fillRect(offset + x * scale, offset + y * scale, scale, scale);
  } catch { /* ignore */ }
}

const EPC_KSK = ['BCD','002','1','SCT','COKSDE33XXX','Förderverein Miteinander Kloster Merten e. V.','DE79370502990049005040','EUR','','','Rikscha',''].join('\n');
const EPC_VB  = ['BCD','002','1','SCT','GENODED1BRS','Förderverein Miteinander Kloster Merten e. V.','DE14380601860410056011','EUR','','','Rikscha',''].join('\n');

export default function QrSpenden() {
  useEffect(() => {
    drawOnCanvas('qr-ksk', EPC_KSK);
    drawOnCanvas('qr-vb',  EPC_VB);
  }, []);
  return null;
}
