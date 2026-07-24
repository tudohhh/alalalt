// BACKUP 20.07.2026 — src/Scena3D.jsx FINAL (configurator acoperis v1)
// Include: texturi procedurale+bump, sRGB, UV pe linia pantei, ocluzie
// streasina, pazii+hip ridges, horn, lumina laterala ierarhizata, vigneta.
// Structura proiect: vezi acoperis-REPRODUCERE.txt
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { adaugaGradina } from "./gradina";
import { CONFIG_ACOPERIS as C } from "../config/CONFIG";





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
  const S = 1024; // rezoluție dublă
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const x = c.getContext("2d");
  
  // Fundal cu gradient fin și zgomot
  const img = x.getImageData(0, 0, S, S);
  const data = img.data;
  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      const i = (py * S + px) * 4;
      const noise = (Math.random() - 0.5) * 8;
      const baseR = parseInt(hex.slice(1,3), 16) + noise;
      const baseG = parseInt(hex.slice(3,5), 16) + noise;
      const baseB = parseInt(hex.slice(5,7), 16) + noise;
      data[i] = Math.max(0, Math.min(255, baseR));
      data[i+1] = Math.max(0, Math.min(255, baseG));
      data[i+2] = Math.max(0, Math.min(255, baseB));
      data[i+3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  
  // Desenează dungi și detalii
  if (tip === "tabla") {
    const stripeWidth = 24; // mai înguste pentru aspect mai fin
    for (let px = 0; px < S; px += stripeWidth) {
      const offset = (Math.random() - 0.5) * 2;
      const x1 = px + offset;
      // Umbră sub dungă
      x.fillStyle = "rgba(0,0,0,0.25)";
      x.fillRect(x1, 0, 2, S);
      // Linie luminoasă pe dungă
      x.fillStyle = "rgba(255,255,255,0.10)";
      x.fillRect(x1 + 3, 0, 1, S);
      // Linie de metalic
      x.fillStyle = "rgba(200,200,200,0.08)";
      x.fillRect(x1 + 8, 0, 4, S);
      // Micro-zgârieturi
      for (let i = 0; i < 3; i++) {
        const y = Math.random() * S;
        x.fillStyle = "rgba(255,255,255,0.03)";
        x.fillRect(x1 + 2 + Math.random() * 6, y, 1 + Math.random() * 2, 1);
      }
    }
    // Zgârieturi fine random
    for (let i = 0; i < 200; i++) {
      const x0 = Math.random() * S;
      const y0 = Math.random() * S;
      const len = 2 + Math.random() * 6;
      x.strokeStyle = "rgba(0,0,0,0.05)";
      x.lineWidth = 0.5;
      x.beginPath();
      x.moveTo(x0, y0);
      x.lineTo(x0 + len, y0 + Math.random() * 2 - 1);
      x.stroke();
    }
  } else {
    // Țiglă – desenează un model de țiglă ceramică mai detaliat
    const tileH = 32;
    const tileW = 48;
    for (let row = 0; row < S / tileH; row++) {
      const y = row * tileH;
      const offsetX = (row % 2) * (tileW / 2);
      for (let col = -1; col < S / tileW + 1; col++) {
        const x = col * tileW + offsetX;
        const shade = 0.85 + Math.random() * 0.3;
        const r = Math.min(255, parseInt(hex.slice(1,3), 16) * shade);
        const g = Math.min(255, parseInt(hex.slice(3,5), 16) * shade);
        const b = Math.min(255, parseInt(hex.slice(5,7), 16) * shade);
        x.fillStyle = `rgb(${r|0}, ${g|0}, ${b|0})`;
        x.beginPath();
        x.moveTo(x + 2, y + 2);
        x.lineTo(x + tileW - 4, y + 4);
        x.lineTo(x + tileW - 6, y + tileH - 4);
        x.lineTo(x + 4, y + tileH - 2);
        x.closePath();
        x.fill();
        // Umbrire ușoară sub țiglă
        x.fillStyle = "rgba(0,0,0,0.12)";
        x.fillRect(x + 2, y + tileH - 6, tileW - 6, 4);
        // Margine luminoasă
        x.fillStyle = "rgba(255,255,255,0.06)";
        x.fillRect(x + 4, y + 4, tileW - 10, 2);
      }
    }
  }
  
  // Textura principală
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 16;
  
  // Bump map – relief detaliat
  const b = document.createElement("canvas");
  b.width = b.height = S;
  const bx = b.getContext("2d");
  const bImg = bx.getImageData(0, 0, S, S);
  const bData = bImg.data;
  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      const i = (py * S + px) * 4;
      const v = 128 + (Math.random() - 0.5) * 40;
      bData[i] = bData[i+1] = bData[i+2] = v;
      bData[i+3] = 255;
    }
  }
  bx.putImageData(bImg, 0, 0);
  
  if (tip === "tabla") {
    for (let px = 0; px < S; px += 24) {
      bx.fillStyle = "#ffffff";
      bx.fillRect(px, 0, 4, S);
      bx.fillStyle = "#555555";
      bx.fillRect(px + 6, 0, 2, S);
    }
  } else {
    for (let row = 0; row < S; row += 32) {
      bx.fillStyle = "#eeeeee";
      bx.fillRect(0, row, S, 3);
      bx.fillStyle = "#666666";
      bx.fillRect(0, row + 28, S, 4);
    }
  }
  
  const bt = new THREE.CanvasTexture(b);
  bt.wrapS = bt.wrapT = THREE.RepeatWrapping;
  bt.anisotropy = 16;
  
  return { map: t, bump: bt };
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
  const g = x.createRadialGradient(128, 128, 20, 128, 128, 128);
  g.addColorStop(0, "rgba(30,32,26,0.38)"); g.addColorStop(0.6, "rgba(30,32,26,0.14)"); g.addColorStop(1, "rgba(30,32,26,0)");
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}


