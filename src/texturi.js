// texturi.js - funcții pentru generarea texturilor
import * as THREE from "three";

// Generează textură de pavaj (piatră cubică cu rosturi)
export function texPavaj() {
  const S = 512;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  
  // Fundal gri-piatră
  const baseColor = [195, 185, 175];
  ctx.fillStyle = `rgb(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]})`;
  ctx.fillRect(0, 0, S, S);
  
  // Dimensiunea dalei în pixeli
  const tileSize = 64;
  const gap = 3;
  
  // Desenează dalele cu variație de culoare și textură
  for (let y = 0; y < S; y += tileSize) {
    for (let x = 0; x < S; x += tileSize) {
      // Offset pentru aspect natural (rosturi decalate)
      const offsetX = (Math.floor(y / tileSize) % 2) * (tileSize / 2);
      const startX = x + offsetX;
      
      // Variație de culoare pentru fiecare dală
      const variation = (Math.random() - 0.5) * 20;
      const r = Math.max(0, Math.min(255, baseColor[0] + variation));
      const g = Math.max(0, Math.min(255, baseColor[1] + variation * 1.1));
      const b = Math.max(0, Math.min(255, baseColor[2] + variation * 0.9));
      ctx.fillStyle = `rgb(${r|0}, ${g|0}, ${b|0})`;
      
      // Desenează dala cu colțuri ușor rotunjite
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
      
      // Adaugă textură fină (granulație) pe dală
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
  
  // Adaugă rosturile (linii întunecate între dale)
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
