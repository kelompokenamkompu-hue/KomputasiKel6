// ==========================================
// 1. SETUP KANVAS, VARIABEL GLOBAL & AUDIO
// ==========================================
const canvas = document.getElementById("c"); 
const ctx = canvas.getContext("2d");

// Kanvas terpisah untuk Gua (Cave)
let caveCanvas = document.createElement("canvas");
let caveCtx = caveCanvas.getContext("2d");

// Setup Audio
const bgMusic = new Audio("gelato.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.4; 

const bombSound = new Audio("meledak.mp3");
bombSound.volume = 0.8;

// State Game
let G = {
  score: 0,
  fishPopulation: 100,
  pollution: 0,
  time: 120,
  active: false,
  trashCaught: 0
};

// Variabel Lingkungan & Efek
let waveOffset = 0; 
let rayOffset = 0; 
let getSurfaceY = () => canvas.height * 0.25;

// Entitas Player & Objek
let P = { 
    x: window.innerWidth / 2, 
    hy: 0, 
    drop: false, 
    spd: 400,
    dir: 1 // 1 untuk kanan, -1 untuk kiri
}; 
let objs = [];
let bubbles = []; 
let planktons = []; 
let ftexts = []; 
let particles = []; 
let inventoryList = []; 
let spawnIv, timerIv, lastT = 0;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  caveCanvas.width = canvas.width;
  caveCanvas.height = canvas.height;
  prerenderCaveTexture(); 
}
window.addEventListener("resize", resize);

// ==========================================
// 2. DATABASE ASET (FAKTA IKAN UPDATE)
// ==========================================
const fishData = {
  "paus_biru.png": { name: "Paus Biru", w: 900, desc: "Mamalia laut raksasa penyaring makanan.", fact: "Lidahnya bisa seberat gajah dan jantungnya sebesar mobil!" },
  "hiu.png": { name: "Hiu Putih", w: 400, desc: "Predator puncak penjaga ekosistem laut.", fact: "Bisa mendeteksi setetes darah dalam 100 liter air." },
  "sword_fish.png": { name: "Ikan Todak", w: 250, desc: "Perenang cepat bermoncong pedang.", fact: "Kecepatan renangnya bisa mencapai 97 km/jam!" },
  "lumba2.png": { name: "Lumba-lumba", w: 200, desc: "Mamalia cerdas yang hidup berkelompok.", fact: "Mereka punya 'nama' berupa siulan unik untuk tiap individu." },
  "wolf_eel.png": { name: "Wolf Eel", w: 180, desc: "Ikan demersal berwajah garang.", fact: "Rahangnya sangat kuat hingga bisa meremukkan cangkang bulu babi." },
  "penyu.png": { name: "Penyu", w: 140, desc: "Reptil laut purba yang suka bermigrasi.", fact: "Bisa kembali ke pantai tempat mereka menetas puluhan tahun lalu." },
  "catshark.png": { name: "Catshark", w: 120, desc: "Hiu kecil penghuni dasar laut.", fact: "Beberapa spesies memiliki kulit yang bisa bercahaya dalam gelap (biofluoresensi)." },
  "gurita.png": { name: "Gurita", w: 110, desc: "Invertebrata sangat cerdas.", fact: "Memiliki 3 jantung, darah berwarna biru, dan tanpa tulang." },
  "angler_fish.png": { name: "Anglerfish", w: 100, desc: "Predator laut dalam yang menyeramkan.", fact: "Betina punya 'antena' bercahaya di kepalanya untuk memancing mangsa." },
  "jelly_fish.png": { name: "Ubur-ubur", w: 80, desc: "Hewan planktonik transparan.", fact: "95% tubuhnya adalah air; mereka tidak punya otak, jantung, maupun tulang." },
  "blobfish.png": { name: "Blobfish", w: 75, desc: "Ikan laut dalam bertubuh gelatin.", fact: "Tubuhnya melempem di permukaan, tapi normal di laut dalam yang bertekanan tinggi." },
  "viper_fish.png": { name: "Viperfish", w: 80, desc: "Monster kecil laut dalam.", fact: "Giginya sangat panjang sampai tidak muat di dalam mulutnya sendiri." },
  "teripang.png": { name: "Teripang", w: 65, desc: "Hewan pembersih dasar laut (Scavenger).", fact: "Jika terancam, mereka memuntahkan organ dalamnya untuk mengalihkan predator." },
  "crab.png": { name: "Kepiting", w: 60, desc: "Krustasea berjalan miring.", fact: "Perut mereka tersembunyi di bawah cangkang, dan 'gigi' mereka ada di dalam lambung!" },
  "seastar.png": { name: "Bintang Laut", w: 55, desc: "Echinodermata tanpa darah.", fact: "Bisa menumbuhkan kembali lengannya yang putus. Air laut berfungsi sebagai pengganti darahnya." },
  "star_fish.png": { name: "Starfish", w: 55, desc: "Bintang laut (Varian 2).", fact: "Beberapa spesies bisa membalikkan perutnya keluar mulut untuk mencerna mangsa." },
  "udang.png": { name: "Udang", w: 45, desc: "Krustasea kecil perenang mundur.", fact: "Jantung dan perut udang sebenarnya terletak di bagian kepalanya." }
};

