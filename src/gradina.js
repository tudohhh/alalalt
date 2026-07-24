import * as THREE from "three";

/* ============================================================
   GRADINA — copaci, iarba, gard, vant, mediu de reflexie.
   Se lipeste peste scena existenta cu O SINGURA linie:
       adaugaGradina(scene, renderer, L, W);
   Copacii se genereaza o singura data si se tin in cache, ca sa nu
   se reconstruiasca la fiecare miscare de slider.
   ============================================================ */

const srgb = (t) => {
  if ("colorSpace" in t) t.colorSpace = THREE.SRGBColorSpace;
  else t.encoding = THREE.sRGBEncoding;
  return t;
};

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ---------- vant, in shader ---------- */
const MAT_VANT = [];
function cuVant(mat, amp) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = { value: 0 };
    sh.uniforms.uAmp = { value: amp };
    sh.vertexShader =
      "uniform float uTime;\nuniform float uAmp;\nattribute float aSway;\n" +
      sh.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         vec4 wp = modelMatrix * vec4(transformed, 1.0);
         float w = sin(uTime * 1.45 + wp.x * 0.40 + wp.z * 0.29)
                 + 0.42 * sin(uTime * 2.85 + wp.x * 0.93 - wp.z * 0.51);
         transformed.x += w * aSway * uAmp;
         transformed.z += w * aSway * uAmp * 0.5;`
      );
    mat.userData.sh = sh;
    MAT_VANT.push(mat);
  };
  return mat;
}

let ceasPornit = false;
function pornesteCeasul() {
  if (ceasPornit) return;
  ceasPornit = true;
  let t0 = performance.now();
  let t = 0;
  const pas = () => {
    const acum = performance.now();
    t += Math.min(0.05, (acum - t0) / 1000);
    t0 = acum;
    for (let i = MAT_VANT.length - 1; i >= 0; i--) {
      const sh = MAT_VANT[i].userData.sh;
      if (sh) sh.uniforms.uTime.value = t;
    }
    requestAnimationFrame(pas);
  };
  requestAnimationFrame(pas);
}

/* ---------- texturi ---------- */
function texturaFrunza(tip, seed) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 128;
  const x = cv.getContext("2d");
  const r = rng(seed);
  x.clearRect(0, 0, 128, 128);
  if (tip === "ace") {
    x.strokeStyle = "rgba(255,255,255,.95)";
    x.lineWidth = 2.6;
    x.beginPath();
    x.moveTo(64, 126);
    x.lineTo(64, 8);
    x.stroke();
    for (let i = 0; i < 34; i++) {
      const t = i / 34;
      const y = 124 - t * 112;
      const len = 30 * (1 - t * 0.55);
      for (const s of [-1, 1]) {
        x.strokeStyle = "rgba(255,255,255," + (0.62 + r() * 0.38) + ")";
        x.lineWidth = 1.5 + r() * 1.2;
        x.lineCap = "round";
        x.beginPath();
        x.moveTo(64, y);
        x.lineTo(64 + s * len * (0.7 + r() * 0.5), y + 8 + r() * 7);
        x.stroke();
      }
    }
  } else {
    x.strokeStyle = "rgba(255,255,255,.85)";
    x.lineWidth = 2.2;
    x.beginPath();
    x.moveTo(64, 126);
    x.quadraticCurveTo(70, 70, 64, 10);
    x.stroke();
    for (let i = 0; i < 7; i++) {
      const t = (i + 0.6) / 7.6;
      const y = 122 - t * 108;
      const s = i % 2 === 0 ? 1 : -1;
      const lung = 40 * (1 - t * 0.42) * (0.85 + r() * 0.3);
      const lat = lung * (0.44 + r() * 0.14);
      x.save();
      x.translate(64, y);
      x.rotate(s * (0.62 + r() * 0.3) + (r() - 0.5) * 0.2);
      x.fillStyle = "rgba(255,255,255," + (0.82 + r() * 0.18) + ")";
      x.beginPath();
      x.moveTo(0, 0);
      x.quadraticCurveTo(lat * 0.5, -lung * 0.34, 0, -lung);
      x.quadraticCurveTo(-lat * 0.5, -lung * 0.34, 0, 0);
      x.fill();
      x.strokeStyle = "rgba(0,0,0,.22)";
      x.lineWidth = 1;
      x.beginPath();
      x.moveTo(0, 0);
      x.lineTo(0, -lung * 0.92);
      x.stroke();
      x.restore();
    }
  }
  return new THREE.CanvasTexture(cv);
}





/* ---------- flori ---------- */




function texIarba() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d");
  x.clearRect(0, 0, 128, 128);
  for (let i = 0; i < 24; i++) {
    const x0 = 18 + Math.random() * 92;
    const h = 52 + Math.random() * 70;
    const lean = (Math.random() - 0.5) * 36;
    const w = 2.2 + Math.random() * 2.8;
    x.fillStyle = "rgba(255,255,255," + (0.5 + Math.random() * 0.5) + ")";
    x.beginPath();
    x.moveTo(x0 - w, 128);
    x.quadraticCurveTo(x0 - w * 0.4 + lean * 0.5, 128 - h * 0.55, x0 + lean, 128 - h);
    x.quadraticCurveTo(x0 + w * 0.6 + lean * 0.5, 128 - h * 0.5, x0 + w, 128);
    x.closePath();
    x.fill();
  }
  return new THREE.CanvasTexture(c);
}

function texContact() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(128, 128, 18, 128, 128, 128);
  g.addColorStop(0, "rgba(28,30,24,0.42)");
  g.addColorStop(0.6, "rgba(28,30,24,0.15)");
  g.addColorStop(1, "rgba(28,30,24,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}


/* ---------- gazon: textura de detaliu, cusuta la margini ---------- */
function texGazon() {
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const x = c.getContext("2d");
  // canvas separat pentru relief: alb = fir ridicat, negru = pamant
  const b = document.createElement("canvas");
  b.width = b.height = S;
  const bx = b.getContext("2d");

  x.fillStyle = "#55643f";
  x.fillRect(0, 0, S, S);
  bx.fillStyle = "#2a2a2a";
  bx.fillRect(0, 0, S, S);

  const tonuri = ["#6d7c50", "#586740", "#77865c", "#4d5a36", "#7f8d64", "#657449", "#8a976f", "#909d74"];

  const fir = (px, py, ang, len, w, col, lum) => {
    x.strokeStyle = col;
    x.lineWidth = w;
    x.lineCap = "round";
    x.beginPath();
    x.moveTo(px, py);
    x.lineTo(px + Math.cos(ang) * len, py + Math.sin(ang) * len);
    x.stroke();
    bx.strokeStyle = "rgba(255,255,255," + lum + ")";
    bx.lineWidth = w;
    bx.lineCap = "round";
    bx.beginPath();
    bx.moveTo(px, py);
    bx.lineTo(px + Math.cos(ang) * len, py + Math.sin(ang) * len);
    bx.stroke();
  };

  for (let i = 0; i < 300; i++) {
    const px = Math.random() * S, py = Math.random() * S;
    const rr = 20 + Math.random() * 85;
    const g = x.createRadialGradient(px, py, 0, px, py, rr);
    const inchis = Math.random() < 0.55;
    g.addColorStop(0, inchis ? "rgba(36,48,26,0.32)" : "rgba(165,180,130,0.24)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(px - rr, py - rr, rr * 2, rr * 2);
  }

  // trei straturi: firele scurte umplu fundalul, cele lungi dau silueta
  const straturi = [
    { n: 26000, lmin: 3, lvar: 5, wmin: 0.7, wvar: 0.9, lum: 0.35 },
    { n: 18000, lmin: 7, lvar: 9, wmin: 1.0, wvar: 1.3, lum: 0.6 },
    { n: 8000, lmin: 12, lvar: 13, wmin: 1.3, wvar: 1.6, lum: 0.95 },
  ];
  for (const st of straturi)
    for (let i = 0; i < st.n; i++) {
      const px = Math.random() * S, py = Math.random() * S;
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.8;
      const len = st.lmin + Math.random() * st.lvar;
      const w = st.wmin + Math.random() * st.wvar;
      const col = tonuri[(Math.random() * tonuri.length) | 0];
      if (px < 30 || px > S - 30 || py < 30 || py > S - 30) {
        for (const dx of [-S, 0, S])
          for (const dy of [-S, 0, S]) fir(px + dx, py + dy, ang, len, w, col, st.lum);
      } else fir(px, py, ang, len, w, col, st.lum);
    }

  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 16;
  const tb = new THREE.CanvasTexture(b);
  tb.wrapS = tb.wrapT = THREE.RepeatWrapping;
  tb.anisotropy = 8;
  return { map: srgb(t), bump: tb };
}

/* ---------- macro-variatie: sparge repetitia dalei ---------- */
function texMacro() {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const x = c.getContext("2d");
  x.fillStyle = "#808080";
  x.fillRect(0, 0, S, S);
  for (let i = 0; i < 70; i++) {
    const px = Math.random() * S, py = Math.random() * S;
    const rr = 26 + Math.random() * 78;
    const v = 60 + Math.random() * 140;
    const g = x.createRadialGradient(px, py, 0, px, py, rr);
    g.addColorStop(0, `rgba(${v},${v},${v},0.55)`);
    g.addColorStop(1, "rgba(128,128,128,0)");
    x.fillStyle = g;
    for (const dx of [-S, 0, S])
      for (const dy of [-S, 0, S]) {
        x.save();
        x.translate(dx, dy);
        x.fillStyle = g;
        x.fillRect(px - rr, py - rr, rr * 2, rr * 2);
        x.restore();
      }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/* ---------- solul: detaliu fin + macro + stingere spre orizont ---------- */
function faSol(latura, razaPlata) {
  const G = texGazon();
  const rep = latura / 12.0;
  G.map.repeat.set(rep, rep);
  G.bump.repeat.set(rep, rep);
  const mac = texMacro();

  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    // `map` trebuie sa existe ca three sa includa <map_fragment> in shader.
    // Nu e citit direct: codul de mai jos il inlocuieste cu dala rotita.
    map: G.map,
    bumpMap: G.bump,
    bumpScale: 0.12,
    roughness: 1,
    metalness: 0,
  });

  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uMacro = { value: mac };
    sh.uniforms.uDet = { value: G.map };

    // ATENTIE: uniformele si functiile NU se pun inaintea shaderului. Prefixul
    // three contine `precision`, iar orice `float` declarat mai devreme e
    // eroare de compilare — de aceea iesea o pata verde. Locul lor e dupa
    // <include common>, unde precizia e deja declarata.
    sh.vertexShader = sh.vertexShader.replace(
      "#include <common>",
      "#include <common>\n varying vec3 vWPos;"
    );
    sh.vertexShader = sh.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\n vWPos = (modelMatrix * vec4(transformed,1.0)).xyz;"
    );

    sh.fragmentShader = sh.fragmentShader.replace(
      "#include <common>",
      `#include <common>
       uniform sampler2D uMacro;
       uniform sampler2D uDet;
       varying vec3 vWPos;`
    );

    sh.fragmentShader = sh.fragmentShader.replace(
      "#include <map_fragment>",
      `vec2 wxz = vWPos.xz;
       float dOriz = length(wxz);

       // 1. DEFORMARE UV: coordonatele se deplaseaza cu un zgomot lent inainte
       //    de citire. Grila nu mai e dreapta nicaieri, deci nu exista aliniere
       //    de recunoscut. Spre deosebire de dalele rotite, deformarea e
       //    continua, deci nu apar cusaturi la marginea zonelor.
       vec2 wp  = (vec2(texture2D(uMacro, wxz * 0.0090).r,
                        texture2D(uMacro, wxz * 0.0090 + vec2(0.5)).r) - 0.5) * 3.4;
       vec2 wp2 = (vec2(texture2D(uMacro, wxz * 0.0031).r,
                        texture2D(uMacro, wxz * 0.0031 + vec2(0.5)).r) - 0.5) * 9.0;

       // 2. DOUA SCARI: dala de 12 m aproape, de 42 m departe. Perioadele nu
       //    se divid una pe alta, deci nu se pot suprapune.
       vec3 baza = texture2D(uDet, (wxz + wp) / 12.0).rgb;
       vec3 dep  = texture2D(uDet, (wxz + wp2) / 42.36).rgb;
       baza = mix(baza, dep, smoothstep(18.0, 80.0, dOriz));

       // 3. DOUA SCARI DE MACRO, la 33 m si 11 m, decalate. Cu una singura,
       //    dalele se realiniaza cu ea si grila reapare in departare.
       vec3 m1 = texture2D(uMacro, wxz * 0.03000).rgb;
       vec3 m2 = texture2D(uMacro, wxz * 0.09000 + vec2(0.37, 0.61)).rgb;
       baza *= (0.00 + m1 * 1.00) * (0.30 + m2 * 0.70);

       baza = mix(baza, vec3(0.575, 0.60, 0.545), smoothstep(45.0, 260.0, dOriz));
       diffuseColor.rgb *= baza;`
    );
    mat.userData.sh = sh;
  };

  // DENIVELARI. Un plan perfect orizontal nu poate avea relief: lumina cade
  // identic peste tot. Ridic terenul cu unde line, dar numai in afara curtii,
  // altfel casa, gardul si aleea ar ramane in aer.
  const geo = new THREE.PlaneGeometry(latura, latura, 160, 160);
  const po = geo.attributes.position;
  for (let i = 0; i < po.count; i++) {
    const px = po.getX(i), py = po.getY(i);
    const d = Math.hypot(px, py);
    const k = Math.min(1, Math.max(0, (d - razaPlata) / 45));
    const h =
      Math.sin(px * 0.035 + py * 0.021) * 1.35 +
      Math.sin(px * 0.011 - py * 0.017) * 2.4 +
      Math.sin(px * 0.083 + py * 0.061) * 0.42;
    po.setZ(i, h * k * k);
  }
  geo.computeVertexNormals();

  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.004;
  m.receiveShadow = true;
  return m;
}

/* ---------- generator de copac: intoarce ARRAYS, nu obiecte 3D ---------- */


/* ---------- specii si compozitie ---------- */


// Soarele: key la (L*1.7, ..., W*0.3) => elevatie ~34 grade, umbrele cad spre -X.
// De aceea masa e pe -X: acolo umbrele pleaca DE LA casa, nu peste acoperis.


/* ---------- iarba ---------- */


/* ---------- gard de casa: soclu + stalpi + sipca verticala ---------- */


/* ---------- mediu de reflexie ---------- */
let ENV = null;
function mediu(renderer) {
  if (ENV) return ENV;
  const ec = document.createElement("canvas");
  ec.width = 1024;
  ec.height = 512;
  const x = ec.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#79aed6");
  g.addColorStop(0.42, "#cfe0e9");
  g.addColorStop(0.5, "#e8e4d8");
  g.addColorStop(0.53, "#96a184");
  g.addColorStop(1, "#5d6752");
  x.fillStyle = g;
  x.fillRect(0, 0, 1024, 512);
  const sun = x.createRadialGradient(772, 148, 6, 772, 148, 130);
  sun.addColorStop(0, "rgba(255,247,226,1)");
  sun.addColorStop(0.35, "rgba(255,242,214,0.45)");
  sun.addColorStop(1, "rgba(255,242,214,0)");
  x.fillStyle = sun;
  x.fillRect(600, 0, 350, 300);
  for (let i = 0; i < 22; i++) {
    x.fillStyle = "rgba(255,255,255,0.16)";
    x.beginPath();
    x.ellipse(Math.random() * 1024, 60 + Math.random() * 150, 40 + Math.random() * 90, 9 + Math.random() * 16, 0, 0, 6.283);
    x.fill();
  }
  const t = new THREE.CanvasTexture(ec);
  t.mapping = THREE.EquirectangularReflectionMapping;
  try {
    const pm = new THREE.PMREMGenerator(renderer);
    pm.compileEquirectangularShader();
    ENV = pm.fromEquirectangular(t).texture;
    pm.dispose();
  } catch (err) {
    ENV = t;
  }
  return ENV;
}

/* ---------- cache ---------- */
let CACHE_COPACI = null;
let CACHE_IARBA = null;
let CACHE_GARD = null;
let TEX = null;

function texturi() {
  if (!TEX)
    TEX = {
      lat: texturaFrunza("lat", 131),
      ace: texturaFrunza("ace", 977),
      iarba: texIarba(),
      contact: texContact(),
    };
  return TEX;
}

/* ============================================================
   API
   ============================================================ */
export function adaugaGradina(scene, renderer, L, W, optiuni = {}) {
  const o = Object.assign(
    { copaci: true, iarba: true, gard: true, sol: true, densIarba: 9000, latSol: 400, envMap: true },
    optiuni
  );
  const T = texturi();
  const grup = new THREE.Group();
  grup.name = "gradina";

  if (o.envMap && renderer) scene.environment = mediu(renderer);

  /* --- solul --- */
  if (o.sol) grup.add(faSol(o.latSol, Math.max(L, W) / 2 + 20));

  /* --- copaci --- */
  if (o.copaci) {
    if (!CACHE_COPACI) {
      CACHE_COPACI = COMPOZITIE.map((c) => {
        const par = Object.assign({}, SPECII[c.specie]);
        par.inaltime *= c.scara;
        par.latime *= c.scara;
        par.grosime *= c.scara;
        par.marimeFrunza *= Math.sqrt(c.scara);
        // perspectiva aeriana falsa: ceata reala incepe la 55 m, deci nimic
        // din curte n-o atinge si scena s-ar aplatiza
        const d = Math.hypot(c.x, c.z);
        const cet = Math.min(0.28, Math.max(0, (d - 6) / 38));
        const cf = new THREE.Color(par.culoareFrunze).lerp(new THREE.Color("#e6eae7"), cet);
        return Object.assign({}, c, {
          date: generaCopac(par, c.seed),
          culoareFrunze: cf.getHex(),
          culoareTrunchi: new THREE.Color(par.culoareTrunchi).getHex(),
          razaDisc: SPECII[c.specie].latime * c.scara * 2.6,
        });
      });
    }

    for (const c of CACHE_COPACI) {
      const g = new THREE.Group();

      const gl = new THREE.BufferGeometry();
      gl.setAttribute("position", new THREE.BufferAttribute(c.date.lemn.pos, 3));
      gl.setAttribute("normal", new THREE.BufferAttribute(c.date.lemn.nor, 3));
      gl.setIndex(new THREE.BufferAttribute(c.date.lemn.idx, 1));
      const lemn = new THREE.Mesh(
        gl,
        new THREE.MeshStandardMaterial({ color: c.culoareTrunchi, roughness: 0.95 })
      );
      lemn.castShadow = true;
      lemn.receiveShadow = true;
      g.add(lemn);

      const gf = new THREE.BufferGeometry();
      gf.setAttribute("position", new THREE.BufferAttribute(c.date.frunze.pos, 3));
      gf.setAttribute("normal", new THREE.BufferAttribute(c.date.frunze.nor, 3));
      gf.setAttribute("uv", new THREE.BufferAttribute(c.date.frunze.uv, 2));
      gf.setAttribute("color", new THREE.BufferAttribute(c.date.frunze.col, 3));
      gf.setAttribute("aSway", new THREE.BufferAttribute(c.date.frunze.sw, 1));
      gf.setIndex(new THREE.BufferAttribute(c.date.frunze.idx, 1));
      const tex = c.date.ace ? T.ace : T.lat;
      const frunze = new THREE.Mesh(
        gf,
        cuVant(
          new THREE.MeshStandardMaterial({
            color: c.culoareFrunze,
            map: tex,
            alphaMap: tex,
            alphaTest: 0.4,
            side: THREE.DoubleSide,
            roughness: 0.92,
            vertexColors: true,
          }),
          0.05
        )
      );
      frunze.castShadow = true;
      frunze.receiveShadow = true;
      g.add(frunze);

      // disc de contact propriu: umbra generala a casei acopera doar L+5 x W+5
      const disc = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: T.contact, transparent: true, depthWrite: false, opacity: 0.7 })
      );
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = 0.03;
      disc.scale.set(c.razaDisc, c.razaDisc, 1);
      g.add(disc);

      g.position.set(c.x, 0, c.z);
      g.rotation.y = c.rot;
      grup.add(g);
    }
  }

  /* --- iarba --- */
  if (o.iarba) {
    const cheie = L + "x" + W + "x" + o.densIarba;
    if (!CACHE_IARBA || CACHE_IARBA.cheie !== cheie)
      CACHE_IARBA = { cheie, geo: geoIarba(L, W, o.densIarba, 4242) };
    const m = new THREE.Mesh(
      CACHE_IARBA.geo,
      cuVant(
        new THREE.MeshStandardMaterial({
          color: "#6f7f57",
          map: T.iarba,
          alphaMap: T.iarba,
          alphaTest: 0.35,
          side: THREE.DoubleSide,
          roughness: 1,
          vertexColors: true,
        }),
        0.075
      )
    );
    m.receiveShadow = true;
    grup.add(m);
  }
    
  // Adaugă flori
  if (o.flori !== false) {
    adaugaFlori(grup, L, W);
  }

  /* --- gard --- */
  if (o.gard) {
    const cheie = L + "x" + W;
    if (!CACHE_GARD || CACHE_GARD.cheie !== cheie) CACHE_GARD = { cheie, geo: geoGard(L, W, 88) };
    const pune = (geo, mat) => {
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      m.receiveShadow = true;
      grup.add(m);
    };
    pune(CACHE_GARD.geo.zid, new THREE.MeshStandardMaterial({ color: "#ebe5da", roughness: 0.9 }));
    pune(CACHE_GARD.geo.cap, new THREE.MeshStandardMaterial({ color: "#4a453e", roughness: 0.75 }));
    pune(CACHE_GARD.geo.sipci, new THREE.MeshStandardMaterial({ color: "#33352f", roughness: 0.42, metalness: 0.55 }));
  }

  scene.add(grup);
  pornesteCeasul();

  // Frustumul umbrelor din scena acopera doar +/-15 m, deci copacii de la
  // marginea curtii n-ar arunca nicio umbra. Il largim aici, ca sa nu fie
  // nevoie de nicio modificare in Scena3D.jsx.
  requestAnimationFrame(() => {
    scene.traverse((n) => {
      if (n.isDirectionalLight && n.castShadow && n.shadow) {
        const c = n.shadow.camera;
        const need = Math.max(L, W) * 1.5 + 18;
        if (c.right < need) {
          c.left = -need;
          c.right = need;
          c.top = need;
          c.bottom = -need;
          c.far = Math.max(c.far, 140);
          c.updateProjectionMatrix();
        }
      }
    });
  });

  return grup;
}

export { SPECII, COMPOZITIE };
