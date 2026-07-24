// peisaj.js - elemente decorative (copaci, iarbă, gard, flori)
import * as THREE from "three";

// ----- SPECII ȘI COMPOZIȚIE -----
const SPECII = {
  Fag: { tip: "foios", inaltime: 5.5, latime: 1.8, grosime: 0.16, ramificatii: 5, deschidere: 42, umbrire: 0.55, frunzePerVarf: 16, marimeFrunza: 0.72, culoareFrunze: "#6d7d54", culoareTrunchi: "#6b5a48", variatieCuloare: 0.06 },
  Brad: { tip: "brad", inaltime: 7, latime: 1.7, grosime: 0.13, ramificatii: 5, deschidere: 42, umbrire: 0.55, frunzePerVarf: 16, marimeFrunza: 0.57, culoareFrunze: "#3c4a3a", culoareTrunchi: "#4a3c30", variatieCuloare: 0.05 },
  Plop: { tip: "plop", inaltime: 9, latime: 1.1, grosime: 0.15, ramificatii: 5, deschidere: 30, umbrire: 0.55, frunzePerVarf: 16, marimeFrunza: 0.70, culoareFrunze: "#78875e", culoareTrunchi: "#7a6a55", variatieCuloare: 0.07 },
  Tufa: { tip: "tufa", inaltime: 1.6, latime: 0.9, grosime: 0.1, ramificatii: 4, deschidere: 55, umbrire: 0.55, frunzePerVarf: 20, marimeFrunza: 0.60, culoareFrunze: "#5f6e4c", culoareTrunchi: "#5a4a3a", variatieCuloare: 0.09 },
};

const COMPOZITIE = [
  { specie: "Plop", x: -9.5, z: -8, scara: 1, rot: 0.4, seed: 2141 },
  { specie: "Brad", x: -13, z: -12.5, scara: 0.9, rot: 1.2, seed: 3312 },
  { specie: "Fag", x: -11.5, z: -4.5, scara: 0.75, rot: 2.1, seed: 5518 },
  { specie: "Fag", x: -10.5, z: 6.5, scara: 1.1, rot: 0.9, seed: 7734 },
  { specie: "Fag", x: -13.2, z: 9.5, scara: 0.62, rot: 3.4, seed: 1287 },
  { specie: "Fag", x: 12.5, z: 8, scara: 0.85, rot: 1.7, seed: 4460 },
  { specie: "Fag", x: 13.5, z: -9, scara: 0.7, rot: 4.2, seed: 8875 },
  { specie: "Tufa", x: -4.0, z: -7.0, scara: 0.8, rot: 1.1, seed: 9021 },
  { specie: "Tufa", x:  4.0, z: -7.0, scara: 0.8, rot: 4.2, seed: 8875 },
  { specie: "Tufa", x: -5.5, z: 8.0, scara: 0.9, rot: 0.0, seed: 3741 },
  { specie: "Tufa", x:  2.0, z: 8.0, scara: 0.9, rot: 3.14, seed: 5960 },
];

