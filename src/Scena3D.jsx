// BACKUP 20.07.2026 — src/Scena3D.jsx FINAL (configurator acoperis v1)
// Include: texturi procedurale+bump, sRGB, UV pe linia pantei, ocluzie
// streasina, pazii+hip ridges, horn, lumina laterala ierarhizata, vigneta.
// Structura proiect: vezi acoperis-REPRODUCERE.txt
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { adaugaGradina, tickVant } from "./gradina";
import { creeazaZi } from "./zi";
import { CONFIG_ACOPERIS as C } from "../config/CONFIG";

// Generează textură de pavaj (piatră cubică cu rosturi)
function texPavaj() {
  const S = 1024;
  const canvas = document.createElement('canvas'); canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext('2d');
  const hash = (a, b) => { let h = a*374761393+b*668265263+1274126177; h=(h^(h>>13))*1274126177; return (h^(h>>16))/2147483648; };

  // Rosturi — gri-închis cald
  ctx.fillStyle = '#6b6058'; ctx.fillRect(0, 0, S, S);
  // Textură mortar
  for (let i = 0; i < 4000; i++) {
    const v = 100 + hash(i, 0.1) * 20;
    ctx.fillStyle = `rgba(${v|0},${(v-3)|0},${(v-8)|0},0.35)`;
    ctx.fillRect(hash(0.2, i) * S, hash(0.4, i) * S, 2 + hash(0.6, i) * 4, 1.5);
  }

  const tileW = 92, tileH = 72, gap = 5, radius = 6;
  const rows = Math.ceil(S / (tileH + gap)) + 1;
  for (let row = 0; row < rows; row++) {
    const y = row * (tileH + gap);
    const off = (row % 2) * ((tileW + gap) / 2);
    const cols = Math.ceil(S / (tileW + gap)) + 2;
    for (let col = -1; col < cols; col++) {
      const x0 = col * (tileW + gap) + off;
      const tx = x0 + gap, ty = y + gap, tw = tileW - gap * 2, th = tileH - gap * 2;
      // Piatră cu variație caldă (gri-bej)
      const r = 185 + (hash(row, col) - 0.5) * 35;
      const g = 175 + (hash(row + 0.3, col) - 0.5) * 30;
      const b = 160 + (hash(row + 0.6, col) - 0.5) * 25;
      ctx.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
      ctx.beginPath();
      ctx.moveTo(tx + radius, ty); ctx.lineTo(tx + tw - radius, ty);
      ctx.quadraticCurveTo(tx + tw, ty, tx + tw, ty + radius);
      ctx.lineTo(tx + tw, ty + th - radius);
      ctx.quadraticCurveTo(tx + tw, ty + th, tx + tw - radius, ty + th);
      ctx.lineTo(tx + radius, ty + th);
      ctx.quadraticCurveTo(tx, ty + th, tx, ty + th - radius);
      ctx.lineTo(tx, ty + radius);
      ctx.quadraticCurveTo(tx, ty, tx + radius, ty);
      ctx.closePath(); ctx.fill();
      // Highlight muchie superioară (prinde lumină)
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(tx + 3, ty, tw - 6, 3);
      // Umbră muchie inferioară
      ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(tx + 2, ty + th - 3, tw - 4, 3);
      // Granulație piatră
      for (let i = 0; i < 40; i++) {
        const gx = tx + 4 + hash(row * 7 + i, col) * (tw - 8);
        const gy = ty + 6 + hash(row * 11 + i, col * 3) * (th - 12);
        const br = 70 + hash(i, row) * 50;
        ctx.fillStyle = `rgba(${br|0},${br|0},${br|0},0.10)`;
        ctx.fillRect(gx, gy, 1.5 + hash(i, col) * 2.5, 1.5);
      }
      // Micro-imperfecțiuni (pitting)
      if (hash(row, col) > 0.65) {
        const px2 = tx + 6 + hash(row + 1, col) * (tw - 14);
        const py2 = ty + 8 + hash(row, col + 1) * (th - 16);
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.fillRect(px2, py2, 2 + hash(row, col) * 4, 2);
      }
    }
  }

  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); t.anisotropy = 16;
  t.colorSpace = THREE.SRGBColorSpace;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true;

  // Bump map
  const b = document.createElement('canvas'); b.width = b.height = S;
  const bx = b.getContext('2d');
  bx.fillStyle = '#303030'; bx.fillRect(0, 0, S, S);
  for (let row = 0; row < rows; row++) {
    const y = row * (tileH + gap), off = (row % 2) * ((tileW + gap) / 2);
    const cols2 = Math.ceil(S / (tileW + gap)) + 2;
    for (let col = -1; col < cols2; col++) {
      const x0 = col * (tileW + gap) + off;
      bx.fillStyle = '#e8e8e8'; bx.fillRect(x0 + gap, y + gap, tileW - gap * 2, tileH - gap * 2);
      bx.fillStyle = '#ffffff'; bx.fillRect(x0 + gap, y + gap, tileW - gap * 2, 3);
      bx.fillStyle = '#c8c8c8'; bx.fillRect(x0 + gap, y + gap + tileH - gap * 2 - 2, tileW - gap * 2, 3);
    }
  }
  for (let i = 0; i < 5000; i++) {
    const v = 128 + (hash(i, 0.1) - 0.5) * 35;
    bx.fillStyle = `rgb(${v|0},${v|0},${v|0})`;
    bx.fillRect(hash(0.3, i) * S, hash(0.5, i) * S, 2 + hash(0.7, i) * 3, 1.5);
  }
  const bt = new THREE.CanvasTexture(b);
  bt.wrapS = bt.wrapT = THREE.RepeatWrapping; bt.repeat.set(6, 6); bt.anisotropy = 16;
  bt.minFilter = THREE.LinearMipmapLinearFilter; bt.magFilter = THREE.LinearFilter;
  bt.generateMipmaps = true;
  return { map: srgb(t), bump: bt };
}






const rad = g => (g * Math.PI) / 180;
const srgb = t => { if ("colorSpace" in t) t.colorSpace = THREE.SRGBColorSpace; else t.encoding = THREE.sRGBEncoding; return t; };