const obstacleData = {
  "bangkai_kapal1.png": { type: "trash", w: 450 }, 
  "bangkai_kapal2.png": { type: "trash", w: 500 }, 
  "fishing_net.png": { type: "trash", w: 150 },    
  "botol_plastik1.png": { type: "trash", w: 25 },  
  "botol_plastik2.png": { type: "trash", w: 25 },
  "botol_plastik3.png": { type: "trash", w: 25 },
  "kaleng.png": { type: "trash", w: 25 },
  "batrai.png": { type: "trash", w: 20 },
  "lampu.png": { type: "trash", w: 25 },
  "organik1.png": { type: "trash", w: 30 }, 
  "organik2.png": { type: "trash", w: 25 }, 
  "organik3.png": { type: "trash", w: 35 }, 
  "organik4.png": { type: "trash", w: 20 }, 
  "organik5.png": { type: "trash", w: 25 }, 
  "kertas.png": { type: "trash", w: 25 },
  "kresek.png": { type: "trash", w: 35 },
  "bom.png": { type: "bomb", w: 45 } 
};

// ==========================================
// 3. SISTEM LOADING GAMBAR
// ==========================================
const fishImages = [];
const trashImages = [];
let bombImage = new Image();
let hookImage = new Image(); 
let shipImage = new Image();

const fishFiles = Object.keys(fishData);
const trashFiles = ["bangkai_kapal1.png", "bangkai_kapal2.png", "botol_plastik1.png", "botol_plastik2.png", "botol_plastik3.png", "fishing_net.png", "kaleng.png", "batrai.png", "lampu.png", "organik1.png", "organik2.png", "organik3.png", "organik4.png", "organik5.png", "kertas.png", "kresek.png"];
const TOTAL_ASSETS = fishFiles.length + trashFiles.length + 3;
let assetsProcessed = 0;

function handleAssetLoad() {
  assetsProcessed++;
  if (assetsProcessed === TOTAL_ASSETS) {
    resize();
    initWorld();
    const playBtn = document.querySelector(".play-btn");
    if(playBtn) playBtn.innerText = "MULAI BERMAIN";
  }
}

function loadImg(path, targetArray = null, fileName = null) {
  const img = new Image();
  img.onload = () => { if (targetArray) targetArray.push({ img: img, fileName: fileName }); handleAssetLoad(); };
  img.onerror = () => handleAssetLoad(); 
  img.src = path;
  return img;
}

fishFiles.forEach(f => loadImg("assets/" + f, fishImages, f));
trashFiles.forEach(f => loadImg("obstacle/" + f, trashImages, f));
bombImage = loadImg("obstacle/bom.png");
hookImage = loadImg("obstacle/hook.png");
shipImage = loadImg("assets/kapal.png");

// ==========================================
// 4. UI INVENTORY & HUD
// ==========================================
const invBtn = document.getElementById("inv-btn");
const invPanel = document.getElementById("inv-panel");

if(invBtn && invPanel) {
  invBtn.onclick = () => {
    invPanel.style.display = (invPanel.style.display === "none" || invPanel.style.display === "") ? "block" : "none";
  };
}

function addInventory(obj) {
  let fData = fishData[obj.fileName];
  inventoryList.push(fData);
  
  const item = document.createElement("div");
  item.className = "inv-item";
  item.innerHTML = `
    <div class="inv-name">🎣 ${fData.name}</div>
    <div class="inv-desc"><i>"${fData.desc}"</i></div>
    <div class="inv-fact"><b>Fakta:</b> ${fData.fact}</div>`;
  if(invPanel) invPanel.appendChild(item);
  ftext(P.x, P.hy, "-10 (Ikan!)", "#EF9A9A");
}

