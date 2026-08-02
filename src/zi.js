// zi.js — ciclul zi→apus: un singur parametru (ora, 0..1) orchestrează
// soarele, cerul, ceața și ferestrele care se aprind seara.
//   0.0 = dimineață devreme · 0.35 = prânz · 0.8 = golden hour · 1.0 = amurg
// Utilizare (din Scena3D):
//   const zi = creeazaZi({ scene, key, fill, rim, hemi, matGeam, L, W, hz, hRoof });
//   zi.seteazaOra(0.8);   // oricând, inclusiv dintr-un slider
import * as THREE from "three";

// Interpolare culoare în spațiul HSL (tranziții naturale cer/soare)
const _a = new THREE.Color(), _b = new THREE.Color();
function lerpCol(hexA, hexB, t) {
  _a.set(hexA); _b.set(hexB);
  return _a.lerp(_b, t).getStyle();
}
function lerp(a, b, t) { return a + (b - a) * t; }

// Paletele cheie ale zilei: [zi plină] → [golden hour] → [amurg]
const CER = {
  zi:     { sus: "#b8d4f0", mij: "#dce8f0", jos: "#e8e4d8", oriz: "#d5cec0" },
  golden: { sus: "#8fb4dd", mij: "#e8cfae", jos: "#f4b978", oriz: "#e89a5c" },
  amurg:  { sus: "#3d4a6b", mij: "#7a6a8a", jos: "#c97b5a", oriz: "#8a4a3a" },
};
const SOARE = {
  zi:     { culoare: 0xffe9cf, intensitate: 2.1, inaltime: 1.0 },
  golden: { culoare: 0xffb968, intensitate: 1.7, inaltime: 0.35 },
  amurg:  { culoare: 0xff8a4a, intensitate: 0.7, inaltime: 0.12 },
};

function faza(ora) {
  // 0..0.55 = zi plină; 0.55..0.85 = spre golden; 0.85..1 = spre amurg
  if (ora <= 0.55) return { de: "zi", spre: "zi", t: 0 };
  if (ora <= 0.85) return { de: "zi", spre: "golden", t: (ora - 0.55) / 0.3 };
  return { de: "golden", spre: "amurg", t: (ora - 0.85) / 0.15 };
}

export function creeazaZi({ scene, key, fill, rim, hemi, matGeam, L, W, hz, hRoof }) {
  // ---- cerul: canvas regenerat la schimbarea orei ----
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
  scene.background = tex;

  // Nori generați O DATĂ (poziții stabile — nu sar când miști slider-ul)
  const nori = Array.from({ length: 15 }, () => ({
    x: 100 + Math.random() * 312, y: 50 + Math.random() * 100,
    rx: 30 + Math.random() * 60, ry: 8 + Math.random() * 15,
    rot: Math.random() * 0.5,
  }));

  // ---- lumina caldă din ferestre (se aprinde seara) ----
  // Un material emissiv separat pentru geamuri + un PointLight cald în casă.
  const luminaCasa = new THREE.PointLight(0xffb556, 0, Math.max(L, W) * 2.2, 1.6);
  luminaCasa.position.set(0, hz * 0.55, 0);
  scene.add(luminaCasa);

  function deseneazaCer(ora) {
    const f = faza(ora);
    const A = CER[f.de], B = CER[f.spre];
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0.0, lerpCol(A.sus, B.sus, f.t));
    g.addColorStop(0.4, lerpCol(A.mij, B.mij, f.t));
    g.addColorStop(0.7, lerpCol(A.jos, B.jos, f.t));
    g.addColorStop(1.0, lerpCol(A.oriz, B.oriz, f.t));
    ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512);
    // Norii: albi ziua, aurii la apus, întunecați în amurg
    const norAlpha = lerp(0.12, 0.22, Math.min(1, ora / 0.85));
    const norCol = ora < 0.6 ? "255,255,255" : ora < 0.9 ? "255,214,160" : "120,100,130";
    ctx.fillStyle = `rgba(${norCol},${norAlpha})`;
    for (const n of nori) {
      ctx.beginPath();
      ctx.ellipse(n.x, n.y, n.rx, n.ry, n.rot, 0, Math.PI * 2);
      ctx.fill();
    }
    tex.needsUpdate = true;
  }

  function seteazaOra(ora) {
    ora = Math.max(0, Math.min(1, ora));
    const f = faza(ora);
    const A = SOARE[f.de], B = SOARE[f.spre];

    // Soarele: culoare + intensitate + coborâre spre orizont
    key.color.set(A.culoare).lerp(new THREE.Color(B.culoare), f.t);
    key.intensity = lerp(A.intensitate, B.intensitate, f.t);
    const h = lerp(A.inaltime, B.inaltime, f.t);
    key.position.set(L * 1.7, (hz + hRoof + 6.5) * h + 1.5, W * 0.3 + (1 - h) * W * 1.2);

    // Fill/rim/hemisferă scad spre seară; hemisfera se răcește
    fill.intensity = lerp(0.5, 0.15, Math.min(1, ora / 0.9));
    rim.intensity = lerp(0.5, 0.9, Math.max(0, (ora - 0.55) / 0.45)); // rim crește la apus (contur auriu)
    rim.color.set(ora > 0.55 ? 0xffb060 : 0xfff0dd);
    hemi.intensity = lerp(0.75, 0.35, Math.min(1, ora / 0.95));

    // Ceața ia culoarea orizontului (coeziune atmosferică)
    if (scene.fog) {
      const F = CER[f.de], G = CER[f.spre];
      scene.fog.color.set(lerpCol(F.oriz, G.oriz, f.t));
    }

    // Ferestrele se APRIND când soarele coboară (casa pare locuită)
    const aprins = Math.max(0, (ora - 0.6) / 0.4); // 0 → 1 după ora 0.6
    if (matGeam) {
      matGeam.emissive = matGeam.emissive || new THREE.Color(0x000000);
      matGeam.emissive.setRGB(1.0 * aprins, 0.62 * aprins, 0.28 * aprins);
      matGeam.emissiveIntensity = 0.9;
      matGeam.opacity = lerp(0.8, 0.92, aprins);
    }
    luminaCasa.intensity = aprins * 2.4;

    deseneazaCer(ora);
  }

  return { seteazaOra };
}