function meshTri(tris, mat, uvScale = 0.55) {
  const pos = new Float32Array(tris.flat(2));
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const uv = new Float32Array((pos.length / 3) * 2);
  for (let tI = 0; tI < pos.length; tI += 9) {
    const p = k => new THREE.Vector3(pos[tI + k * 3], pos[tI + k * 3 + 1], pos[tI + k * 3 + 2]);
    const a = p(0), b2 = p(1), c2 = p(2);
    const n = b2.clone().sub(a).cross(c2.clone().sub(a)).normalize();
    let down = new THREE.Vector3(0, -1, 0).sub(n.clone().multiplyScalar(-n.y)).normalize();
    if (!isFinite(down.x) || down.lengthSq() < 1e-6) down = new THREE.Vector3(1, 0, 0);
    const along = down.clone().cross(n).normalize();
    for (let k = 0; k < 3; k++) {
      const P = p(k), j = ((tI / 9) * 3 + k) * 2;
      uv[j] = P.dot(along) * uvScale; uv[j + 1] = P.dot(down) * uvScale;
    }
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), r = Math.min(255, ((n >> 16) & 255) * f), g = Math.min(255, ((n >> 8) & 255) * f), b = Math.min(255, (n & 255) * f);
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function texInvelitoare(hex, tip) {
  const S = 1024;
  const c = document.createElement("canvas"); c.width = c.height = S;
  const x = c.getContext("2d");
  const hash = (a, b) => { let h = a*374761393+b*668265263+1274126177; h=(h^(h>>13))*1274126177; return (h^(h>>16))/2147483648; };
  const r0 = parseInt(hex.slice(1,3), 16), g0 = parseInt(hex.slice(3,5), 16), b0 = parseInt(hex.slice(5,7), 16);

  if (tip === "tabla") {
    // --- METAL STANDING SEAM ---
    const seamSpacing = 48; // pixels between seams (~40cm at roof scale)
    const seamWidth = 7;
    // Gradient base: darker at bottom of each panel
    const img = x.getImageData(0, 0, S, S);
    for (let py = 0; py < S; py++) {
      for (let px = 0; px < S; px++) {
        const i = (py * S + px) * 4;
        const panel = Math.floor(px / seamSpacing);
        const pos = px % seamSpacing;
        const seam = pos < seamWidth;
        const seamR = pos < 1 ? 1 : (pos > seamSpacing - 1 ? 1 : 0);
        const n = (hash(px * 0.13, py * 0.13) - 0.5) * 8;
        let rr = r0 + n, gg = g0 + n, bb = b0 + n;
        if (seam) {
          const sd = Math.min(pos + 1, seamSpacing - pos);
          const f = sd <= 0 ? 1 : Math.max(0, 1 - sd / seamWidth);
          rr -= 18 * f; gg -= 18 * f; bb -= 18 * f;
        }
        // Highlight on seam ridge
        if (pos >= 0 && pos <= 2) { rr += 22; gg += 22; bb += 22; }
        if (pos >= seamSpacing - 2 && pos <= seamSpacing - 1) { rr += 22; gg += 22; bb += 22; }
        // Subtle panel wave
        const wv = Math.sin(pos / seamSpacing * Math.PI) * 5;
        rr += wv; gg += wv; bb += wv;
        // Micro grain
        const grain = (hash(px * 1.7, py * 1.7) - 0.5) * 5;
        rr += grain; gg += grain; bb += grain;
        img.data[i] = Math.max(0, Math.min(255, rr));
        img.data[i+1] = Math.max(0, Math.min(255, gg));
        img.data[i+2] = Math.max(0, Math.min(255, bb));
        img.data[i+3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    // Horizontal overlaps
    for (let py = 0; py < S; py += 120) {
      const oy = py + (hash(0, py) - 0.5) * 4;
      x.fillStyle = "rgba(0,0,0,0.15)"; x.fillRect(0, oy, S, 2);
      x.fillStyle = "rgba(255,255,255,0.08)"; x.fillRect(0, oy + 2, S, 2);
      x.fillStyle = "rgba(0,0,0,0.06)"; x.fillRect(0, oy - 1, S, 1);
    }
    // Oxidation spots
    for (let i = 0; i < 500; i++) {
      const ox = Math.random() * S, oy = Math.random() * S;
      const r = 3 + Math.random() * 12;
      const g = x.createRadialGradient(ox, oy, 0, ox, oy, r);
      g.addColorStop(0, "rgba(255,255,255,0.06)"); g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g; x.fillRect(ox - r, oy - r, r * 2, r * 2);
    }
  } else {
    // --- CERAMIC TILE ---
    const tileH = 46, tileW = 78, gap = 4, curveRad = 18;
    // Mortar base
    x.fillStyle = "#332e29"; x.fillRect(0, 0, S, S);
    // Mortar texture
    for (let i = 0; i < 3000; i++) {
      const mx = Math.random() * S, my = Math.random() * S;
      x.fillStyle = `rgba(${50+Math.random()*20},${45+Math.random()*15},${40+Math.random()*15},0.5)`;
      x.fillRect(mx, my, 2 + Math.random() * 4, 2 + Math.random() * 3);
    }
    const rows = Math.ceil(S / (tileH + gap)) + 1;
    for (let row = 0; row < rows; row++) {
      const y = row * (tileH + gap);
      const off = (row % 2) * (tileW / 2 + gap / 2);
      const cols = Math.ceil(S / (tileW + gap)) + 2;
      for (let col = -1; col < cols; col++) {
        const x0 = col * (tileW + gap) + off;
        // Per-tile color (warm terracotta variation)
        const tSeed = row * 137 + col * 251;
        const tH = (hash(tSeed, tSeed * 0.3) - 0.5) * 34;
        const tS = (hash(tSeed * 0.7, tSeed * 1.1) - 0.5) * 16;
        const tL = (hash(tSeed * 1.3, tSeed * 0.5) - 0.5) * 8;
        const tr = Math.max(0, Math.min(255, r0 + tH));
        const tg = Math.max(0, Math.min(255, g0 + tH * 0.7 + tS));
        const tb = Math.max(0, Math.min(255, b0 + tH * 0.4 + tS));
        // Tile body (rounded rectangle with curved top)
        x.fillStyle = `rgb(${tr},${tg},${tb})`;
        const tx = x0 + gap, ty = y + gap, tw = tileW - gap * 2, th = tileH - gap * 2;
        x.beginPath();
        x.moveTo(tx + curveRad, ty);
        x.lineTo(tx + tw - curveRad, ty);
        x.quadraticCurveTo(tx + tw, ty, tx + tw, ty + curveRad);
        x.lineTo(tx + tw, ty + th);
        x.lineTo(tx, ty + th);
        x.lineTo(tx, ty + curveRad);
        x.quadraticCurveTo(tx, ty, tx + curveRad, ty);
        x.closePath();
        x.fill();
        // Top highlight (curved edge catches light)
        const hlGrad = x.createLinearGradient(0, ty, 0, ty + curveRad + 4);
        hlGrad.addColorStop(0, "rgba(255,255,255,0.28)");
        hlGrad.addColorStop(0.5, "rgba(255,255,255,0.10)");
        hlGrad.addColorStop(1, "rgba(0,0,0,0)");
        x.fillStyle = hlGrad;
        x.fillRect(tx, ty, tw, curveRad + 4);
        // Bottom shadow (tile curves into the one below)
        const shGrad = x.createLinearGradient(0, ty + th - 8, 0, ty + th + 2);
        shGrad.addColorStop(0, "rgba(0,0,0,0)");
        shGrad.addColorStop(0.5, "rgba(0,0,0,0.08)");
        shGrad.addColorStop(1, "rgba(0,0,0,0.28)");
        x.fillStyle = shGrad;
        x.fillRect(tx, ty + th - 8, tw, 10);
        // Left/right edge darkening
        x.fillStyle = "rgba(0,0,0,0.06)";
        x.fillRect(tx, ty, 3, th);
        x.fillRect(tx + tw - 3, ty, 3, th);
        // Surface grain
        for (let g = 0; g < 35; g++) {
          const gx = tx + 4 + Math.random() * (tw - 8);
          const gy = ty + curveRad + 4 + Math.random() * (th - curveRad - 8);
          x.fillStyle = `rgba(${tr + 15},${tg + 10},${tb + 5},0.12)`;
          x.fillRect(gx, gy, 1.5 + Math.random() * 2, 1 + Math.random() * 1.5);
        }
        // Occasional darker spot (fired clay variation)
        if (hash(row, col) > 0.78) {
          const sx = tx + 6 + hash(row + 0.5, col) * (tw - 16);
          const sy = ty + curveRad + 6 + hash(row, col + 0.5) * (th - curveRad - 12);
          const sr = 4 + hash(row, col) * 8;
          const sg = x.createRadialGradient(sx, sy, 0, sx, sy, sr);
          sg.addColorStop(0, "rgba(0,0,0,0.10)"); sg.addColorStop(1, "rgba(0,0,0,0)");
          x.fillStyle = sg; x.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
        }
      }
    }
    // Micro imperfections over whole surface
    for (let i = 0; i < 2000; i++) {
      const r = Math.random();
      x.fillStyle = r > 0.6 ? "rgba(255,255,255,0.015)" : r > 0.3 ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.008)";
      x.fillRect(Math.random() * S, Math.random() * S, 1 + Math.random() * 3, 1 + Math.random() * 2);
    }
  }

  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true;

  // --- BUMP MAP aligned with texture geometry ---
  const b = document.createElement("canvas"); b.width = b.height = S;
  const bx = b.getContext("2d");
  if (tip === "tabla") {
    bx.fillStyle = "#808080"; bx.fillRect(0, 0, S, S);
    const seamSpacing = 48, seamWidth = 7;
    for (let px = 0; px < S; px += seamSpacing) {
      bx.fillStyle = "#ffffff"; bx.fillRect(px, 0, seamWidth, S);
      bx.fillStyle = "#707070"; bx.fillRect(px + seamWidth, 0, 2, S);
      bx.fillStyle = "#c0c0c0"; bx.fillRect(px - 1, 0, 1, S);
    }
    for (let py = 0; py < S; py += 120) {
      bx.fillStyle = "#e0e0e0"; bx.fillRect(0, py, S, 2);
      bx.fillStyle = "#606060"; bx.fillRect(0, py + 2, S, 1);
    }
  } else {
    // Tile bump: bright tile bodies, dark mortar gaps
    bx.fillStyle = "#181818"; bx.fillRect(0, 0, S, S);
    const tileH = 46, tileW = 78, gap = 4;
    const rows = Math.ceil(S / (tileH + gap)) + 1;
    for (let row = 0; row < rows; row++) {
      const y = row * (tileH + gap), off = (row % 2) * (tileW / 2 + gap / 2);
      const cols = Math.ceil(S / (tileW + gap)) + 2;
      for (let col = -1; col < cols; col++) {
        const x0 = col * (tileW + gap) + off;
        const tx = x0 + gap, ty = y + gap, tw = tileW - gap * 2, th = tileH - gap * 2;
        // Tile body = raised (bright)
        bx.fillStyle = "#f0f0f0"; bx.fillRect(tx, ty, tw, th);
        // Top edge = brightest (catches light)
        bx.fillStyle = "#ffffff"; bx.fillRect(tx, ty, tw, 5);
        // Bottom edge = slightly darker (curves away)
        bx.fillStyle = "#d0d0d0"; bx.fillRect(tx, ty + th - 4, tw, 4);
      }
    }
  }
  // Grain layer on bump
  for (let i = 0; i < 5000; i++) {
    const v = 128 + (Math.random() - 0.5) * 16;
    bx.fillStyle = `rgb(${v},${v},${v})`;
    bx.fillRect(Math.random() * S, Math.random() * S, 1.5, 1.5);
  }
  const bt = new THREE.CanvasTexture(b);
  bt.wrapS = bt.wrapT = THREE.RepeatWrapping; bt.anisotropy = 16;
  bt.minFilter = THREE.LinearMipmapLinearFilter; bt.magFilter = THREE.LinearFilter;
  bt.generateMipmaps = true;
  return { map: srgb(t), bump: bt };
}

function texTeren() {
  const c = document.createElement("canvas"); c.width = c.height = 512;
  const x = c.getContext("2d");
  x.fillStyle = "#87927a"; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2200; i++) {
    x.fillStyle = ["#7d8a6f", "#8f9a80", "#79856d", "#93a086"][i % 4];
    x.globalAlpha = 0.25;
    x.fillRect(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 8, 2 + Math.random() * 5);
  }
  x.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(20, 20); t.anisotropy = 8;
  return srgb(t);
}

function texCer() {
  const c = document.createElement("canvas"); c.width = 16; c.height = 512;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#a9c3d4"); g.addColorStop(0.55, "#cfdde6"); g.addColorStop(1, "#e9ecea");
  x.fillStyle = g; x.fillRect(0, 0, 16, 512);
  const h = x.createRadialGradient(13, 130, 5, 13, 130, 260);
  h.addColorStop(0, "rgba(255,238,205,0.55)"); h.addColorStop(1, "rgba(255,238,205,0)");
  x.fillStyle = h; x.fillRect(0, 0, 16, 512);
  return srgb(new THREE.CanvasTexture(c));
}

function umbraContact() {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(128, 128, 10, 128, 128, 128);
  // Mai densă la bază (0.52), cădere mai rapidă → umbra "ține" casa lipită de
  // teren, nu o pată difuză care plutește. Ancorare vizuală.
  g.addColorStop(0, "rgba(26,28,22,0.52)");
  g.addColorStop(0.45, "rgba(26,28,22,0.22)");
  g.addColorStop(0.75, "rgba(26,28,22,0.07)");
  g.addColorStop(1, "rgba(26,28,22,0)");
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

export default function Scena3D({ cfg, ora = 0.35, culoareFatada = "#e9e4d9", snapRef = null }) {
  const mount = useRef(null);
  const ziRef = useRef(null);
  const zidRef = useRef(null);
  useEffect(() => {
    const el = mount.current, Wpx = el.clientWidth, Hpx = el.clientHeight;
    const { lungime: L, latime: W, panta, tip, material } = cfg;
    const hz = 2.8, ov = 0.5;
    const hRoof = (W / 2) * Math.tan(rad(panta));

    const scene = new THREE.Scene();
    // Cerul: generat dinamic de modulul zi.js (ciclu zi→apus), conectat
    // după crearea luminilor — orchestrează soare + cer + ferestre împreună.
    const cam = new THREE.PerspectiveCamera(38, Wpx / Hpx, 0.1, 400);
    const rnd = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    rnd.setPixelRatio(Math.min(window.devicePixelRatio, 2)); rnd.setSize(Wpx, Hpx);
    rnd.shadowMap.enabled = true; rnd.shadowMap.type = THREE.PCFSoftShadowMap; rnd.shadowMap.autoUpdate = false;
    if ("outputColorSpace" in rnd) rnd.outputColorSpace = THREE.SRGBColorSpace;
    else rnd.outputEncoding = THREE.sRGBEncoding;
    rnd.toneMapping = THREE.ACESFilmicToneMapping;
  rnd.toneMappingExposure = 1.15;
    rnd.setClearColor(0xdce8f0);
    el.appendChild(rnd.domElement);

    // Snapshot: randăm proaspăt (preserveDrawingBuffer e activ) și descărcăm
    // canvas-ul ca PNG. Clientul pleacă cu poza casei LUI — cel mai puternic
    // instrument de vânzare, cost aproape zero.
    if (snapRef) snapRef.current = () => {
      rnd.render(scene, cam);
      const link = document.createElement("a");
      link.download = `casa-${cfg.lungime}x${cfg.latime}m.png`;
      link.href = rnd.domElement.toDataURL("image/png");
      link.click();
    };

    scene.fog = new THREE.Fog("#e6eae7", 30, 95);

    // Environment map: materialele au envMapIntensity setat, dar fără un mediu
    // de reflectat nu fac nimic — un motiv-cheie pentru care casa părea plată.
    // Generăm un mediu neutru cald din care suprafețele "primesc" lumină de jur
    // împrejur (image-based lighting). Acum roughnessMap-ul zidului, geamurile
    // și tabla prind viață — au în sfârșit ce reflecta.
    {
      const pmrem = new THREE.PMREMGenerator(rnd);
      const envScene = new THREE.Scene();
      const envGrad = document.createElement('canvas'); envGrad.width = 4; envGrad.height = 256;
      const egc = envGrad.getContext('2d');
      const eg = egc.createLinearGradient(0, 0, 0, 256);
      eg.addColorStop(0, '#cfe0f0');   // cer sus (rece)
      eg.addColorStop(0.5, '#eae6dc');  // orizont (neutru cald)
      eg.addColorStop(1, '#b8ad9c');    // sol (cald, reflectă în jos)
      egc.fillStyle = eg; egc.fillRect(0, 0, 4, 256);
      const envTex = new THREE.CanvasTexture(envGrad);
      envTex.mapping = THREE.EquirectangularReflectionMapping;
      envScene.background = envTex;
      const envRT = pmrem.fromScene(envScene, 0.04);
      scene.environment = envRT.texture;
      pmrem.dispose(); envTex.dispose();
    }

    const teren = new THREE.Mesh(new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({ map: texTeren(), roughness: 1 }));
    teren.rotation.x = -Math.PI / 2; teren.receiveShadow = true; scene.add(teren);
  // Plan de continuitate — culoare pamantie, ascuns de ceata
  const bigGround = new THREE.Mesh(new THREE.PlaneGeometry(140, 140),
    new THREE.MeshStandardMaterial({ color: 0x9d9588, roughness: 0.95 }));
  bigGround.rotation.x = -Math.PI / 2; bigGround.position.y = -0.02; bigGround.receiveShadow = true;
  scene.add(bigGround);
    const pv = texPavaj();
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(L + 3.2, W + 3.2),
      new THREE.MeshStandardMaterial({ map: pv.map, bumpMap: pv.bump, bumpScale: 0.04, roughness: 0.78, metalness: 0.03, color: 0xffffff }));
    apron.rotation.x = -Math.PI / 2; apron.position.y = 0.013; apron.receiveShadow = true; scene.add(apron);
    // Bordura decorativă perimetrală (piatră cubică)
    const bordTCanvas = document.createElement('canvas'); bordTCanvas.width = bordTCanvas.height = 512;
    const bctx2 = bordTCanvas.getContext('2d');
    const hb = (a, b) => { let h = a*374761393+b*668265263+1274126177; h=(h^(h>>13))*1274126177; return (h^(h>>16))/2147483648; };
    bctx2.fillStyle = '#7a7269'; bctx2.fillRect(0, 0, 512, 512);
    const btw = 40, bth = 24, bgap = 3;
    for (let row = 0; row < 512; row += bth + bgap) {
      const off = (Math.floor(row / (bth + bgap)) % 2) * ((btw + bgap) / 2);
      for (let col = -btw; col < 512; col += btw + bgap) {
        const x2 = col + off, y2 = row;
        const r = 150 + (hb(row, col) - 0.5) * 30;
        const g = 140 + (hb(row + 0.3, col) - 0.5) * 25;
        const b = 125 + (hb(row + 0.6, col) - 0.5) * 22;
        bctx2.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
        bctx2.fillRect(x2 + bgap, y2 + bgap, btw, bth);
        bctx2.fillStyle = 'rgba(255,255,255,0.07)'; bctx2.fillRect(x2 + bgap, y2 + bgap, btw, 2);
        bctx2.fillStyle = 'rgba(0,0,0,0.08)'; bctx2.fillRect(x2 + bgap, y2 + bgap + bth - 2, btw, 2);
      }
    }
    for (let i = 0; i < 3000; i++) {
      const v = 140 + hb(i, 0.2) * 25;
      bctx2.fillStyle = `rgba(${v|0},${v|0},${v|0},0.15)`;
      bctx2.fillRect(hb(0.4, i) * 512, hb(0.6, i) * 512, 2 + hb(0.8, i) * 4, 1.5);
    }
    const bordTex = new THREE.CanvasTexture(bordTCanvas);
    bordTex.wrapS = bordTex.wrapT = THREE.RepeatWrapping; bordTex.repeat.set(5, 5);
    bordTex.colorSpace = THREE.SRGBColorSpace; bordTex.anisotropy = 16;
    const bordT = new THREE.Mesh(new THREE.PlaneGeometry(L + 3.9, W + 3.9),
      new THREE.MeshStandardMaterial({ map: bordTex, roughness: 0.70, metalness: 0.02, transparent: true, opacity: 0.60 }));
    bordT.rotation.x = -Math.PI / 2; bordT.position.y = 0.009; bordT.receiveShadow = true; scene.add(bordT);
    const aleeLen = (W / 2 + 10) - (W / 2 + 1.6) + 0.3; // ~8.7m, până la poartă
    const aleeCtrZ = W / 2 + 1.6 + aleeLen / 2;
    const alee = new THREE.Mesh(new THREE.PlaneGeometry(1.3, aleeLen),
      new THREE.MeshStandardMaterial({ map: pv.map, bumpMap: pv.bump, bumpScale: 0.05, roughness: 0.72, metalness: 0.03, color: 0xffffff }));
    alee.rotation.x = -Math.PI / 2; alee.position.set(-L / 5, 0.014, aleeCtrZ); scene.add(alee);
    // Borduri alee
    const matBord = new THREE.MeshStandardMaterial({ color: 0x8a8076, roughness: 0.65 });
    [-0.65, 0.65].forEach(sx2 => {
      const bord = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, aleeLen + 0.1), matBord);
      bord.position.set(-L / 5 + sx2, 0.04, aleeCtrZ);
      bord.castShadow = true; bord.receiveShadow = true; scene.add(bord);
    });
    const uc = new THREE.Mesh(new THREE.PlaneGeometry(L + 3, W + 3),
      new THREE.MeshBasicMaterial({ map: umbraContact(), transparent: true, depthWrite: false }));
    uc.rotation.x = -Math.PI / 2; uc.position.y = 0.02; scene.add(uc);
    const copac = (px, pz, s = 1) => {
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * s, 0.13 * s, 1.1 * s, 7),
        new THREE.MeshStandardMaterial({ color: "#6b5744", roughness: 1 }));
      tr.position.set(px, 0.55 * s, pz); tr.castShadow = true; scene.add(tr);
      const co = new THREE.Mesh(new THREE.ConeGeometry(1.05 * s, 2.6 * s, 8),
        new THREE.MeshStandardMaterial({ color: "#5c6e52", roughness: 1 }));
      co.position.set(px, 1.1 * s + 1.3 * s, pz); co.castShadow = true; scene.add(co);
    };
// [gradina]     copac(-L / 2 - 4.5, -W / 2 - 2, 1.15);
    { const s2 = 0.9;
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * s2, 0.13 * s2, 1.2 * s2, 7),
        new THREE.MeshStandardMaterial({ color: "#6b5744", roughness: 1 }));
      tr.position.set(L / 2 + 5, 0.6 * s2, W / 2 + 1); tr.castShadow = true; scene.add(tr);
      const co = new THREE.Mesh(new THREE.SphereGeometry(1.15 * s2, 9, 7),
        new THREE.MeshStandardMaterial({ color: "#66754f", roughness: 1 }));
      co.scale.y = 0.85; co.position.set(L / 2 + 5, 1.2 * s2 + 0.95 * s2, W / 2 + 1); co.castShadow = true; scene.add(co); }

    // Tufe joase + flori la baza casei — o fac să pară locuită, nu o machetă
    // goală. Geometrie simplă (sfere turtite), plasate la colțuri și pe lângă
    // fațada din față. Ieftin, dar face scena caldă.
    const adaugaTufa = (px, pz, s = 1) => {
      const verde = ["#5a6e48", "#647a4e", "#556641"][Math.floor(hashP(px, pz) * 3)];
      const t = new THREE.Mesh(new THREE.SphereGeometry(0.45 * s, 8, 6),
        new THREE.MeshStandardMaterial({ color: verde, roughness: 1 }));
      t.scale.y = 0.7; t.position.set(px, 0.28 * s, pz); t.castShadow = true; t.receiveShadow = true;
      scene.add(t);
      // 2-3 flori mici colorate pe tufă
      const culoriFlori = ["#e8a0b0", "#f0d060", "#d88ac0", "#e8e0e0"];
      const nf = 2 + Math.floor(hashP(pz, px) * 2);
      for (let k = 0; k < nf; k++) {
        const fl = new THREE.Mesh(new THREE.SphereGeometry(0.06 * s, 5, 4),
          new THREE.MeshStandardMaterial({ color: culoriFlori[Math.floor(hashP(k, px) * 4)], roughness: 0.8 }));
        const ang = hashP(k, pz) * Math.PI * 2, rad2 = 0.3 * s;
        fl.position.set(px + Math.cos(ang) * rad2, 0.42 * s, pz + Math.sin(ang) * rad2);
        scene.add(fl);
      }
    };
    // Tufe la colțurile din față ale casei + una lângă intrare
    const zf = W / 2 + 0.7;
    adaugaTufa(-L / 2 + 0.6, zf, 1.1);
    adaugaTufa(L / 2 - 0.6, zf, 1.0);
    adaugaTufa(L / 2 - 2.2, zf, 0.8);
    adaugaTufa(-L / 2 + 1.8, zf, 0.85);

    const hemi = new THREE.HemisphereLight(0xfdf3e3, 0x8a9480, 0.75);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffe9cf, 2.1);
    key.position.set(L * 1.7, hz + hRoof + 6.5, W * 0.3); key.castShadow = true;
    key.shadow.mapSize.set(1536, 1536); key.shadow.radius = 4;
    const s = Math.max(L, W) * 1.5;
    key.shadow.camera.left = -s; key.shadow.camera.right = s;
    key.shadow.camera.top = s; key.shadow.camera.bottom = -4; key.shadow.bias = -0.00015; key.shadow.normalBias = 0.04;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xd9e4f2, 0.5); fill.position.set(-L, hz, -W); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xfff0dd, 0.5); rim.position.set(-L * 0.6, hz + hRoof + 6, -W); scene.add(rim);

    const zc = document.createElement("canvas"); zc.width = 64; zc.height = 256;
    const zx = zc.getContext("2d");
    zx.fillStyle = "#d3cabb"; zx.fillRect(0, 0, 64, 256);
    const zg = zx.createLinearGradient(0, 0, 0, 70);
    zg.addColorStop(0, "rgba(45,40,32,0.42)"); zg.addColorStop(1, "rgba(45,40,32,0)");
    zx.fillStyle = zg; zx.fillRect(0, 0, 64, 70);
    const ztx = srgb(new THREE.CanvasTexture(zc));

      // Tencuială decorativă vizibilă — granule mari, contrast, relief
  const tencCanvas = document.createElement('canvas'); tencCanvas.width = tencCanvas.height = 1024;
  const tctx = tencCanvas.getContext('2d');
  const hashP = (a, b) => { let h = a*374761393+b*668265263+1274126177; h=(h^(h>>13))*1274126177; return (h^(h>>16))/2147483648; };
  tctx.fillStyle = '#f2ede4'; tctx.fillRect(0, 0, 1024, 1024);
  // Granule fine (nisip fin) — vizibile dar delicate
  for (let i = 0; i < 20000; i++) {
    const g = 220 + hashP(i, 0.3) * 30;
    tctx.fillStyle = `rgba(${g|0},${(g-2)|0},${(g-6)|0},0.30)`;
    const s = 3 + hashP(i, 0.7) * 5;
    tctx.fillRect(hashP(0.1, i) * 1024, hashP(0.5, i) * 1024, s, s * 0.8);
  }
  // Pietricele fine
  for (let i = 0; i < 2500; i++) {
    const g = 185 + hashP(i, 1.1) * 30;
    tctx.fillStyle = `rgba(${g|0},${(g-4)|0},${(g-10)|0},0.22)`;
    const s = 4 + hashP(i, 1.7) * 8;
    tctx.fillRect(hashP(0.3, i) * 1024, hashP(0.7, i) * 1024, s, s * 0.7);
  }
  // Nori de culoare subtili
  for (let i = 0; i < 15; i++) {
    const px = hashP(i, 0.1) * 1024, py = hashP(i, 0.2) * 1024;
    const r = 50 + hashP(i, 0.3) * 150;
    const g = tctx.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, `rgba(${195+hashP(i,0.4)*20},${188+hashP(i,0.5)*15},${178+hashP(i,0.6)*14},0.08)`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    tctx.fillStyle = g; tctx.fillRect(px - r, py - r, r * 2, r * 2);
  }
  // Urme fine de glet
  for (let y = 0; y < 1024; y += 70 + hashP(y, 0.1) * 45) {
    const a = 0.02 + hashP(y, 0.2) * 0.03;
    tctx.fillStyle = `rgba(255,255,255,${a})`; tctx.fillRect(0, y, 1024, 3 + hashP(y, 0.3) * 7);
    tctx.fillStyle = `rgba(0,0,0,${a * 0.4})`; tctx.fillRect(0, y + 6, 1024, 1 + hashP(y, 0.4) * 3);
  }
  const tencTex = new THREE.CanvasTexture(tencCanvas);
  tencTex.wrapS = tencTex.wrapT = THREE.RepeatWrapping; tencTex.anisotropy = 16;
  tencTex.repeat.set(L * 0.35, hz * 0.60); tencTex.colorSpace = THREE.SRGBColorSpace;
  tencTex.minFilter = THREE.LinearMipmapLinearFilter; tencTex.magFilter = THREE.LinearFilter;
  tencTex.generateMipmaps = true;

  // Bump asortat — relief mediu
  const bumpCanvas = document.createElement('canvas'); bumpCanvas.width = bumpCanvas.height = 1024;
  const bctx = bumpCanvas.getContext('2d');
  bctx.fillStyle = '#808080'; bctx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 18000; i++) {
    const v = 128 + (hashP(i, 0.1) - 0.5) * 50;
    bctx.fillStyle = `rgb(${v|0},${v|0},${v|0})`;
    const s = 3 + hashP(i, 0.3) * 6;
    bctx.fillRect(hashP(0.2, i) * 1024, hashP(0.4, i) * 1024, s, s * 0.8);
  }
  for (let y = 0; y < 1024; y += 70 + hashP(y, 0.5) * 45) {
    bctx.fillStyle = '#b8b8b8'; bctx.fillRect(0, y, 1024, 3 + hashP(y, 0.6) * 6);
    bctx.fillStyle = '#505050'; bctx.fillRect(0, y + 6, 1024, 1 + hashP(y, 0.7) * 3);
  }
  const bumpTex = new THREE.CanvasTexture(bumpCanvas);
  bumpTex.wrapS = bumpTex.wrapT = THREE.RepeatWrapping; bumpTex.anisotropy = 16;
  bumpTex.repeat.set(L * 0.35, hz * 0.60); bumpTex.colorSpace = THREE.LinearSRGBColorSpace;
  bumpTex.minFilter = THREE.LinearMipmapLinearFilter; bumpTex.magFilter = THREE.LinearFilter;
  bumpTex.generateMipmaps = true;

  // Roughness map: tencuiala reală NU e mată uniform — unele zone reflectă
  // lumina puțin diferit. O hartă de rugozitate variabilă face lumina să
  // "joace" pe suprafață când rotești casa → sparge look-ul de vopsea plată.
  // Gri deschis = mai neted (reflectă mai mult), gri închis = mai aspru (mat).
  const roughCanvas = document.createElement('canvas'); roughCanvas.width = roughCanvas.height = 512;
  const rctx = roughCanvas.getContext('2d');
  rctx.fillStyle = '#d0d0d0'; rctx.fillRect(0, 0, 512, 512); // rugozitate medie de bază
  // Pete LARGI de variație (scara mare, se văd pe zid), difuze
  for (let i = 0; i < 26; i++) {
    const px = hashP(i, 0.11) * 512, py = hashP(i, 0.22) * 512;
    const r = 40 + hashP(i, 0.33) * 130;
    const v = 175 + (hashP(i, 0.44) - 0.5) * 90; // ±45 în jurul mediei
    const g = rctx.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, `rgba(${v|0},${v|0},${v|0},0.5)`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    rctx.fillStyle = g; rctx.fillRect(px - r, py - r, r * 2, r * 2);
  }
  // Textură fină deasupra (micro-variație)
  for (let i = 0; i < 3000; i++) {
    const v = 200 + (hashP(i, 0.7) - 0.5) * 70;
    rctx.fillStyle = `rgba(${v|0},${v|0},${v|0},0.15)`;
    const s = 3 + hashP(i, 0.9) * 7;
    rctx.fillRect(hashP(0.2, i) * 512, hashP(0.5, i) * 512, s, s);
  }
  const roughTex = new THREE.CanvasTexture(roughCanvas);
  roughTex.wrapS = roughTex.wrapT = THREE.RepeatWrapping; roughTex.anisotropy = 8;
  roughTex.repeat.set(L * 0.18, hz * 0.30); // scară mai mare = pete mai vizibile
  roughTex.colorSpace = THREE.LinearSRGBColorSpace;

  const matZid = new THREE.MeshStandardMaterial({
    // Culoare ușor caldă (nu aproape-alb) ca TEXTURA să conducă, nu culoarea
    // plată. Înainte #f4f1ea aproape-alb "spăla" textura → look de Paint.
    color: culoareFatada || '#e9e4d9', map: tencTex, roughness: 0.92,
    bumpMap: bumpTex, bumpScale: 0.11,        // relief mai citit (era 0.07)
    roughnessMap: roughTex,                    // rugozitate variabilă → lumina joacă
    envMapIntensity: 0.4,                      // reflexie subtilă a mediului (viață)
  });
      const casa = new THREE.Mesh(new THREE.BoxGeometry(L, hz, W), matZid);
    casa.position.y = hz / 2; casa.castShadow = true; casa.receiveShadow = true; scene.add(casa);
  // --- Tâmplărie (ferestre + ușă) ---
  const matToc = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.3, metalness: 0.75 });
  const matGeam = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0.08, envMapIntensity: 1.6, transparent: true, opacity: 0.80, depthWrite: false });

  // Ciclul zi→apus: soare, cer, ceață, ferestre aprinse — un singur parametru.
  const zi = creeazaZi({ scene, renderer: rnd, key, fill, rim, hemi, matGeam, L, W, hz, hRoof });
  zi.seteazaOra(ora);
  ziRef.current = zi;
  zidRef.current = matZid;

  // Helper: creează o fereastră cu pervaz și obloane
  function adaugaFereastra(cx, cy, cz, rotY, w = 0.9, h = 1.1) {
    const grup = new THREE.Group();
    grup.position.set(cx, cy, cz);
    grup.rotation.y = rotY;
    // Toc
    const toc = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), matToc);
    toc.castShadow = true; grup.add(toc);
    // Geam
    const geam = new THREE.Mesh(new THREE.BoxGeometry(w - 0.18, h - 0.18, 0.02), matGeam);
    geam.position.z = 0.04; geam.renderOrder = 1; grup.add(geam);
    // Pervaz
    const pervaz = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.06, 0.10), matToc);
    pervaz.position.set(0, -h/2 - 0.04, 0.04); pervaz.castShadow = true; grup.add(pervaz);
    // Mulioane (traverse interioare)
    const mulionV = new THREE.Mesh(new THREE.BoxGeometry(0.04, h - 0.22, 0.04), matToc);
    mulionV.position.z = 0.04; grup.add(mulionV);
    const mulionH = new THREE.Mesh(new THREE.BoxGeometry(w - 0.22, 0.04, 0.04), matToc);
    mulionH.position.set(0, h * 0.12, 0.04); grup.add(mulionH);

    // Obloane (jaluzele) — textură procedurală cu fante orizontale
    const jCanvas = document.createElement("canvas"); jCanvas.width = 64; jCanvas.height = 512;
    const jx = jCanvas.getContext("2d");
    jx.fillStyle = "#27201a"; jx.fillRect(0, 0, 64, 512);
    for (let sy = 0; sy < 512; sy += 7) {
      jx.fillStyle = "#383028"; jx.fillRect(0, sy, 64, 2.5);
      jx.fillStyle = "#1a1510"; jx.fillRect(0, sy + 3, 64, 1.5);
    }
    const jTex = new THREE.CanvasTexture(jCanvas); jTex.wrapS = jTex.wrapT = THREE.RepeatWrapping;
    jTex.colorSpace = THREE.SRGBColorSpace;
    const matOblon = new THREE.MeshStandardMaterial({ map: jTex, roughness: 0.75, color: 0xffffff });

    const sw = 0.32, sd = 0.05;
    [-1, 1].forEach(s => {
      const oblon = new THREE.Mesh(new THREE.BoxGeometry(sw, h + 0.08, sd), matOblon);
      oblon.position.set(s * (w/2 + sw/2 + 0.04), 0, 0.01);
      oblon.castShadow = true; grup.add(oblon);
    });
    scene.add(grup);
  }

  // Fațadă (cu ușa — un singur geam)
  adaugaFereastra(L * 0.35, hz * 0.58, W / 2 + 0.03, 0);
  // Spate — 2 geamuri
  adaugaFereastra(L * 0.30, hz * 0.58, -W / 2 - 0.03, Math.PI);
  adaugaFereastra(-L * 0.30, hz * 0.58, -W / 2 - 0.03, Math.PI);
  // Lateral dreapta — 2 geamuri
  adaugaFereastra(L / 2 + 0.03, hz * 0.58, -W * 0.35, Math.PI / 2);
  adaugaFereastra(L / 2 + 0.03, hz * 0.58, W * 0.25, Math.PI / 2);
  // Lateral stânga — 2 geamuri
  adaugaFereastra(-L / 2 - 0.03, hz * 0.58, W * 0.35, -Math.PI / 2);
  adaugaFereastra(-L / 2 - 0.03, hz * 0.58, -W * 0.25, -Math.PI / 2);

  // --- Ușă intrare (aliniată cu aleea) ---
  const doorX = -L / 5, doorZ = W / 2 + 0.02, doorW = 0.92, doorH = 2.15;
  const doorGroup = new THREE.Group();
  doorGroup.position.set(doorX, doorH / 2, doorZ);
  // Toc ușă
  const tocUsa = new THREE.Mesh(new THREE.BoxGeometry(doorW + 0.12, doorH + 0.12, 0.08), matToc);
  tocUsa.castShadow = true; doorGroup.add(tocUsa);
  // Panou inferior (metalic plin)
  const panouJos = new THREE.Mesh(new THREE.BoxGeometry(doorW - 0.06, doorH * 0.42, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x2c2c2c, roughness: 0.25, metalness: 0.85 }));
  panouJos.position.set(0, -doorH * 0.22, 0.02); panouJos.castShadow = true; doorGroup.add(panouJos);
  // Panou superior (geam)
  const panouSus = new THREE.Mesh(new THREE.BoxGeometry(doorW - 0.06, doorH * 0.38, 0.02), matGeam);
  panouSus.position.set(0, doorH * 0.18, 0.045); panouSus.renderOrder = 1; doorGroup.add(panouSus);
  // Mâner
  const maner = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 8),
    new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.2, metalness: 0.95 }));
  maner.position.set(doorW/2 - 0.05, 0.04, 0.04);
  maner.rotation.z = Math.PI / 2; doorGroup.add(maner);
  // Copertină deasupra ușii
  const copertina = new THREE.Mesh(new THREE.BoxGeometry(doorW + 0.30, 0.03, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.3, metalness: 0.8 }));
  copertina.position.set(0, doorH/2 + 0.12, -0.05); copertina.castShadow = true; doorGroup.add(copertina);
  scene.add(doorGroup);

  // --- Soclu piatră (travertin / calcar) ---
  const sCanvas = document.createElement("canvas"); sCanvas.width = sCanvas.height = 512;
  const sx = sCanvas.getContext("2d");
  // Bază caldă
  sx.fillStyle = "#c4b8a8"; sx.fillRect(0, 0, 512, 512);
  // Blocuri de piatră
  const sbw = 96, sbh = 48, sgap = 4;
  for (let row = 0; row < 512; row += sbh + sgap) {
    const off = (Math.floor(row / (sbh + sgap)) % 2) * ((sbw + sgap) / 2);
    for (let col = -sbw; col < 512; col += sbw + sgap) {
      const bx2 = col + off, by2 = row;
      const r = 185 + (Math.random() - 0.5) * 20;
      const g = 170 + (Math.random() - 0.5) * 18;
      const b = 150 + (Math.random() - 0.5) * 16;
      sx.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
      sx.fillRect(bx2 + sgap, by2 + sgap, sbw, sbh);
      // Variație subtilă per bloc
      sx.fillStyle = "rgba(255,255,255,0.06)"; sx.fillRect(bx2 + sgap, by2 + sgap, sbw, sbh/2);
      sx.fillStyle = "rgba(0,0,0,0.04)"; sx.fillRect(bx2 + sgap, by2 + sgap + sbh/2, sbw, sbh/2);
    }
  }
  // Granulație fină
  for (let i = 0; i < 4000; i++) {
    const v = 170 + Math.random() * 30;
    sx.fillStyle = `rgba(${v},${v-5},${v-15},0.2)`;
    sx.fillRect(Math.random() * 512, Math.random() * 512, 1.5, 1.5);
  }
  const sTex = new THREE.CanvasTexture(sCanvas); sTex.wrapS = sTex.wrapT = THREE.RepeatWrapping;
  sTex.repeat.set((L + 0.18) / 1.8, 1.1); sTex.colorSpace = THREE.SRGBColorSpace; sTex.anisotropy = 8;
  // Bump soclu
  const sbCanvas = document.createElement("canvas"); sbCanvas.width = sbCanvas.height = 512;
  const sbx = sbCanvas.getContext("2d");
  sbx.fillStyle = "#707070"; sbx.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 512; row += sbh + sgap) {
    const off = (Math.floor(row / (sbh + sgap)) % 2) * ((sbw + sgap) / 2);
    for (let col = -sbw; col < 512; col += sbw + sgap) {
      sbx.fillStyle = "#d0d0d0"; sbx.fillRect(col + off + sgap, row + sgap, sbw, sbh);
      sbx.fillStyle = "#e8e8e8"; sbx.fillRect(col + off + sgap, row + sgap, sbw, 3);
    }
  }
  const sbTex = new THREE.CanvasTexture(sbCanvas); sbTex.wrapS = sbTex.wrapT = THREE.RepeatWrapping;
  sbTex.repeat.set((L + 0.18) / 1.8, 1.1);

  const soclu = new THREE.Mesh(new THREE.BoxGeometry(L + 0.18, 0.40, W + 0.18),
    new THREE.MeshStandardMaterial({ map: sTex, bumpMap: sbTex, bumpScale: 0.04, roughness: 0.78, color: 0xffffff }));
  soclu.position.y = 0.175; soclu.receiveShadow = true; scene.add(soclu);

    const M = C.materialeMp[material] || Object.values(C.materialeMp)[0];
    const tipMat = M.tex || "tabla";
    const TX = texInvelitoare(M.hex, tipMat);

  // --- Normal map: derivat din aceeași geometrie ca textura ---
  const nmS = 512;
  const normalCanvas = document.createElement('canvas'); normalCanvas.width = normalCanvas.height = nmS;
  const nctx = normalCanvas.getContext('2d');
  const nimg = nctx.getImageData(0, 0, nmS, nmS);
  const hashN = (a, b) => { let h = a*374761393+b*668265263+1274126177; h=(h^(h>>13))*1274126177; return (h^(h>>16))/2147483648; };

  if (tipMat === "tabla") {
    // Standing seam normals: raised ridges with flat panels
    const seamSp = 48 * (nmS / 1024);
    for (let y = 0; y < nmS; y++) {
      for (let x = 0; x < nmS; x++) {
        const i = (y * nmS + x) * 4;
        const pos = x % seamSp;
        const seamW = 7 * (nmS / 1024);
        let nx = 128, ny = 128, nz = 255;
        if (pos < 1) nx = 80;  // left edge of ridge, tilts left
        else if (pos < seamW) nx = 176; // ridge top, tilts right
        else if (pos > seamSp - 1) nx = 80;
        // Horizontal overlap wave
        const hoY = y % (120 * nmS / 1024);
        if (hoY < 2) ny = 144;
        else if (hoY < 4) ny = 112;
        // Micro grain
        const gn = (hashN(x * 3, y * 3) - 0.5) * 20;
        nx += gn; ny += gn;
        nimg.data[i] = Math.max(0, Math.min(255, nx));
        nimg.data[i+1] = Math.max(0, Math.min(255, ny));
        nimg.data[i+2] = nz;
        nimg.data[i+3] = 255;
      }
    }
  } else {
    // Ceramic tile normals: curved tile surface
    const tileH = 46 * (nmS / 1024), tileW = 78 * (nmS / 1024), gap = 4 * (nmS / 1024);
    const rows = Math.ceil(nmS / (tileH + gap)) + 1;
    for (let y = 0; y < nmS; y++) {
      for (let x = 0; x < nmS; x++) {
        const i = (y * nmS + x) * 4;
        let nx = 128, ny = 128, nz = 255;
        // Determine which tile this pixel belongs to
        const row = Math.floor(y / (tileH + gap));
        const rowY = y % (tileH + gap);
        const off = (row % 2) * (tileW / 2 + gap / 2);
        const col = Math.floor((x - off) / (tileW + gap));
        const colX = ((x - off) % (tileW + gap) + tileW + gap) % (tileW + gap);
        const inGapX = colX < gap || colX > tileW;
        const inGapY = rowY < gap || rowY > tileH;
        if (inGapX || inGapY) {
          // Mortar gap: recessed, dark
          ny = 112; // tilts away
        } else {
          const tx = colX - gap, ty = rowY - gap;
          // Top curve: normals tilt upward
          const curveTop = Math.min(1, ty / 18);
          ny = Math.round(128 + curveTop * 48); // tilt forward at top
          // Bottom curve: normals tilt downward
          const curveBot = Math.max(0, 1 - (tileH - gap * 2 - ty) / 10);
          ny = Math.round(ny - curveBot * 36);
          // Left/right edges tilt out
          if (tx < 5) nx = Math.round(128 - 20);
          else if (tx > tileW - gap * 2 - 5) nx = Math.round(128 + 20);
          // Surface grain
          nx += Math.round((hashN(x, y) - 0.5) * 18);
          ny += Math.round((hashN(x + 0.5, y + 0.5) - 0.5) * 14);
        }
        nimg.data[i] = Math.max(0, Math.min(255, nx));
        nimg.data[i+1] = Math.max(0, Math.min(255, ny));
        nimg.data[i+2] = nz;
        nimg.data[i+3] = 255;
      }
    }
  }
  nctx.putImageData(nimg, 0, 0);
  const normalTex = new THREE.CanvasTexture(normalCanvas);
  normalTex.wrapS = normalTex.wrapT = THREE.RepeatWrapping;
  normalTex.colorSpace = THREE.LinearSRGBColorSpace;
  normalTex.minFilter = THREE.LinearMipmapLinearFilter;
  normalTex.magFilter = THREE.LinearFilter;
  normalTex.generateMipmaps = true;

  // --- Material îmbunătățit ---
  const matInv = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, map: TX.map, bumpMap: TX.bump,
      bumpScale: tipMat === "tigla" ? 0.06 : 0.03,
      roughness: tipMat === "tigla" ? 0.75 : 0.30,
      metalness: tipMat === "tigla" ? 0.0 : 0.55,
      side: THREE.DoubleSide,
      normalMap: normalTex,
      normalScale: new THREE.Vector2(tipMat === "tigla" ? 1.0 : 0.6, tipMat === "tigla" ? 1.0 : 0.6),
      clearcoat: tipMat === "tabla" ? 0.25 : 0.0,
      clearcoatRoughness: 0.2,
      envMapIntensity: tipMat === "tabla" ? 0.6 : 0.3,
      specularIntensity: tipMat === "tabla" ? 0.4 : 0.15,
    });
    const matSub = new THREE.MeshStandardMaterial({ color: "#e8e0d5", roughness: 0.85, side: THREE.DoubleSide });
    const y0 = hz, x0 = L / 2 + ov, z0 = W / 2 + ov, yv = y0 + hRoof + (ov * Math.tan(rad(panta)));
    const tris = [], triF = [];
    const A = [-x0, y0, z0], B = [x0, y0, z0], Cc = [x0, y0, -z0], D = [-x0, y0, -z0];
    let yCoama = yv;

    if (tip === "doua_ape") {
      const R1 = [-x0, yv, 0], R2 = [x0, yv, 0];
      tris.push([A, B, R2], [A, R2, R1], [Cc, D, R1], [Cc, R1, R2]);
      const fx = L / 2;
      triF.push([[-fx, y0, W / 2], [-fx, y0, -W / 2], [-fx, yv, 0]]);
      triF.push([[fx, y0, -W / 2], [fx, y0, W / 2], [fx, yv, 0]]);
    } else if (tip === "patru_ape") {
      const c = Math.max((L - W) / 2, 0);
      const R1 = [-c, yv, 0], R2 = [c, yv, 0];
      tris.push([A, B, R2], [A, R2, R1], [Cc, D, R1], [Cc, R1, R2], [D, A, R1], [B, Cc, R2]);
    } else {
      const pJos = Math.min(panta + 25, 72), zB = W * 0.18 + ov * 0.3;
      const yB = y0 + (W / 2 - W * 0.18) * Math.tan(rad(pJos));
      const yT = yB + (W * 0.18) * Math.tan(rad(Math.max(panta - 10, 12)));
      yCoama = yT;
      const M1 = [-x0, yB, zB], M2 = [x0, yB, zB], M3 = [x0, yB, -zB], M4 = [-x0, yB, -zB];
      const R1 = [-x0, yT, 0], R2 = [x0, yT, 0];
      tris.push([A, B, M2], [A, M2, M1], [M1, M2, R2], [M1, R2, R1]);
      tris.push([Cc, D, M4], [Cc, M4, M3], [M3, M4, R1], [M3, R1, R2]);
      const fx = L / 2;
      triF.push([[-fx, y0, W / 2], [-fx, y0, -W / 2], [-fx, yT, 0]]);
      triF.push([[fx, y0, -W / 2], [fx, y0, W / 2], [fx, yT, 0]]);
    }
    const inv = meshTri(tris, matInv); scene.add(inv);
    const sub = meshTri(tris, matSub); sub.position.y = -0.05; sub.castShadow = false; scene.add(sub);
    // Frontonul (peretele triunghiular de sub coamă, la capete): e inclus în
    // triF, construit din geometria acoperișului → se potrivește EXACT cu panta.
    // DoubleSide garantează că se vede indiferent de ordinea vârfurilor (înainte
    // apărea gol când normala ieșea spre interior). Material dedicat, tencuit.
    if (triF.length) {
      const matFronton = new THREE.MeshStandardMaterial({
        color: "#efe9df", map: tencTex, roughness: 0.88, side: THREE.DoubleSide,
        bumpMap: bumpTex, bumpScale: 0.06,
      });
      const fronton = meshTri(triF, matFronton);
      fronton.castShadow = true; fronton.receiveShadow = true;
      scene.add(fronton);
    }

    const matPazie = new THREE.MeshStandardMaterial({ color: "#e8e0d5", roughness: 0.75 });
    const matPazieFront = new THREE.MeshStandardMaterial({ color: "#d5cdc0", roughness: 0.72 });
    const rake = (p1, p2) => {
      const a = new THREE.Vector3(...p1), b = new THREE.Vector3(...p2);
      const dir = b.clone().sub(a), len = dir.length();
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, len), matPazie);
      m.position.copy(a.clone().add(b).multiplyScalar(0.5));
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.normalize());
      m.castShadow = true; scene.add(m);
    };

  // --- Coamă îmbunătățită ---
  const matCoama = new THREE.MeshStandardMaterial({ color: shade(M.hex, tipMat === "tigla" ? 0.55 : 0.68), roughness: tipMat === "tigla" ? 0.7 : 0.4, metalness: tipMat === "tabla" ? 0.35 : 0.05 });
  // Ridged cap: wider, with a flat base and rounded top
  const coamaGroup = new THREE.Group();
  // Base flange
  const coamaBaza = new THREE.Mesh(new THREE.BoxGeometry(L + 0.3, 0.04, 0.32), matCoama);
  coamaBaza.position.y = yv + 0.02; coamaBaza.castShadow = true;
  coamaGroup.add(coamaBaza);
  // Main ridge body (rounded top simulated with stacked boxes)
  const coamaCorp = new THREE.Mesh(new THREE.BoxGeometry(L + 0.16, 0.10, 0.22), matCoama);
  coamaCorp.position.y = yv + 0.09; coamaCorp.castShadow = true;
  coamaGroup.add(coamaCorp);
  const coamaTop = new THREE.Mesh(new THREE.BoxGeometry(L + 0.08, 0.05, 0.12), matCoama);
  coamaTop.position.y = yv + 0.16; coamaTop.castShadow = true;
  coamaGroup.add(coamaTop);
  // Ridge cap top highlight
  const matCoamaHL = new THREE.MeshStandardMaterial({ color: shade(M.hex, 0.82), roughness: 0.35, metalness: tipMat === "tabla" ? 0.4 : 0.08 });
  const coamaHL = new THREE.Mesh(new THREE.BoxGeometry(L + 0.02, 0.02, 0.07), matCoamaHL);
  coamaHL.position.y = yv + 0.20; coamaGroup.add(coamaHL);
  scene.add(coamaGroup);

  // Jgheaburi + burlane (îmbunătățite)
  const matJgheab = new THREE.MeshStandardMaterial({ color: 0x3d4045, roughness: 0.3, metalness: 0.92 });
  [-1, 1].forEach(s => {
    // Main gutter channel (wider, more realistic)
    const jg = new THREE.Mesh(new THREE.BoxGeometry(L + 0.5, 0.09, 0.20), matJgheab);
    jg.position.set(0, y0 - 0.09, z0 * s);
    jg.castShadow = true; scene.add(jg);
    // Inner lip
    const jgLip = new THREE.Mesh(new THREE.BoxGeometry(L + 0.4, 0.02, 0.06), matJgheab);
    jgLip.position.set(0, y0 - 0.04, (z0 - 0.05) * s);
    jgLip.castShadow = true; scene.add(jgLip);
    // Gutter brackets (every ~2m)
    for (let bx = -L/2; bx <= L/2; bx += 2.2) {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.06), matJgheab);
      bracket.position.set(bx, y0 - 0.12, (z0 + 0.07) * s);
      bracket.castShadow = true; scene.add(bracket);
    }
  });
  [-1, 1].forEach(sx => {
    const bl = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, hz + 0.1, 10), matJgheab);
    bl.position.set(L/2 * sx + 0.3 * sx, hz/2, z0 + 0.18);
    bl.castShadow = true; scene.add(bl);
    // Downspout elbow at top
    const elbow = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.04, 6, 8, Math.PI/2),
      matJgheab);
    elbow.position.set(L/2 * sx + 0.3 * sx, hz + 0.02, z0 + 0.14);
    elbow.rotation.set(0, sx < 0 ? Math.PI : 0, Math.PI/2);
    elbow.castShadow = true; scene.add(elbow);
  });

  // --- Streașină + fațadă îmbunătățite ---
  const matStreasina = new THREE.MeshStandardMaterial({ color: shade(M.hex, 0.78), roughness: 0.55, metalness: 0.12 });
  [-1, 1].forEach(s => {
    // Eave trim board
    const str = new THREE.Mesh(new THREE.BoxGeometry(L + 0.35, 0.06, 0.14), matStreasina);
    str.position.set(0, y0 - 0.03, z0 * s);
    str.castShadow = true; scene.add(str);
    // Drip edge (metal strip under eave)
    const drip = new THREE.Mesh(new THREE.BoxGeometry(L + 0.30, 0.015, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.3, metalness: 0.9 }));
    drip.position.set(0, y0 - 0.07, (z0 - 0.02) * s);
    drip.castShadow = true; scene.add(drip);
  });
    const matJ = new THREE.MeshStandardMaterial({ color: "#6a7078", metalness: 0.65, roughness: 0.3 });
    const bordura = (w, x, z, rotY = 0) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(w, 0.24, 0.08), matPazieFront);
      p.position.set(x, y0 - 0.02, z); p.rotation.y = rotY; p.castShadow = true; scene.add(p);
      const j = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, 0.16), matJ);
      j.position.set(x, y0 - 0.18, z); j.rotation.y = rotY; scene.add(j);
      // Shadow line (upper trim)
      const sl = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, 0.10), new THREE.MeshStandardMaterial({ color: "#3a3832", roughness: 0.5 }));
      sl.position.set(x, y0 + 0.10, z); sl.rotation.y = rotY; sl.castShadow = true; scene.add(sl);
    };
    bordura(L + 2.2 * ov, 0, z0 + 0.05); bordura(L + 2.2 * ov, 0, -z0 - 0.05);
    if (tip === "patru_ape") {
      bordura(W + 2.2 * ov, x0 + 0.05, 0, Math.PI / 2); bordura(W + 2.2 * ov, -x0 - 0.05, 0, Math.PI / 2);
      const cH = Math.max((L - W) / 2, 0);
      const matHip = new THREE.MeshStandardMaterial({ color: shade(M.hex, 0.62), roughness: 0.6 });
      const hip = (p1, p2) => {
        const a = new THREE.Vector3(...p1), b = new THREE.Vector3(...p2);
        const dir = b.clone().sub(a), len = dir.length();
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, len), matHip);
        m.position.copy(a.clone().add(b).multiplyScalar(0.5)).y += 0.03;
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.normalize());
        m.castShadow = true; scene.add(m);
      };
      hip([-x0, y0, z0], [-cH, yv, 0]); hip([-x0, y0, -z0], [-cH, yv, 0]);
      hip([x0, y0, z0], [cH, yv, 0]);   hip([x0, y0, -z0], [cH, yv, 0]);
    }
    else if (tip === "doua_ape") {
      for (const sx of [x0, -x0]) { rake([sx, y0, z0], [sx, yv, 0]); rake([sx, y0, -z0], [sx, yv, 0]); }
    } else {
      const pJos2 = Math.min(panta + 25, 72), zB2 = W * 0.18 + ov * 0.3;
      const yB2 = y0 + (W / 2 - W * 0.18) * Math.tan(rad(pJos2));
      for (const sx of [x0, -x0]) {
        rake([sx, y0, z0], [sx, yB2, zB2]); rake([sx, yB2, zB2], [sx, yCoama, 0]);
        rake([sx, y0, -z0], [sx, yB2, -zB2]); rake([sx, yB2, -zB2], [sx, yCoama, 0]);
      }
    }

    const qCoamaL = tip === "patru_ape" ? Math.max(L - W, 0) : L + 2 * ov;
    if (qCoamaL > 0.05) {
      const matCoama2 = new THREE.MeshStandardMaterial({ color: shade(M.hex, 0.58), roughness: 0.6, metalness: tipMat === "tabla" ? 0.3 : 0.05 });
      const coBase = new THREE.Mesh(new THREE.BoxGeometry(qCoamaL, 0.05, 0.34), matCoama2);
      coBase.position.set(0, yCoama + 0.03, 0); coBase.castShadow = true; scene.add(coBase);
      const coMain = new THREE.Mesh(new THREE.BoxGeometry(qCoamaL - 0.1, 0.10, 0.24), matCoama2);
      coMain.position.set(0, yCoama + 0.10, 0); coMain.castShadow = true; scene.add(coMain);
      const coRound = new THREE.Mesh(new THREE.BoxGeometry(qCoamaL - 0.16, 0.05, 0.13), matCoama2);
      coRound.position.set(0, yCoama + 0.17, 0); coRound.castShadow = true; scene.add(coRound);
    }




    const target = new THREE.Vector3(0, (hz + hRoof) / 2 + 0.6, 0);
    const rRest = Math.max(L, W) * 1.8 + 8;
    let th = 0.7, ph = 1.15, r = rRest, drag = false, px = 0, py = 0, vth = 0, vph = 0, intro = 0;
    const upd = () => { cam.position.set(target.x + r * Math.sin(ph) * Math.sin(th), target.y + r * Math.cos(ph), target.z + r * Math.sin(ph) * Math.cos(th)); cam.lookAt(target); };
    const dom = rnd.domElement;
    const down = (x, y) => { drag = true; px = x; py = y; vth = 0; vph = 0; };
    const move = (x, y) => { if (!drag) return; const dx = (x - px) * 0.008, dy = (y - py) * 0.008; th -= dx; ph -= dy; vth = -dx; vph = -dy; ph = Math.max(0.5, Math.min(1.5, ph)); px = x; py = y; };
    const up = () => drag = false;
    dom.addEventListener("mousedown", e => down(e.clientX, e.clientY));
    window.addEventListener("mousemove", e => move(e.clientX, e.clientY));
    window.addEventListener("mouseup", up);
    dom.addEventListener("touchstart", e => { const q = e.touches[0]; down(q.clientX, q.clientY); }, { passive: true });
    dom.addEventListener("touchmove", e => { const q = e.touches[0]; move(q.clientX, q.clientY); }, { passive: true });
    dom.addEventListener("touchend", up);
    dom.addEventListener("wheel", e => { e.preventDefault(); r = Math.max(6, Math.min(rRest * 2.2, r + e.deltaY * 0.02)); }, { passive: false });

    let raf;
    // Pixel ratio adaptiv: pe ecrane dense (ratio 2 = 4x pixeli), coborâm la
    // 1.5 în timpul drag-ului (~44% mai puțini pixeli) și revenim la repaus.
    // Diferența nu se vede în mișcare; fluiditatea da.
    const prMax = Math.min(window.devicePixelRatio, 2);
    const prDrag = Math.min(prMax, 1.5);
    let prCurent = prMax;
    const loop = () => {
      if (intro < 1) { intro = Math.min(1, intro + 0.02); const e = 1 - Math.pow(1 - intro, 3); r = rRest + (1 - e) * rRest * 0.5; th = 0.7 + (1 - e) * 0.5; }
      if (!drag) { th += vth; ph = Math.max(0.5, Math.min(1.5, ph + vph)); vth *= 0.92; vph *= 0.92; if (Math.abs(vth) < 0.0004 && intro >= 1) th += 0.0011; }
      const prVrut = drag ? prDrag : prMax;
      if (prVrut !== prCurent) { prCurent = prVrut; rnd.setPixelRatio(prCurent); }
      tickVant();
      upd(); rnd.render(scene, cam); raf = requestAnimationFrame(loop);
    };
    loop();
    const onR = () => { const w = el.clientWidth, h = el.clientHeight; cam.aspect = w / h; cam.updateProjectionMatrix(); rnd.setSize(w, h); };
    window.addEventListener("resize", onR);
    adaugaGradina(scene, rnd, L, W);

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onR); window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); rnd.dispose(); el.removeChild(rnd.domElement); };
  }, [cfg]);

  // Ora zilei se schimbă FĂRĂ reconstrucția scenei — slider fluid.
  useEffect(() => {
    if (ziRef.current) ziRef.current.seteazaOra(ora);
  }, [ora]);

  // Culoarea fațadei se schimbă instant — doar materialul, nu toată scena.
  useEffect(() => {
    if (zidRef.current && culoareFatada) {
      zidRef.current.color.set(culoareFatada);
    }
  }, [culoareFatada]);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mount} style={{ width: "100%", height: "100%", touchAction: "none", cursor: "grab" }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 62%, rgba(20,25,20,0.13) 100%)" }} />
    </div>
  );
}