// ----- TEXTURĂ PAVAJ (adăugată pentru consistență) -----
function texPavaj() {
  const S = 512;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  const baseColor = [195, 185, 175];
  ctx.fillStyle = `rgb(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]})`;
  ctx.fillRect(0, 0, S, S);
  const tileSize = 64;
  const gap = 3;
  for (let y = 0; y < S; y += tileSize) {
    for (let x = 0; x < S; x += tileSize) {
      const offsetX = (Math.floor(y / tileSize) % 2) * (tileSize / 2);
      const startX = x + offsetX;
      const variation = (Math.random() - 0.5) * 20;
      const r = Math.max(0, Math.min(255, baseColor[0] + variation));
      const g = Math.max(0, Math.min(255, baseColor[1] + variation * 1.1));
      const b = Math.max(0, Math.min(255, baseColor[2] + variation * 0.9));
      ctx.fillStyle = `rgb(${r|0}, ${g|0}, ${b|0})`;
      const radius = 2;
      const x1 = startX + gap;
      const y1 = y + gap;
      const w = tileSize - gap * 2;
      const h = tileSize - gap * 2;
      ctx.beginPath();
      ctx.moveTo(x1 + radius, y1);
      ctx.lineTo(x1 + w - radius, y1);
      ctx.quadraticCurveTo(x1 + w, y1, x1 + w, y1 + radius);
      ctx.lineTo(x1 + w, y1 + h - radius);
      ctx.quadraticCurveTo(x1 + w, y1 + h, x1 + w - radius, y1 + h);
      ctx.lineTo(x1 + radius, y1 + h);
      ctx.quadraticCurveTo(x1, y1 + h, x1, y1 + h - radius);
      ctx.lineTo(x1, y1 + radius);
      ctx.quadraticCurveTo(x1, y1, x1 + radius, y1);
      ctx.closePath();
      ctx.fill();
      for (let i = 0; i < 20; i++) {
        const px = startX + gap + Math.random() * (tileSize - gap * 2);
        const py = y + gap + Math.random() * (tileSize - gap * 2);
        const size = 1 + Math.random() * 2;
        const brightness = 30 + Math.random() * 30;
        ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, 0.12)`;
        ctx.fillRect(px, py, size, size);
      }
    }
  }
  ctx.strokeStyle = 'rgba(60, 55, 50, 0.4)';
  ctx.lineWidth = 2;
  for (let y = 0; y <= S; y += tileSize) {
    for (let x = 0; x <= S; x += tileSize) {
      const offsetX = (Math.floor(y / tileSize) % 2) * (tileSize / 2);
      const startX = x + offsetX;
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(startX + tileSize, y);
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}


export default function Scena3D({ cfg }) {
  const mount = useRef(null);
  useEffect(() => {
    const el = mount.current, Wpx = el.clientWidth, Hpx = el.clientHeight;
    const { lungime: L, latime: W, panta, tip, material } = cfg;
    const hz = 2.8, ov = 0.5;
    const hRoof = (W / 2) * Math.tan(rad(panta));

    const scene = new THREE.Scene();
    // Cer cu gradient
  const skyCanvas = document.createElement('canvas'); skyCanvas.width = 512; skyCanvas.height = 512;
  const skyCtx = skyCanvas.getContext('2d');
  const skyGrad = skyCtx.createLinearGradient(0, 0, 0, 512);
  skyGrad.addColorStop(0, '#b8d4f0'); skyGrad.addColorStop(0.4, '#dce8f0'); skyGrad.addColorStop(0.7, '#e8e4d8'); skyGrad.addColorStop(1, '#d5cec0');
  skyCtx.fillStyle = skyGrad; skyCtx.fillRect(0, 0, 512, 512);
  // Nori subtiri
  for (let i = 0; i < 15; i++) {
    skyCtx.fillStyle = 'rgba(255,255,255,0.12)';
    skyCtx.beginPath();
    skyCtx.ellipse(100 + Math.random()*312, 50 + Math.random()*100, 30+Math.random()*60, 8+Math.random()*15, Math.random()*0.5, 0, Math.PI*2);
    skyCtx.fill();
  }
  const skyTex = new THREE.CanvasTexture(skyCanvas); skyTex.colorSpace = THREE.SRGBColorSpace;
  scene.background = skyTex; skyTex.minFilter = THREE.LinearFilter; skyTex.magFilter = THREE.LinearFilter;
    const cam = new THREE.PerspectiveCamera(38, Wpx / Hpx, 0.1, 400);
    const rnd = new THREE.WebGLRenderer({ antialias: true });
    rnd.setPixelRatio(Math.min(window.devicePixelRatio, 2)); rnd.setSize(Wpx, Hpx);
    rnd.shadowMap.enabled = true; rnd.shadowMap.type = THREE.PCFSoftShadowMap; rnd.shadowMap.autoUpdate = false;
    if ("outputColorSpace" in rnd) rnd.outputColorSpace = THREE.SRGBColorSpace;
    else rnd.outputEncoding = THREE.sRGBEncoding;
    rnd.toneMapping = THREE.ACESFilmicToneMapping;
  rnd.toneMappingExposure = 1.2; // expunere ușor redusă pentru contrast
    rnd.setClearColor(0xdce8f0);
    el.appendChild(rnd.domElement);

    // Dealuri cetoase in departare (se topesc in ceata)
  (function(){
    const c=document.createElement('canvas'); c.width=1024; c.height=256; const x=c.getContext('2d');
    for(let layer=1;layer>=0;layer--){
      const baseY=95+layer*38, amp=32-layer*12, col=layer===0?'#8ba06d':'#a3b090';
      x.beginPath(); x.moveTo(0,256);
      for(let px=0;px<=1024;px+=14){ const y=baseY+Math.sin(px*0.008+layer*2.3)*amp+Math.sin(px*0.021+layer)*11; x.lineTo(px,y); }
      x.lineTo(1024,256); x.closePath();
      const g=x.createLinearGradient(0,baseY-amp,0,256);
      g.addColorStop(0,'rgba(230,234,231,0.95)'); g.addColorStop(1,col);
      x.fillStyle=g; x.globalAlpha=layer===0?1:0.8; x.fill();
    }
    const t=new THREE.CanvasTexture(c); if("colorSpace" in t)t.colorSpace=THREE.SRGBColorSpace;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(320,80), new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,fog:false}));
    m.position.set(0,22,-95); scene.add(m);
  })();
    scene.fog = new THREE.Fog("#e6eae7", 55, 170);

    const teren = new THREE.Mesh(new THREE.PlaneGeometry(320, 320),
      new THREE.MeshStandardMaterial({ map: texTeren(), roughness: 1 }));
    teren.rotation.x = -Math.PI / 2; teren.receiveShadow = true; scene.add(teren);
  // Plan imens pentru continuitate
  const bigGround = new THREE.Mesh(new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.95 }));
  bigGround.rotation.x = -Math.PI / 2; bigGround.position.y = -0.02; bigGround.receiveShadow = true;
  scene.add(bigGround);
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(L + 3.2, W + 3.2),
      new THREE.MeshStandardMaterial({ map: texPavaj(), roughness: 0.85, metalness: 0.05 }));
    apron.rotation.x = -Math.PI / 2; apron.position.y = 0.012; apron.receiveShadow = true; scene.add(apron);
    const bordT = new THREE.Mesh(new THREE.PlaneGeometry(L + 3.9, W + 3.9),
      (() => {
    const ac = document.createElement('canvas'); ac.width = 256; ac.height = 256;
    const actx = ac.getContext('2d');
    actx.fillStyle = '#b0a898'; actx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2000; i++) {
      actx.fillStyle = `rgba(${140+Math.random()*40},${130+Math.random()*40},${120+Math.random()*40},0.4)`;
      actx.fillRect(Math.random()*256, Math.random()*256, 3+Math.random()*8, 3+Math.random()*8);
    }
    // Linii de dale
    for (let x = 0; x < 256; x += 32) {
      actx.fillStyle = 'rgba(0,0,0,0.1)'; actx.fillRect(x, 0, 1, 256);
    }
    for (let y = 0; y < 256; y += 32) {
      actx.fillStyle = 'rgba(0,0,0,0.1)'; actx.fillRect(0, y, 256, 1);
    }
    const at = new THREE.CanvasTexture(ac); at.wrapS = at.wrapT = THREE.RepeatWrapping;
    at.repeat.set(4, 4); at.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({ map: at, roughness: 0.75, transparent: true, opacity: 0.55 });
  })());
    bordT.rotation.x = -Math.PI / 2; bordT.position.y = 0.008; bordT.receiveShadow = true; scene.add(bordT);
    const alee = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 7),
      new THREE.MeshStandardMaterial({ map: texPavaj(), roughness: 0.85, metalness: 0.05 }));
    alee.rotation.x = -Math.PI / 2; alee.position.set(-L / 5, 0.013, W / 2 + 3.5 + 1.6); scene.add(alee);
    const uc = new THREE.Mesh(new THREE.PlaneGeometry(L + 5, W + 5),
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

    scene.add(new THREE.HemisphereLight(0xffeedd, 0x4a5a4a, 0.45)); // ambientală redusă, tonuri calde
    const key = new THREE.DirectionalLight(0xfff0e0, 2.8); // lumină caldă
    key.position.set(L * 1.5, hz + hRoof + 10, W * 0.5); // poziție mai înaltă și lateral key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 8;
    const s = Math.max(L, W) * 1.5;
    key.shadow.camera.left = -s; key.shadow.camera.right = s;
    key.shadow.camera.top = s; key.shadow.camera.bottom = -4; key.shadow.bias = -0.0002;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 6; // umbre mai fine
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xaaccdd, 0.35); // lumină rece, difuză fill.position.set(-L * 1.2, hz + 2, -W * 1.2); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xfff5e6, 0.7); // rim mai puternic rim.position.set(-L * 0.8, hz + hRoof + 8, -W * 0.6); scene.add(rim);

  // Lumină punctuală subtilă pentru fațadă
  const fillFront = new THREE.PointLight(0xfff0e0, 0.3, 30);
  fillFront.position.set(0, hz / 2, W / 2 + 2);
  scene.add(fillFront);


    const zc = document.createElement("canvas"); zc.width = 64; zc.height = 256;
    const zx = zc.getContext("2d");
    zx.fillStyle = "#d3cabb"; zx.fillRect(0, 0, 64, 256);
    const zg = zx.createLinearGradient(0, 0, 0, 70);
    zg.addColorStop(0, "rgba(45,40,32,0.42)"); zg.addColorStop(1, "rgba(45,40,32,0)");
    zx.fillStyle = zg; zx.fillRect(0, 0, 64, 70);
    const ztx = srgb(new THREE.CanvasTexture(zc));
    
  // Tencuiala procedurală îmbunătățită
  const tencCanvas = document.createElement('canvas');
  tencCanvas.width = tencCanvas.height = 1024; // rezoluție dublă
  const tctx = tencCanvas.getContext('2d');
  
  // Baza: alb cald cu variație subtilă
  const baseColor = [245, 240, 235];
  tctx.fillStyle = `rgb(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]})`;
  tctx.fillRect(0, 0, 1024, 1024);
  
  // Granulație fină cu mai multe straturi
  for (let i = 0; i < 15000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const size = 1.5 + Math.random() * 3;
    const brightness = 220 + Math.random() * 35;
    const alpha = 0.15 + Math.random() * 0.25;
    tctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${alpha})`;
    tctx.fillRect(x, y, size, size);
  }
  
  // Variații de culoare (petice mai întunecate sau mai deschise)
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const radius = 20 + Math.random() * 60;
    const gradient = tctx.createRadialGradient(x, y, 0, x, y, radius);
    const brightness = 220 + Math.random() * 30;
    const alpha = 0.06 + Math.random() * 0.12;
    gradient.addColorStop(0, `rgba(${brightness}, ${brightness}, ${brightness}, ${alpha})`);
    gradient.addColorStop(1, `rgba(${brightness}, ${brightness}, ${brightness}, 0)`);
    tctx.fillStyle = gradient;
    tctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  
  // Imperfecțiuni fine (crăpături mici)
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const len = 4 + Math.random() * 15;
    const angle = Math.random() * Math.PI * 2;
    tctx.strokeStyle = `rgba(180, 175, 170, ${0.05 + Math.random() * 0.08})`;
    tctx.lineWidth = 0.5 + Math.random() * 0.8;
    tctx.beginPath();
    tctx.moveTo(x, y);
    tctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    tctx.stroke();
  }
  
  const tencTex = new THREE.CanvasTexture(tencCanvas);
  tencTex.wrapS = tencTex.wrapT = THREE.RepeatWrapping;
  tencTex.repeat.set(L * 1.5, hz * 1.5);
  tencTex.colorSpace = THREE.SRGBColorSpace;
  tencTex.anisotropy = 16;
  
  // Bump map pentru tencuială (relief)
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = bumpCanvas.height = 512;
  const bctx = bumpCanvas.getContext('2d');
  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, 512, 512);
  
  // Granulație pentru bump map
  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = 1 + Math.random() * 3;
    const value = 128 + (Math.random() - 0.5) * 50;
    bctx.fillStyle = `rgb(${value}, ${value}, ${value})`;
    bctx.fillRect(x, y, size, size);
  }
  
  // Variații mari pentru bump (denivelări fine)
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radius = 10 + Math.random() * 30;
    const gradient = bctx.createRadialGradient(x, y, 0, x, y, radius);
    const value = 110 + Math.random() * 60;
    gradient.addColorStop(0, `rgb(${value}, ${value}, ${value})`);
    gradient.addColorStop(1, `rgb(128, 128, 128)`);
    bctx.fillStyle = gradient;
    bctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  
  const bumpTex = new THREE.CanvasTexture(bumpCanvas);
  bumpTex.wrapS = bumpTex.wrapT = THREE.RepeatWrapping;
  bumpTex.repeat.set(L * 1.5, hz * 1.5);
  bumpTex.colorSpace = THREE.LinearSRGBColorSpace;
 bumpTex.colorSpace = THREE.LinearSRGBColorSpace;
  
  const matZid = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: tencTex,
    roughness: 0.92,
    bumpMap: bumpTex,
    bumpScale: 0.015,
    metalness: 0.0,
    clearcoat: 0.0,
    clearcoatRoughness: 0.0,
  });


    const matSub = new THREE.MeshStandardMaterial({ color: "#33302c", roughness: 0.9, side: THREE.DoubleSide });
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
    if (triF.length) scene.add(meshTri(triF, matZid));

    const matPazie = new THREE.MeshStandardMaterial({ color: "#4d443a", roughness: 0.8 });
    const rake = (p1, p2) => {
      const a = new THREE.Vector3(...p1), b = new THREE.Vector3(...p2);
      const dir = b.clone().sub(a), len = dir.length();
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, len), matPazie);
      m.position.copy(a.clone().add(b).multiplyScalar(0.5));
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.normalize());
      m.castShadow = true; scene.add(m);
    };

  // Coamă
  const matCoama = new THREE.MeshStandardMaterial({ color: shade(M.hex, 0.5), roughness: 0.45, metalness: 0.2 });
  const coamaGeo = new THREE.CylinderGeometry(0.05, 0.05, L, 8);
  coamaGeo.rotateZ(Math.PI / 2);
  const coamaMesh = new THREE.Mesh(coamaGeo, matCoama);
  coamaMesh.position.set(0, yv + 0.03, 0);
  coamaMesh.castShadow = true;
  scene.add(coamaMesh);

  // Jgheaburi + burlane
  const matJgheab = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.35, metalness: 0.9 });
  [-1, 1].forEach(s => {
    const jg = new THREE.Mesh(new THREE.BoxGeometry(L + 0.2, 0.05, 0.1), matJgheab);
    jg.position.set(0, y0 - 0.05, z0 * s);
    jg.castShadow = true; scene.add(jg);
  });
  [-1, 1].forEach(sx => {
    const bl = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, hz, 8), matJgheab);
    bl.position.set(L/2 * sx + 0.3 * sx, hz/2, z0 + 0.1);
    bl.castShadow = true; scene.add(bl);
  });

  // Streașină
  const matStreasina = new THREE.MeshStandardMaterial({ color: shade(M.hex, 0.5), roughness: 0.5, metalness: 0.15 });
  [-1, 1].forEach(s => {
    const str = new THREE.Mesh(new THREE.BoxGeometry(L + 0.15, 0.03, 0.08), matStreasina);
    str.position.set(0, y0 - 0.02, z0 * s);
    str.castShadow = true;
    scene.add(str);
  });
    const matJ = new THREE.MeshStandardMaterial({ color: "#70767c", metalness: 0.6, roughness: 0.35 });
    const bordura = (w, x, z, rotY = 0) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, 0.06), matPazie);
      p.position.set(x, y0 - 0.02, z); p.rotation.y = rotY; p.castShadow = true; scene.add(p);
      const j = new THREE.Mesh(new THREE.BoxGeometry(w, 0.13, 0.15), matJ);
      j.position.set(x, y0 - 0.17, z); j.rotation.y = rotY; scene.add(j);
    };
    bordura(L + 2 * ov, 0, z0 + 0.04); bordura(L + 2 * ov, 0, -z0 - 0.04);
    if (tip === "patru_ape") {
      bordura(W + 2 * ov, x0 + 0.04, 0, Math.PI / 2); bordura(W + 2 * ov, -x0 - 0.04, 0, Math.PI / 2);
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
      const co = new THREE.Mesh(new THREE.BoxGeometry(qCoamaL, 0.14, 0.24),
        new THREE.MeshStandardMaterial({ color: shade(M.hex, 0.6), roughness: 0.6 }));
      co.position.set(0, yCoama + 0.06, 0); co.castShadow = true; scene.add(co);
    }


    { const hx = -L / 4, hzp = -W / 5;
      const dyC = Math.min(Math.abs(hzp) * Math.tan(rad(panta)) + 0, hRoof);
      const hTop = (tip === "mansardat" ? yCoama : y0 + hRoof - dyC) + 1.0;
      // Textura caramida (Gemini: #b23b23, rosturi #8d9194, pattern 64x32)
      const hc = document.createElement("canvas"); hc.width = hc.height = 512;
      const hctx = hc.getContext("2d");
      const bw = 64, bh = 32, gap = 5;
      hctx.fillStyle = "#6a6d70"; hctx.fillRect(0, 0, 512, 512);
      for (let row = 0; row < 512; row += bh + gap) {
        const off = (Math.floor(row / (bh + gap)) % 2) * (bw / 2 + gap / 2);
        for (let col = -bw; col < 512; col += bw + gap) {
          const x = col + off, y = row;
          const r = 130 + (Math.random() - 0.5) * 25, g = 45 + (Math.random() - 0.5) * 12, b = 35 + (Math.random() - 0.5) * 12;
          hctx.fillStyle = `rgb(${r},${g},${b})`;
          hctx.fillRect(x + gap, y + gap, bw, bh);
          hctx.fillStyle = "rgba(255,255,255,0.04)"; hctx.fillRect(x + gap, y + gap, bw, bh / 3);
          hctx.fillStyle = "rgba(0,0,0,0.18)"; hctx.fillRect(x + gap, y + gap + bh * 0.7, bw, bh * 0.3);
        }
      }
      const ht = new THREE.CanvasTexture(hc); ht.wrapS = ht.wrapT = THREE.RepeatWrapping; ht.repeat.set(2, hTop * 6);
      // Bump map
      const bc = document.createElement("canvas"); bc.width = bc.height = 512;
      const bctx = bc.getContext("2d");
      bctx.fillStyle = "#000000"; bctx.fillRect(0, 0, 512, 512);
      for (let row = 0; row < 512; row += bh + gap) {
        const off = (Math.floor(row / (bh + gap)) % 2) * (bw / 2 + gap / 2);
        for (let col = -bw; col < 512; col += bw + gap) {
          bctx.fillStyle = "#ffffff";
          bctx.fillRect(col + off + gap, row + gap, bw, bh);
        }
      }
      const bt = new THREE.CanvasTexture(bc); bt.wrapS = bt.wrapT = THREE.RepeatWrapping; bt.repeat.set(2, hTop * 6);

      const horn = new THREE.Mesh(new THREE.BoxGeometry(0.75, hTop, 0.55),
        new THREE.MeshStandardMaterial({ map: ht, bumpMap: bt, bumpScale: 0.03, roughness: 0.85 }));
      horn.position.set(hx, hTop / 2, hzp); horn.castShadow = true; scene.add(horn);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.04, 0.58),
        new THREE.MeshStandardMaterial({ color: "#4d443a", roughness: 0.8 }));
      cap.position.set(hx, hTop + 0.06, hzp); cap.castShadow = true; scene.add(cap);
      // Sort tabla
      const sortH = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.03, 0.65),
        new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.35, metalness: 0.85 }));
      sortH.position.set(hx, 0.02, hzp); sortH.castShadow = true; scene.add(sortH); }

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
    const loop = () => {
      if (intro < 1) { intro = Math.min(1, intro + 0.02); const e = 1 - Math.pow(1 - intro, 3); r = rRest + (1 - e) * rRest * 0.5; th = 0.7 + (1 - e) * 0.5; }
      if (!drag) { th += vth; ph = Math.max(0.5, Math.min(1.5, ph + vph)); vth *= 0.92; vph *= 0.92; if (Math.abs(vth) < 0.0004 && intro >= 1) th += 0.0011; }
      upd(); rnd.render(scene, cam); raf = requestAnimationFrame(loop);
    };
    loop();
    const onR = () => { const w = el.clientWidth, h = el.clientHeight; cam.aspect = w / h; cam.updateProjectionMatrix(); rnd.setSize(w, h); };
    window.addEventListener("resize", onR);
    adaugaGradina(scene, rnd, L, W);

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onR); window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); rnd.dispose(); el.removeChild(rnd.domElement); };
  }, [cfg]);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mount} style={{ width: "100%", height: "100%", touchAction: "none", cursor: "grab" }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 62%, rgba(20,25,20,0.13) 100%)" }} />
    </div>
  );
}