function ftext(x, y, txt, col) {
  ftexts.push({ x, y, txt, col, a: 1 });
}

function createExplosion(x, y) {
  for(let i=0; i<30; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
      r: Math.random() * 5 + 3,
      c: `hsl(${Math.random() * 40 + 10}, 100%, ${Math.random() * 30 + 50}%)`,
      a: 1, 
      l: Math.random() * 0.6 + 0.3 
    });
  }
}

function updateHUD() {
  const se = document.getElementById("sv-score");
  const fe = document.getElementById("sv-fish");
  const pe = document.getElementById("sv-poll");
  const ecoFill = document.getElementById("eco-fill");

  if(se) se.innerText = G.score;
  if(fe) fe.innerText = G.fishPopulation;
  if(pe) pe.innerText = G.pollution + "%";
  
  if(ecoFill) {
    let ecoHealth = 100 - G.pollution;
    ecoFill.style.width = Math.max(0, Math.min(100, ecoHealth)) + "%";
    ecoFill.style.background = ecoHealth < 30 ? "linear-gradient(90deg,#EF5350,#E53935)" : "linear-gradient(90deg,#4CAF50,#8BC34A)";
  }

  if (G.pollution >= 100 && G.active) {
    triggerGameOver("LAUTAN TERCEMAR!");
  }
}

function triggerGameOver(titleOverride = null) {
  G.active = false;
  bgMusic.pause(); 
  clearInterval(spawnIv); clearInterval(timerIv);
  
  document.getElementById("gameover").classList.remove("off");
  
  let title = titleOverride;
  if(!title) {
    title = G.score > 200 ? "LAUT BERSIH!" : "TERLALU BANYAK SAMPAH!";
  }
  document.getElementById("go-title").innerText = title;
  
  document.getElementById("go-rating").innerText = G.score > 300 ? "🌟🌟🌟" : (G.score > 100 ? "🌟🌟" : "🌟");
  document.getElementById("gf-score").innerText = G.score;
  document.getElementById("gf-fish").innerText = G.fishPopulation;
  document.getElementById("gf-poll").innerText = G.pollution;
  document.getElementById("gf-trash").innerText = G.trashCaught;
}

// ==========================================
// 5. INISIALISASI DUNIA & GUA
// ==========================================
function initWorld() {
  planktons = []; bubbles = []; objs = []; particles = []; ftexts = [];
  for(let i=0; i<150; i++) {
    planktons.push({
      x: Math.random() * window.innerWidth, y: getSurfaceY() + Math.random() * window.innerHeight,
      sz: Math.random() * 1.5 + 0.5, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5
    });
  }
  P.hy = getSurfaceY() + 40;
}

function drawCavePath(ctx) {
  ctx.beginPath();
  ctx.moveTo(0, canvas.height); ctx.lineTo(0, canvas.height - 180); 
  ctx.lineTo(canvas.width * 0.15, canvas.height - 230);
  ctx.lineTo(canvas.width * 0.3, canvas.height - 190);
  ctx.quadraticCurveTo(canvas.width * 0.45, canvas.height - 100, canvas.width * 0.6, canvas.height - 200);
  ctx.lineTo(canvas.width * 0.75, canvas.height - 150);
  ctx.arc(canvas.width / 2, canvas.height - 20, 100, 0, Math.PI, true);
  ctx.closePath();
  ctx.moveTo(canvas.width * 0.8, canvas.height); ctx.lineTo(canvas.width, canvas.height - 200); ctx.lineTo(canvas.width, canvas.height); ctx.closePath();
  ctx.moveTo(canvas.width / 2 + 100, canvas.height); ctx.lineTo(canvas.width / 2 - 100, canvas.height); ctx.closePath();
}

function prerenderCaveTexture() {
  caveCtx.clearRect(0, 0, caveCanvas.width, caveCanvas.height);
  drawCavePath(caveCtx);
  caveCtx.fillStyle = "#030a14"; caveCtx.fill("evenodd"); 
  caveCtx.globalCompositeOperation = "source-atop";
  for(let i = 0; i < 400; i++) {
    caveCtx.fillStyle = Math.random() > 0.5 ? "rgba(0, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.02)";
    caveCtx.beginPath(); caveCtx.arc(Math.random() * canvas.width, canvas.height - Math.random() * 300, Math.random() * 30 + 5, 0, Math.PI * 2); caveCtx.fill();
  }
  caveCtx.globalCompositeOperation = "source-over";
}

