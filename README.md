# Configurator Acoperișuri 3D

Configurator web interactiv pentru acoperișuri: clientul își setează casa
(dimensiuni, pantă, tip, material), vede modelul 3D în timp real și primește
automat un deviz estimativ. Meșterul primește o cerere deja cuantificată.

## Stack
React + Vite + Three.js (randare 3D fără bibliotecă de scenă — geometrie proprie).

## Rulare
```bash
npm install
npm start      # dev, http://localhost:5173
npm run build  # producție → dist/
```

## Structura codului (lanțul viu)

```
src/main.jsx        → punctul de intrare React
  └─ App.jsx        → UI: panouri, sliders, estimare live, formular
       ├─ calcul.js → motorul de deviz (cantități din geometrie + preț)
       └─ Scena3D.jsx → randarea 3D a casei + acoperișului
            └─ gradina.js → peisajul activ (copaci, iarbă, texturi, vânt)

config/CONFIG.js    → toate datele de business (materiale, prețuri, limite)
```

**Un singur loc pentru fiecare responsabilitate:**
- vrei să schimbi un preț sau un material? → `config/CONFIG.js`
- logica de calcul a devizului? → `src/calcul.js`
- cum arată casa/acoperișul în 3D? → `src/Scena3D.jsx`
- copacii și mediul? → `src/gradina.js`
- interfața (butoane, panouri)? → `src/App.jsx`

## Module alternative (disponibile, neconectate)

`src/peisaj.js` + `src/texturi.js` sunt o refactorizare modulară a peisajului
(specii de copaci parametrice: fag, brad, plop, tufă; gard, flori; texturi
procedurale separate). Momentan lanțul viu folosește `gradina.js`. Pentru a
comuta pe versiunea modulară, în `Scena3D.jsx` se înlocuiește importul
`adaugaGradina` cu `adaugaPeisaj` din `peisaj.js`.

## extras/
`3d-preview.html` — un demo 3D standalone (HTML pur, fără build), util pentru
prototipare rapidă a scenei fără a porni React.
