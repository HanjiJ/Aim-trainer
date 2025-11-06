const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width, height;
function resize() {
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
window.addEventListener('resize', resize);
resize();

const settings = {
  sensitivity: 1,
  smoothing: 0.1,
  crossSize: 24,
  targetSize: 28,
  spawnRate: 900,
  autoRespawn: true,
  reticleMode: 'cross'
};

let aim = { x: width / 2, y: height / 2 };
let aimTarget = { ...aim };
let targets = [];
let running = false;
let pointerLocked = false;
let score = 0, hits = 0, shots = 0;
let spawnTimer = null;

// === Elements ===
const el = id => document.getElementById(id);
const sensitivityEl = el('sensitivity');
const smoothingEl = el('smoothing');
const crossSizeEl = el('crossSize');
const targetSizeEl = el('targetSize');
const spawnRateEl = el('spawnRate');
const autoRespawnEl = el('autoRespawn');
const reticleModeEl = el('reticleMode');
const scoreEl = el('score');
const hitsEl = el('hits');
const shotsEl = el('shots');
const targetsCountEl = el('targetsCount');

// === Controls ===
el('startBtn').onclick = () => { if (!running) start(); };
el('stopBtn').onclick = stop;
el('resetBtn').onclick = resetSettings;

canvas.addEventListener('click', () => canvas.requestPointerLock());
document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === canvas;
  if (pointerLocked) aim = { x: width / 2, y: height / 2 };
});

document.addEventListener('mousemove', e => {
  if (pointerLocked) {
    aimTarget.x += e.movementX * settings.sensitivity;
    aimTarget.y += e.movementY * settings.sensitivity;
  }
});

canvas.addEventListener('mousedown', shoot);

function start() {
  running = true;
  score = hits = shots = 0;
  targets = [];
  restartSpawn();
  requestAnimationFrame(loop);
}

function stop() {
  running = false;
  if (spawnTimer) clearInterval(spawnTimer);
}

function resetSettings() {
  Object.assign(settings, {
    sensitivity: 1,
    smoothing: 0.1,
    crossSize: 24,
    targetSize: 28,
    spawnRate: 900,
    autoRespawn: true,
    reticleMode: 'cross'
  });
}

function spawnTarget() {
  const size = settings.targetSize;
  const x = Math.random() * (width - size) + size / 2;
  const y = Math.random() * (height - size) + size / 2;
  targets.push({ x, y, life: 3000, spawn: performance.now() });
  targetsCountEl.textContent = targets.length;
}

function restartSpawn() {
  if (spawnTimer) clearInterval(spawnTimer);
  if (settings.autoRespawn)
    spawnTimer = setInterval(spawnTarget, settings.spawnRate);
}

function shoot() {
  shots++;
  shotsEl.textContent = shots;
  for (let i = targets.length - 1; i >= 0; i--) {
    const t = targets[i];
    const d = Math.hypot(aim.x - t.x, aim.y - t.y);
    if (d <= settings.targetSize / 2) {
      hits++; score += 10;
      targets.splice(i, 1);
    }
  }
  hitsEl.textContent = hits;
  scoreEl.textContent = score;
  targetsCountEl.textContent = targets.length;
}

function update() {
  aim.x += (aimTarget.x - aim.x) * (1 - settings.smoothing);
  aim.y += (aimTarget.y - aim.y) * (1 - settings.smoothing);
  const now = performance.now();
  for (let i = targets.length - 1; i >= 0; i--) {
    if (now - targets[i].spawn > targets[i].life)
      targets.splice(i, 1);
  }
}

function draw(now) {
  ctx.clearRect(0, 0, width, height);
  // Targets
  for (const t of targets) {
    ctx.beginPath();
    ctx.arc(t.x, t.y, settings.targetSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
    ctx.fill();
  }
  // Crosshair
  ctx.save();
  ctx.translate(aim.x, aim.y);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  const s = settings.crossSize;
  if (settings.reticleMode !== 'dot') {
    ctx.beginPath();
    ctx.moveTo(-s, 0); ctx.lineTo(-4, 0);
    ctx.moveTo(4, 0); ctx.lineTo(s, 0);
    ctx.moveTo(0, -s); ctx.lineTo(0, -4);
    ctx.moveTo(0, 4); ctx.lineTo(0, s);
    ctx.stroke();
  }
  if (settings.reticleMode !== 'cross') {
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
  }
  ctx.restore();
}

function loop(t) {
  if (!running) return;
  update();
  draw(t);
  requestAnimationFrame(loop);
}