// ==========================================
// 6. SISTEM SPAWN OBJEK (RASIO DIUBAH)
// ==========================================
function spawn() {
  if (!G.active) return;
  let rand = Math.random(); let obj = null;

  // 40% Ikan, 60% Sampah/Bom (Sampah diperbanyak)
  if (rand < 0.4 && fishImages.length > 0) {
    let fDef = fishImages[Math.floor(Math.random() * fishImages.length)];
    let fData = fishData[fDef.fileName];
    let isLeft = Math.random() > 0.5;
    
    let speedMult = fData.w > 200 ? 0.3 : (fData.w < 50 ? 0.8 : 0.5);
    let baseSpeed = (0.2 + Math.random() * 0.3) * speedMult * 1.1; 
    let vx = (isLeft ? 1 : -1) * baseSpeed;
    
    let nW = fData.w; let nH = nW * (fDef.img.height / fDef.img.width);
    let minY = nW > 200 ? getSurfaceY() + 200 : getSurfaceY() + 80;

    obj = { 
      k: "fish", img: fDef.img, fileName: fDef.fileName, 
      x: isLeft ? -nW - 100 : canvas.width + 100, 
      y: Math.random() * (canvas.height * 0.4) + minY, 
      w: nW, h: nH, startY: 0, bs: baseSpeed, vx: vx, vy: 0, tvx: vx, tvy: 0, 
      timer: 0, wander: Math.random() * 150 + 200,
      swingY: Math.random() * Math.PI * 2, 
      swingSpd: Math.random() * 2 + 1 
    };
    obj.startY = obj.y;
  } else {
    // Dari 60% slot non-ikan, hanya 15% yang jadi bom (Bom diperdikit)
    let isBomb = Math.random() < 0.15; 
    let imgObj = isBomb ? null : (trashImages.length > 0 ? trashImages[Math.floor(Math.random() * trashImages.length)] : null);
    let wData = isBomb ? obstacleData["bom.png"] : (imgObj ? obstacleData[imgObj.fileName] : {w: 50});
    let nW = wData.w;
    let actImg = isBomb ? bombImage : (imgObj ? imgObj.img : null);
    let nH = (actImg && actImg.width > 0) ? nW * (actImg.height / actImg.width) : nW;

    obj = { 
      k: isBomb ? "bomb" : "trash", img: actImg, 
      x: Math.random() * (canvas.width - nW) + (nW/2), 
      y: getSurfaceY() + 10, w: nW, h: nH, vx: 0, 
      vy: nW > 150 ? (Math.random() * 0.5 + 0.5) : (Math.random() * 1.5 + 1.0),
      hasPolluted: false 
    };
  }
  if (obj) objs.push(obj);
}