// ----- GENERARE COPACI -----
function generaCopac(p, seed) {
  const r = rng(seed);
  const H = p.inaltime * (0.88 + r() * 0.24);
  const umbra = p.umbrire;
  const ace = p.tip === "brad";
  const SUS = new THREE.Vector3(0, 1, 0);
  const OX = new THREE.Vector3(1, 0, 0);
  const UNU = new THREE.Vector3(1, 1, 1);

  const B = { pos: [], nor: [], idx: [], n: 0 };
  const tub = (a, b, ra, rb, lat) => {
    const d = new THREE.Vector3().subVectors(b, a);
    const len = d.length();
    if (len < 1e-4) return;
    const geo = new THREE.CylinderGeometry(rb, ra, len, lat, 1, true);
    const q = new THREE.Quaternion().setFromUnitVectors(SUS, d.clone().normalize());
    geo.applyMatrix4(new THREE.Matrix4().compose(a.clone().addScaledVector(d, 0.5), q, UNU));
    const gp = geo.attributes.position,
      gn = geo.attributes.normal,
      gi = geo.index;
    for (let i = 0; i < gp.count; i++) {
      B.pos.push(gp.getX(i), gp.getY(i), gp.getZ(i));
      B.nor.push(gn.getX(i), gn.getY(i), gn.getZ(i));
    }
    for (let i = 0; i < gi.count; i++) B.idx.push(gi.getX(i) + B.n);
    B.n += gp.count;
    geo.dispose();
  };

  const abate = (dir, unghi, rol) => {
    const ref = Math.abs(dir.y) > 0.92 ? OX : SUS;
    const u = new THREE.Vector3().crossVectors(dir, ref).normalize();
    const v = new THREE.Vector3().crossVectors(dir, u).normalize();
    const ax = u.multiplyScalar(Math.cos(rol)).addScaledVector(v, Math.sin(rol)).normalize();
    return dir.clone().applyAxisAngle(ax, unghi).normalize();
  };

  const S = ace
    ? { unghi: 1.32, apical: 0.86, copii: 1, gravit: -0.16, scurt: 0.9 }
    : p.tip === "plop"
    ? { unghi: 0.34, apical: 0.7, copii: 2, gravit: 0.42, scurt: 0.74 }
    : p.tip === "tufa"
    ? { unghi: 0.66, apical: 0.62, copii: 2, gravit: 0.12, scurt: 0.7 }
    : { unghi: 0.62, apical: 0.66, copii: 2, gravit: 0.2, scurt: 0.74 };

  const desch = p.deschidere * (Math.PI / 180);
  const varfuri = [];

  const creste = (a, dir, len, radius, ad) => {
    const b = a.clone().addScaledVector(dir, len);
    tub(a, b, radius, radius * 0.7, ad > 2 ? 7 : 5);
    if (ad <= 0 || len < H * 0.035) {
      varfuri.push({ p: b, d: dir.clone(), s: len });
      return;
    }
    const n = S.copii + (r() < 0.35 ? 1 : 0);
    const dP = abate(dir, desch * 0.22 * (0.5 + r()), r() * 6.283).lerp(SUS, S.gravit * 0.35).normalize();
    creste(b, dP, len * S.apical, radius * 0.74, ad - 1);
    for (let i = 0; i < n; i++) {
      const rol = (i / n) * 6.283 + r() * 1.4;
      const d2 = abate(dir, desch * S.unghi * (0.7 + r() * 0.6), rol)
        .lerp(SUS, S.gravit * (0.25 + r() * 0.3))
        .normalize();
      creste(b, d2, len * S.scurt * (0.82 + r() * 0.3), radius * 0.6, ad - 1);
    }
  };

  const niv = Math.round(p.ramificatii);
  const rad0 = p.grosime;

  if (ace) {
    const pasi = 8;
    let a = new THREE.Vector3(0, 0, 0);
    for (let i = 0; i < pasi; i++) {
      const t = i / pasi;
      const b = new THREE.Vector3((r() - 0.5) * rad0, ((i + 1) / pasi) * H, (r() - 0.5) * rad0);
      tub(a, b, rad0 * (1 - t * 0.85), rad0 * (1 - (t + 1 / pasi) * 0.85), 7);
      if (i > 0) {
        const nr = 4 + Math.round(r() * 2);
        for (let k = 0; k < nr; k++) {
          const rol = (k / nr) * 6.283 + i * 1.1;
          const d = abate(SUS, 1.18 + r() * 0.25, rol).normalize();
          const lg = p.latime * Math.pow(1 - t, 0.85) * (0.75 + r() * 0.45);
          creste(a.clone(), d, lg * 0.55, rad0 * 0.3 * (1 - t * 0.6), Math.max(1, niv - 2));
        }
      }
      a = b;
    }
    varfuri.push({ p: a.clone(), d: SUS.clone(), s: H * 0.05 });
  } else if (p.tip === "tufa") {
    const nT = 4 + Math.round(r() * 2);
    for (let i = 0; i < nT; i++) {
      const rol = (i / nT) * 6.283 + r();
      const d = abate(SUS, 0.3 + r() * 0.35, rol).normalize();
      creste(new THREE.Vector3((r() - 0.5) * 0.2, 0, (r() - 0.5) * 0.2), d, H * 0.34, rad0, niv);
    }
  } else {
    const hT = H * (p.tip === "plop" ? 0.3 : 0.34);
    tub(new THREE.Vector3(0, 0, 0), new THREE.Vector3((r() - 0.5) * 0.12, hT, (r() - 0.5) * 0.12), rad0 * 1.55, rad0, 9);
    creste(new THREE.Vector3(0, hT, 0), SUS.clone(), H * 0.3, rad0, niv);
  }

  // cutia de incadrare a lemnului, pentru gradientul de umbrire
  let minY = Infinity, maxY = -Infinity, cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < B.pos.length; i += 3) {
    const y = B.pos[i + 1];
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    cx += B.pos[i];
    cy += y;
    cz += B.pos[i + 2];
  }
  const nv = B.pos.length / 3;
  const centru = new THREE.Vector3(cx / nv, cy / nv, cz / nv);
  const yJos = minY + (maxY - minY) * 0.12;
  const ySus = maxY;

  const L = { pos: [], nor: [], uv: [], col: [], sw: [], idx: [], n: 0 };
  const xr = new THREE.Vector3(), zr = new THREE.Vector3(), nn = new THREE.Vector3();
  const vv = new THREE.Vector3(), ax2 = new THREE.Vector3();

  const frunza = (c, dir, marime) => {
    const y = dir.clone().normalize();
    const ref = Math.abs(y.y) > 0.92 ? OX : SUS;
    xr.crossVectors(ref, y).normalize();
    zr.crossVectors(xr, y).normalize();
    const rol = r() * 6.283;
    ax2.copy(xr).multiplyScalar(Math.cos(rol)).addScaledVector(zr, Math.sin(rol)).normalize();
    const nz = new THREE.Vector3().crossVectors(ax2, y).normalize();
    nn.copy(c).sub(centru).normalize().addScaledVector(SUS, 0.45).normalize();
    nn.lerp(nz, 0.35).normalize();
    const w = marime * 0.5, h = marime;
    const col = [[-w, 0, 0], [w, 0, 0], [w, h, 0], [-w, h, 0]];
    for (let i = 0; i < 4; i++) {
      vv.set(0, 0, 0)
        .addScaledVector(ax2, col[i][0])
        .addScaledVector(y, col[i][1])
        .addScaledVector(nz, col[i][2])
        .add(c);
      L.pos.push(vv.x, vv.y, vv.z);
      L.nor.push(nn.x, nn.y, nn.z);
      let t = (vv.y - yJos) / Math.max(0.001, ySus - yJos);
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const k = 1 - umbra + umbra * Math.pow(t, 0.75);
      L.col.push(k * (0.9 + 0.2 * t), k, k * (1.02 - 0.16 * t));
      L.sw.push(t * t);
    }
    L.uv.push(0, 0, 1, 0, 1, 1, 0, 1);
    L.idx.push(L.n, L.n + 1, L.n + 2, L.n, L.n + 2, L.n + 3);
    L.n += 4;
  };

  const perVarf = Math.max(1, Math.round(p.frunzePerVarf));
  for (const v of varfuri)
    for (let i = 0; i < perVarf; i++) {
      const dep = v.d.clone().addScaledVector(SUS, -0.5 - r() * 0.6).normalize();
      const c = v.p
        .clone()
        .addScaledVector(v.d, -v.s * r() * 0.75)
        .add(new THREE.Vector3((r() - 0.5) * v.s * 0.5, (r() - 0.5) * v.s * 0.4, (r() - 0.5) * v.s * 0.5));
      frunza(c, dep, p.marimeFrunza * (0.75 + r() * 0.55));
    }

  return {
    lemn: {
      pos: new Float32Array(B.pos),
      nor: new Float32Array(B.nor),
      idx: new Uint32Array(B.idx),
    },
    frunze: {
      pos: new Float32Array(L.pos),
      nor: new Float32Array(L.nor),
      uv: new Float32Array(L.uv),
      col: new Float32Array(L.col),
      sw: new Float32Array(L.sw),
      idx: new Uint32Array(L.idx),
    },
    ace,
  };
}