// ==========================================
// 7. GAME LOGIC & UPDATE (PHYSICS)
// ==========================================
function update(dt) {
  if (!G.active) return;
  let sf = getSurfaceY();
  waveOffset += 0.8 * dt; rayOffset += 0.3 * dt;

  if (P.drop) { P.hy += 600 * dt; if (P.hy > canvas.height - 50) P.drop = false; } 
  else { if (P.hy > sf + 10) P.hy -= 900 * dt; }

  bubbles.forEach(b => b.y -= b.spd * dt * 60); bubbles = bubbles.filter(b => b.y > sf);
  planktons.forEach(p => { p.x += p.vx * dt * 60; p.y += p.vy * dt * 60; if(p.x < 0) p.x = canvas.width; if(p.x > canvas.width) p.x = 0; if(p.y < sf) p.y = canvas.height; if(p.y > canvas.height) p.y = sf; });
  ftexts.forEach(ft => { ft.y -= 1; ft.a -= 0.02; }); ftexts = ftexts.filter(ft => ft.a > 0);

  particles.forEach(p => {
    p.x += p.vx * dt * 60; p.y += p.vy * dt * 60;
    p.vy += 0.2; 
    p.l -= dt; p.a = p.l / 0.5; 
    p.r *= 0.98; 
  });
  particles = particles.filter(p => p.l > 0);

  objs.forEach(o => {
    if (o.k === "fish") {
      o.timer++;
      if (o.timer > o.wander) {
        o.timer = 0; o.wander = Math.random() * 150 + 200;
        let dirX = Math.sign(o.tvx); if (Math.random() < 0.2) dirX *= -1; 
        if (o.x > canvas.width + o.w + 100) dirX = -1; if (o.x < -o.w - 100) dirX = 1;
        o.tvx = dirX * (o.bs * (0.8 + Math.random() * 0.5)); o.tvy = (Math.random() - 0.5) * (o.bs * 0.5); 
        if (o.y > o.startY + 100) o.tvy = -Math.abs(o.tvy); if (o.y < o.startY - 100) o.tvy = Math.abs(o.tvy);
      }
      o.vx += (o.tvx - o.vx) * 0.01; o.vy += (o.tvy - o.vy) * 0.01;
      
      o.swingY += dt * o.swingSpd;
      o.x += o.vx * dt * 60; 
      o.y += (o.vy * dt * 60) + (Math.sin(o.swingY) * 1.5);

    } else {
      if (o.vy > 0) { 
        o.y += o.vy * dt * 60;
        caveCtx.save(); drawCavePath(caveCtx);
        if (caveCtx.isPointInPath(o.x + o.w / 2, o.y + o.h)) {
            o.vy = 0; 
            if ((o.k === "trash" || o.k === "bomb") && !o.hasPolluted) {
                o.hasPolluted = true;
                G.pollution = Math.min(100, G.pollution + 2); 
                updateHUD();
            }
        } 
        caveCtx.restore();
      }
    }
  });

  // Sistem Tabrakan
  objs = objs.filter(o => {
    const hit = P.x > o.x && P.x < o.x + o.w && P.hy > o.y && P.hy < o.y + o.h;
    if (hit) {
      if (o.k === "trash") { 
          G.score += 20; 
          G.pollution = Math.max(0, G.pollution - 5); 
          G.trashCaught++; 
          ftext(P.x, P.hy, "+20", "#4CAF50"); 
      }
      if (o.k === "fish") { 
          G.fishPopulation--; 
          G.score = Math.max(0, G.score - 10); 
          addInventory(o); 
      } 
      if (o.k === "bomb") { 
        G.score = Math.max(0, G.score - 50); 
        G.pollution = Math.min(100, G.pollution + 15); 
        ftext(P.x, P.hy, "-50💥", "#F44336");
        
        bombSound.currentTime = 0; 
        bombSound.play().catch(e => console.log("Gagal memutar:", e));
        createExplosion(P.x, P.hy);
      }
      P.drop = false; updateHUD(); return false; 
    }
    if (o.k === "fish" && (o.x > canvas.width + 1000 || o.x < -1000)) return false;
    return true; 
  });
}