// ----- GENERARE IARBĂ -----
function geoIarba(L, W, dens, seed) {
  const r = rng(seed);
  const A = { pos: [], nor: [], uv: [], col: [], sw: [], idx: [], n: 0 };
  const fx = L / 2 + 11 - 0.55, fz = W / 2 + 10 - 0.55;
  const px = (L + 3.9) / 2 + 0.3, pz = (W + 3.9) / 2 + 0.3;
  const ax = -L / 5, az0 = W / 2 + 1.4, az1 = W / 2 + 9;
  const pas = Math.max(0.3, Math.sqrt((4 * fx * fz) / Math.max(250, dens)));

  for (let gx = -fx; gx <= fx; gx += pas) {
    for (let gz = -fz; gz <= fz; gz += pas) {
      const jx = gx + (r() - 0.5) * pas * 0.9;
      const jz = gz + (r() - 0.5) * pas * 0.9;
      if (Math.abs(jx) > fx || Math.abs(jz) > fz) continue;
      if (Math.abs(jx) < px && Math.abs(jz) < pz) continue;
      if (Math.abs(jx - ax) < 1.15 && jz > az0 && jz < az1) continue;
      const marg = Math.max(Math.abs(jx) / fx, Math.abs(jz) / fz);
      const hb = (0.085 + r() * 0.075) * (1 + Math.pow(marg, 5) * 2.4);
        const variatieCuloare = (r() - 0.5) * 0.15;
        const variatieInaltime = 0.7 + r() * 0.6;
      const d = Math.hypot(jx, jz);
      const cet = Math.min(0.3, Math.max(0, (d - 9) / 44));
      for (let q = 0; q < 3; q++) {
        const ang = r() * Math.PI;
        const wq = (0.15 + r() * 0.1) * 0.5;
        const dx = Math.cos(ang) * wq, dz = Math.sin(ang) * wq;
        const cx = jx + (r() - 0.5) * pas * 0.3, cz = jz + (r() - 0.5) * pas * 0.3;
        const nix = (r() - 0.5) * 0.5, niz = (r() - 0.5) * 0.5;
        const nl = Math.hypot(nix, 1, niz);
        const h = hb * (0.78 + r() * 0.44);
        const cor = [[cx - dx, 0, cz - dz], [cx + dx, 0, cz + dz], [cx + dx, h, cz + dz], [cx - dx, h, cz - dz]];
        const sw = [0, 0, 1, 1];
        const uvs = [0, 0, 1, 0, 1, 1, 0, 1];
        for (let k = 0; k < 4; k++) {
          A.pos.push(cor[k][0], cor[k][1], cor[k][2]);
          A.nor.push(nix / nl, 1 / nl, niz / nl);
          A.uv.push(uvs[k * 2], uvs[k * 2 + 1]);
          const t = sw[k];
          const b = 0.62 + t * 0.46;
          A.col.push(b + cet * 0.4, b + cet * 0.38, b + cet * 0.35);
          A.sw.push(t);
        }
        A.idx.push(A.n, A.n + 1, A.n + 2, A.n, A.n + 2, A.n + 3);
        A.n += 4;
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(A.pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(A.nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(A.uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(A.col, 3));
  g.setAttribute("aSway", new THREE.Float32BufferAttribute(A.sw, 1));
  g.setIndex(A.idx);
  return g;
}

// ----- GENERARE GARD -----
function geoGard(L, W, seed) {
  const r = rng(seed);
  const mk = () => ({ pos: [], nor: [], idx: [], n: 0 });
  const ZID = mk(), CAP = mk(), SIP = mk();
  const q = new THREE.Quaternion(), e = new THREE.Euler(), unu = new THREE.Vector3(1, 1, 1);
  const cutie = (A, w, h, d, x, y, z, ry) => {
    const g = new THREE.BoxGeometry(w, h, d);
    e.set(0, ry, 0);
    q.setFromEuler(e);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, unu));
    const gp = g.attributes.position, gn = g.attributes.normal, gi = g.index;
    for (let i = 0; i < gp.count; i++) {
      A.pos.push(gp.getX(i), gp.getY(i), gp.getZ(i));
      A.nor.push(gn.getX(i), gn.getY(i), gn.getZ(i));
    }
    for (let i = 0; i < gi.count; i++) A.idx.push(gi.getX(i) + A.n);
    A.n += gp.count;
    g.dispose();
  };

  const fx = L / 2 + 11, fz = W / 2 + 10;
  const poarta = -L / 5, latPoarta = 3.4;
  const hSoclu = 0.44, hStalp = 1.62, hSipca = 1.06;

  const latura = (ax, az, bx, bz, gap) => {
    const dx = bx - ax, dz = bz - az;
    const ry = Math.atan2(dx, dz);
    const seg =
      gap === null || Math.abs(dx) < 0.01
        ? [[0, 1]]
        : [[0, (gap - latPoarta / 2 - ax) / dx], [(gap + latPoarta / 2 - ax) / dx, 1]];
    for (const [t0, t1] of seg) {
      if (!(t1 > t0)) continue;
      const sx = ax + dx * t0, sz = az + dz * t0;
      const ex = ax + dx * t1, ez = az + dz * t1;
      const sl = Math.hypot(ex - sx, ez - sz);
      if (sl < 0.5) continue;
      const ux = (ex - sx) / sl, uz = (ez - sz) / sl;

      cutie(ZID, 0.28, hSoclu, sl, (sx + ex) / 2, hSoclu / 2, (sz + ez) / 2, ry);
      cutie(CAP, 0.34, 0.05, sl, (sx + ex) / 2, hSoclu + 0.02, (sz + ez) / 2, ry);

      const n = Math.max(1, Math.round(sl / 2.7));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const x = sx + (ex - sx) * t, z = sz + (ez - sz) * t;
        cutie(ZID, 0.36, hStalp, 0.36, x, hStalp / 2, z, ry);
        cutie(CAP, 0.46, 0.08, 0.46, x, hStalp + 0.04, z, ry);
      }

      for (let i = 0; i < n; i++) {
        const d0 = (sl / n) * i + 0.26;
        const d1 = (sl / n) * (i + 1) - 0.26;
        for (let d = d0; d < d1; d += 0.135)
          cutie(SIP, 0.05, hSipca, 0.05, sx + ux * d, hSoclu + hSipca / 2 + 0.02, sz + uz * d, ry);
        const mid = (sl / n) * (i + 0.5);
        cutie(SIP, 0.06, 0.07, sl / n - 0.5, sx + ux * mid, hSoclu + hSipca - 0.04, sz + uz * mid, ry);
      }
    }
  };

  latura(-fx, -fz, fx, -fz, null);
  latura(-fx, fz, fx, fz, poarta);
  latura(-fx, -fz, -fx, fz, null);
  latura(fx, -fz, fx, fz, null);

  const fa = (A) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(A.pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(A.nor, 3));
    g.setIndex(A.idx);
    return g;
  };
  return { zid: fa(ZID), cap: fa(CAP), sipci: fa(SIP) };
}

// ----- GENERARE FLORI -----
function adaugaFlori(scene, L, W) {
  const group = new THREE.Group();
  const colors = [0xff4d4d, 0xffd700, 0x9b59b6, 0xff69b4, 0xffffff];
  const numFlori = 80 + Math.floor(Math.random() * 40);
  
  for (let i = 0; i < numFlori; i++) {
    const x = (Math.random() - 0.5) * (L + 12);
    const z = (Math.random() - 0.5) * (W + 12);
    if (Math.abs(x) < L / 2 + 2.5 && Math.abs(z) < W / 2 + 2.5) continue;
    if (z > W / 2 - 0.5 && z < W / 2 + 6 && x > -3.0 && x < 1.0) continue;
    if (Math.abs(x) > L / 2 + 6.0 || Math.abs(z) > W / 2 + 6.0) continue;
    
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.02, 0.15 + Math.random() * 0.15, 4),
      new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 1 })
    );
    stem.position.set(x, 0.08, z);
    stem.rotation.x = (Math.random() - 0.5) * 0.2;
    stem.rotation.z = (Math.random() - 0.5) * 0.2;
    stem.castShadow = true;
    group.add(stem);
    
    const petalMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.6, side: THREE.DoubleSide });
    const petalGeo = new THREE.SphereGeometry(0.04 + Math.random() * 0.02, 5, 4);
    petalGeo.scale(1, 0.3, 1);
    
    for (let j = 0; j < 4; j++) {
      const angle = (j / 4) * Math.PI * 2 + Math.random() * 0.2;
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(
        x + Math.cos(angle) * 0.04,
        0.15 + Math.random() * 0.05,
        z + Math.sin(angle) * 0.04
      );
      petal.rotation.x = (Math.random() - 0.5) * 0.3;
      petal.rotation.y = angle;
      petal.rotation.z = (Math.random() - 0.5) * 0.3;
      petal.castShadow = true;
      group.add(petal);
    }
    
    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 6, 4),
      new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.8, emissive: 0xcc9900, emissiveIntensity: 0.1 })
    );
    center.position.set(x, 0.18 + Math.random() * 0.04, z);
    center.castShadow = true;
    group.add(center);
  }
  
  scene.add(group);
  return group;
}

// ----- FUNCȚIA PRINCIPALĂ DE ADAUGARE A PEISAJULUI -----
export function adaugaPeisaj(scene, renderer, L, W, optiuni = {}) {
  const o = Object.assign(
    { copaci: true, iarba: true, gard: true, flori: true, densIarba: 9000 },
    optiuni
  );
  const grup = new THREE.Group();
  grup.name = "peisaj";

  // Copaci
  if (o.copaci) {
    // Aici vom integra logica copacilor din gradina.js
    // Pentru moment, rămâne placeholder - vom muta treptat
  }

  // Iarbă
  if (o.iarba) {
    const geo = geoIarba(L, W, o.densIarba, 4242);
    // Materialul va fi adăugat ulterior
  }

  // Gard
  if (o.gard) {
    const geo = geoGard(L, W, 88);
    // Materialele vor fi adăugate ulterior
  }

  // Flori
  if (o.flori) {
    adaugaFlori(grup, L, W);
  }

  scene.add(grup);
  return grup;
}