// ==========================================
// 8. RENDERING VISUAL
// ==========================================
function drawGodRays(sf) {
  ctx.save(); ctx.globalCompositeOperation = "overlay"; ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  for(let i=0; i<5; i++) {
    ctx.beginPath(); let sx = (canvas.width / 5) * i + Math.sin(rayOffset + i) * 100;
    ctx.moveTo(sx, sf); ctx.lineTo(sx + 150, sf); ctx.lineTo(sx + 400 + Math.sin(rayOffset*0.5)*200, canvas.height); ctx.lineTo(sx - 100 + Math.sin(rayOffset*0.5)*200, canvas.height); ctx.fill();
  }
  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let sf = getSurfaceY();

  let sky = ctx.createLinearGradient(0, 0, 0, sf);
  sky.addColorStop(0, "#4a148c"); 
  sky.addColorStop(0.5, "#ff5722"); 
  sky.addColorStop(1, "#ffe082"); 
  ctx.fillStyle = sky; ctx.fillRect(0, 0, canvas.width, sf);

  let sW = 160; let sH = shipImage.complete && shipImage.width > 0 ? sW * (shipImage.height / shipImage.width) : 90;
  if (shipImage.complete && shipImage.width > 0) {
    let wy = Math.sin(P.x * 0.01 + waveOffset) * 5;
    ctx.save();
    ctx.translate(P.x, sf - sH + (sH * 0.4) + wy + (sH / 2));
    ctx.scale(P.dir, 1);
    ctx.drawImage(shipImage, -sW / 2, -sH / 2, sW, sH);
    ctx.restore();
  }

  let ocean = ctx.createLinearGradient(0, sf, 0, canvas.height);
  ocean.addColorStop(0, "#0a5d8a"); ocean.addColorStop(0.3, "#043759"); ocean.addColorStop(0.7, "#011626"); ocean.addColorStop(1, "#00050b");  
  ctx.fillStyle = ocean;
  ctx.beginPath(); ctx.moveTo(0, sf);
  for (let x = 0; x <= canvas.width; x += 20) ctx.lineTo(x, sf + Math.sin(x * 0.01 + waveOffset) * 5);
  ctx.lineTo(canvas.width, canvas.height); ctx.lineTo(0, canvas.height); ctx.fill();

  drawGodRays(sf);
  ctx.fillStyle = "rgba(255, 255, 255, 0.15)"; planktons.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, Math.PI*2); ctx.fill(); });
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)"; bubbles.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.sz, 0, Math.PI * 2); ctx.fill(); });

  ctx.drawImage(caveCanvas, 0, 0);

  ctx.save();
  particles.forEach(p => {
    ctx.globalAlpha = p.a;
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  ctx.strokeStyle = "rgba(150, 150, 150, 0.9)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(P.x, sf - 20); ctx.lineTo(P.x, P.hy); ctx.stroke();
  if (hookImage.complete && hookImage.width > 0) ctx.drawImage(hookImage, P.x - 17.5, P.hy, 35, 50);

  objs.forEach(o => {
    ctx.save(); ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
    if (o.k === "fish") { 
      let dir = o.vx >= 0 ? 1 : -1; 
      ctx.scale(dir, 1); 
      ctx.rotate(((o.vy * 60) + Math.sin(o.swingY)) * 0.5 * Math.PI / 180); 
    }
    let df = Math.max(0, (o.y - sf) / (canvas.height - sf)); ctx.globalAlpha = 1 - (df * 0.3); 
    if (o.img && o.img.complete && o.img.width > 0) ctx.drawImage(o.img, -o.w / 2, -o.h / 2, o.w, o.h);
    ctx.restore();
  });

  ftexts.forEach(ft => { ctx.fillStyle = ft.col || `rgba(255, 255, 255, ${ft.a})`; ctx.font = "bold 18px Nunito"; ctx.fillText(ft.txt, ft.x + 15, ft.y); });
}

// ==========================================
// 9. KONTROL & GAME LOOP
// ==========================================
const keys = {};
document.addEventListener("keydown", e => { keys[e.key] = true; if (e.key === " " && !P.drop && G.active) P.drop = true; });
document.addEventListener("keyup", e => keys[e.key] = false);

const btnL = document.getElementById("ml");
const btnR = document.getElementById("mr");
const btnC = document.getElementById("mc");

if(btnL) {
  btnL.addEventListener("touchstart", (e) => { e.preventDefault(); keys["ArrowLeft"] = true; });
  btnL.addEventListener("touchend", (e) => { e.preventDefault(); keys["ArrowLeft"] = false; });
}
if(btnR) {
  btnR.addEventListener("touchstart", (e) => { e.preventDefault(); keys["ArrowRight"] = true; });
  btnR.addEventListener("touchend", (e) => { e.preventDefault(); keys["ArrowRight"] = false; });
}
if(btnC) {
  btnC.addEventListener("touchstart", (e) => { e.preventDefault(); if (!P.drop && G.active) P.drop = true; });
}

window.startGame = function() {
  const menu = document.getElementById("menu");
  if(menu) menu.classList.add("off"); 
  initWorld(); 
  G.score = 0; G.pollution = 0; G.fishPopulation = 100; G.time = 120; G.trashCaught = 0;
  inventoryList = [];
  const invPanel = document.getElementById("inv-panel");
  if(invPanel) invPanel.innerHTML = ''; 
  G.active = true;
  updateHUD();
  
  bgMusic.play().catch(e => console.log("Gagal memutar backsound:", e));

  if(spawnIv) clearInterval(spawnIv);
  if(timerIv) clearInterval(timerIv);

  spawnIv = setInterval(spawn, 2000);
  
  timerIv = setInterval(() => {
    if (!G.active) return;
    G.time--;
    const tEl = document.getElementById("timer");
    if(tEl) {
      tEl.innerText = `${Math.floor(G.time / 60).toString().padStart(2, '0')}:${(G.time % 60).toString().padStart(2, '0')}`;
      if (G.time <= 10) tEl.classList.add("warn");
      else tEl.classList.remove("warn");
    }
    
    if (G.time <= 0) {
      triggerGameOver();
    }
  }, 1000);
};

window.resetGame = function() {
  location.reload();
};

function loop(now) {
  const dt = (now - lastT) / 1000; lastT = now;
  if (G.active) {
    if (keys["ArrowLeft"] && P.x > 50) { P.x -= P.spd * dt; P.dir = -1; }
    else if (keys["ArrowRight"] && P.x < canvas.width - 50) { P.x += P.spd * dt; P.dir = 1; }
  }
  update(dt || 0.016);
  render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);