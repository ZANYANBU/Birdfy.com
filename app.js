const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const modeDisplay = document.getElementById("modeDisplay");
const scoreDisplay = document.getElementById("scoreDisplay");
const bestDisplay = document.getElementById("bestDisplay");
const finalScoreText = document.getElementById("finalScoreText");
const comedyTicker = document.getElementById("comedyTicker");
const gameOverOverlay = document.getElementById("gameOverOverlay");

const startBtn = document.getElementById("startBtn");
const difficultyButtons = document.querySelectorAll(".seg-btn");
const restartBtn = document.getElementById("restartBtn");
const muteBtn = document.getElementById("muteBtn");
const gravitySlider = document.getElementById("gravitySlider");
const gravityValue = document.getElementById("gravityValue");

const chatLog = document.getElementById("chatLog");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const quickButtons = document.querySelectorAll(".quick-actions button");

const useLocalModel = document.getElementById("useLocalModel");
const endpointPreset = document.getElementById("endpointPreset");
const endpointInput = document.getElementById("endpointInput");
const modelInput = document.getElementById("modelInput");
const testModelBtn = document.getElementById("testModelBtn");
const modelStatus = document.getElementById("modelStatus");

const scoreHistory = document.getElementById("scoreHistory");
const resetScoresBtn = document.getElementById("resetScoresBtn");

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let audioEnabled = true;

const storageKey = "flappyProScoresV1";

const state = {
  difficulty: "medium",
  settings: null,
  gravityOverride: null,
  gameStarted: false,
  gameOver: false,
  score: 0,
  bestScore: 0,
  history: [],
};

const bird = {
  x: 120,
  y: 200,
  radius: 18,
  gravity: 0.6,
  lift: -11.5,
  velocity: 0,
  rotation: 0,
  flapPhase: 0,
};

const control = {
  lastFlapTime: 0,
  flapCooldown: 120,
  bufferMs: 140,
  buffered: false,
  bufferTime: 0,
};

let pipes = [];
let stars = [];
let trails = [];
let frameCount = 0;
let lastFrameTime = performance.now();
let comedyInterval = null;

const jokes = [
  "I tried to install wings—turns out they were just stickers.",
  "Hard mode? My bird calls it cardio mode.",
  "If you crash, blame the gravity firmware update.",
  "Pilot note: pipes are not friends. They are spicy walls.",
  "I asked the bird to hover. It responded with a free fall.",
  "We serve comedy between crashes to reduce anxiety output.",
  "Your score is like a comet—blink and it’s gone.",
];

const tips = {
  how: "Tap SPACE or UP to flap. Avoid pipes and the ceiling. The game starts when you flap.",
  tips: "Easy mode has a wider gap. Medium is balanced. Hard is fast and tight — use shorter taps.",
  controls: "SPACE/UP = flap, difficulty buttons = switch modes, ENTER = restart.",
  joke: () => pickRandom(jokes),
};

const difficulties = {
  easy: { gravity: 0.45, lift: -10.5, pipeGap: 230, pipeFreq: 125, pipeSpeed: 2.8 },
  medium: { gravity: 0.6, lift: -11.5, pipeGap: 200, pipeFreq: 110, pipeSpeed: 3.2 },
  hard: { gravity: 0.95, lift: -14.5, pipeGap: 155, pipeFreq: 80, pipeSpeed: 4.8 },
};

const comedyLines = [
  "Incoming transmission: The pipes are unionized.",
  "Sci‑fi tip: oxygen is overrated, altitude is mandatory.",
  "Warning: sarcasm detected at 1200 rpm.",
  "Pilot morale: 97% (remaining 3% is stuck in the pipe).",
  "Quantum tip: you both crashed and didn’t crash. Press restart anyway.",
];

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

function initStars() {
  const count = Math.floor(window.innerWidth / 10);
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: Math.random() * 1.8 + 0.5,
    speed: Math.random() * 0.6 + 0.2,
    alpha: Math.random() * 0.8 + 0.2,
  }));
}

function resetGame() {
  bird.y = window.innerHeight / 2;
  bird.velocity = 0;
  bird.rotation = 0;
  control.buffered = false;
  control.lastFlapTime = 0;
  pipes = [];
  trails = [];
  frameCount = 0;
  state.score = 0;
  state.gameOver = false;
  state.gameStarted = false;
  updateHUD();
  gameOverOverlay.classList.add("hidden");
  comedyTicker.textContent = "Systems online. Press SPACE to ignite.";
}

function applyDifficulty(difficulty) {
  state.difficulty = difficulty;
  state.settings = difficulties[difficulty];
  const baseGravity = state.settings.gravity;
  bird.gravity = state.gravityOverride ?? baseGravity;
  bird.lift = state.settings.lift;
  modeDisplay.textContent = `Mode: ${difficulty.toUpperCase()}`;
  comedyTicker.textContent = `Flight profile: ${difficulty.toUpperCase()}.`;
  difficultyButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.difficulty === difficulty);
  });
  gravitySlider.value = (state.gravityOverride ?? baseGravity).toFixed(2);
  gravityValue.textContent = gravitySlider.value;
}

function playNote(freq, type, duration) {
  if (!audioEnabled) return;
  if (audioCtx.state === "suspended") audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function doFlap() {
  bird.velocity = bird.velocity * 0.35 + bird.lift;
  bird.flapPhase = 0;
  addTrail();
  playNote(420, "square", 0.12);
  if (!state.gameStarted) {
    state.gameStarted = true;
    comedyTicker.textContent = "Engines online. Stay centered.";
  }
}

function requestFlap() {
  control.buffered = true;
  control.bufferTime = performance.now();
}

function addTrail() {
  for (let i = 0; i < 6; i++) {
    trails.push({
      x: bird.x - 10,
      y: bird.y + (Math.random() * 12 - 6),
      vx: -2 - Math.random() * 1.5,
      vy: (Math.random() - 0.5) * 0.6,
      life: 40 + Math.random() * 20,
    });
  }
}

function createPipe() {
  const gap = state.settings.pipeGap;
  const pipeWidth = 72;
  const topHeight = Math.random() * (window.innerHeight - gap - 200) + 80;
  pipes.push({ x: window.innerWidth + 40, topHeight, gap, width: pipeWidth, scored: false });
}

function checkCollision(pipe) {
  const topRect = { x: pipe.x, y: 0, w: pipe.width, h: pipe.topHeight };
  const bottomRect = {
    x: pipe.x,
    y: pipe.topHeight + pipe.gap,
    w: pipe.width,
    h: window.innerHeight - (pipe.topHeight + pipe.gap),
  };
  return rectCircleCollide(bird, topRect) || rectCircleCollide(bird, bottomRect);
}

function rectCircleCollide(circle, rect) {
  const distX = Math.abs(circle.x - rect.x - rect.w / 2);
  const distY = Math.abs(circle.y - rect.y - rect.h / 2);

  if (distX > rect.w / 2 + circle.radius) return false;
  if (distY > rect.h / 2 + circle.radius) return false;
  if (distX <= rect.w / 2) return true;
  if (distY <= rect.h / 2) return true;

  const dx = distX - rect.w / 2;
  const dy = distY - rect.h / 2;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

function update(delta) {
  const now = performance.now();

  if (control.buffered && now - control.bufferTime <= control.bufferMs) {
    if (now - control.lastFlapTime > control.flapCooldown) {
      control.lastFlapTime = now;
      control.buffered = false;
      doFlap();
    }
  } else if (control.buffered) {
    control.buffered = false;
  }

  if (!state.gameStarted || state.gameOver) return;

  bird.velocity += bird.gravity;
  bird.velocity *= 0.985;
  bird.y += bird.velocity;
  bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 3, bird.velocity * 0.04));
  bird.flapPhase += delta * 0.02;

  const pipeFreq = state.settings.pipeFreq;
  if (frameCount % pipeFreq === 0) createPipe();

  pipes.forEach((pipe) => {
    pipe.x -= state.settings.pipeSpeed;
    if (!pipe.scored && pipe.x + pipe.width < bird.x - bird.radius) {
      pipe.scored = true;
      state.score += 1;
      if (state.score > state.bestScore) {
        state.bestScore = state.score;
        updateHUD();
      }
      playNote(780, "sine", 0.1);
    }
  });

  pipes = pipes.filter((pipe) => pipe.x + pipe.width > -40);

  for (const pipe of pipes) {
    if (checkCollision(pipe)) {
      triggerGameOver();
      break;
    }
  }

  if (bird.y + bird.radius > window.innerHeight || bird.y - bird.radius < 0) {
    triggerGameOver();
  }

  trails.forEach((trail) => {
    trail.x += trail.vx;
    trail.y += trail.vy;
    trail.life -= 1.2;
  });
  trails = trails.filter((trail) => trail.life > 0);

  stars.forEach((star) => {
    star.x -= star.speed;
    if (star.x < -10) {
      star.x = window.innerWidth + 10;
      star.y = Math.random() * window.innerHeight;
    }
  });

  frameCount += 1;
  updateHUD();
}

function triggerGameOver() {
  if (state.gameOver) return;
  state.gameOver = true;
  playNote(150, "sawtooth", 0.5);
  finalScoreText.textContent = `Final Score: ${state.score}`;
  gameOverOverlay.classList.remove("hidden");
  saveScore(state.score);
  comedyTicker.textContent = pickRandom(comedyLines);
}

function updateHUD() {
  scoreDisplay.textContent = `Score: ${state.score}`;
  bestDisplay.textContent = `Best: ${state.bestScore}`;
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
  gradient.addColorStop(0, "#0b1b36");
  gradient.addColorStop(0.5, "#08121f");
  gradient.addColorStop(1, "#04060e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  ctx.save();
  ctx.fillStyle = "rgba(82, 240, 255, 0.6)";
  stars.forEach((star) => {
    ctx.globalAlpha = star.alpha;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(82, 240, 255, 0.1)";
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 120 + (frameCount % 120));
    ctx.lineTo(window.innerWidth, i * 120 + (frameCount % 120));
    ctx.stroke();
  }
  ctx.restore();
}

function drawPipes() {
  const isHard = state.difficulty === "hard";
  pipes.forEach((pipe) => {
    const glow = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
    glow.addColorStop(0, isHard ? "#ff5d9e" : "#2ee6ff");
    glow.addColorStop(1, "#6c3bff");
    ctx.fillStyle = glow;

    ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
    ctx.fillRect(pipe.x, pipe.topHeight + pipe.gap, pipe.width, window.innerHeight);

    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(pipe.x, 0, pipe.width, pipe.topHeight);
    ctx.strokeRect(pipe.x, pipe.topHeight + pipe.gap, pipe.width, window.innerHeight);
  });
}

function drawBird() {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  const bodyGradient = ctx.createLinearGradient(-20, -20, 25, 20);
  bodyGradient.addColorStop(0, "#f8fdff");
  bodyGradient.addColorStop(0.4, "#8bdcff");
  bodyGradient.addColorStop(1, "#4a62ff");

  ctx.shadowColor = "rgba(82,240,255,0.8)";
  ctx.shadowBlur = 18;

  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(10, -5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#03070f";
  ctx.beginPath();
  ctx.arc(12, -5, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f7b500";
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(30, 6);
  ctx.lineTo(18, 12);
  ctx.closePath();
  ctx.fill();

  const wingOffset = Math.sin(bird.flapPhase) * 6;
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.beginPath();
  ctx.ellipse(-10, wingOffset, 12, 6, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawTrails() {
  trails.forEach((trail) => {
    ctx.fillStyle = `rgba(82, 240, 255, ${trail.life / 60})`;
    ctx.beginPath();
    ctx.arc(trail.x, trail.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function draw() {
  drawBackground();
  drawTrails();
  drawPipes();
  drawBird();

  if (!state.gameStarted) {
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "bold 28px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Press SPACE or UP to Ignite", window.innerWidth / 2, window.innerHeight / 2);
  }
}

function animate() {
  const now = performance.now();
  const delta = now - lastFrameTime;
  lastFrameTime = now;
  update(delta);
  draw();
  requestAnimationFrame(animate);
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function scheduleComedy() {
  if (comedyInterval) clearInterval(comedyInterval);
  comedyInterval = setInterval(() => {
    if (!state.gameStarted || state.gameOver || Math.random() > 0.7) {
      const line = pickRandom(comedyLines);
      comedyTicker.textContent = line;
      addChatMessage("bot", line);
    }
  }, 15000);
}

function addChatMessage(role, text) {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = text;
  chatLog.appendChild(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function getLocalModelReply(prompt) {
  const endpoint = endpointInput.value.trim();
  const model = modelInput.value.trim();
  try {
    const isChatApi = endpoint.includes("/v1/") || endpointPreset.value === "lmstudio";
    const body = isChatApi
      ? {
          model,
          messages: [
            { role: "system", content: "You are a helpful game assistant. Answer concisely." },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 120,
        }
      : { model, prompt, stream: false };
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("Local model error");
    const data = await response.json();
    if (data.response) return data.response;
    if (data.choices && data.choices[0]) {
      return data.choices[0].message?.content || data.choices[0].text || "Model response empty.";
    }
    return "Model did not return a response.";
  } catch (err) {
    return "Local model unavailable. Using onboard humor instead.";
  }
}

async function testLocalModel() {
  modelStatus.textContent = "Testing...";
  modelStatus.classList.remove("ok", "bad");
  const reply = await getLocalModelReply("Reply with the word READY.");
  const success = reply && reply.toLowerCase().includes("ready");
  modelStatus.textContent = success ? "Ready" : "Unavailable";
  modelStatus.classList.toggle("ok", success);
  modelStatus.classList.toggle("bad", !success);
}

async function handleSend(text) {
  const message = text.trim();
  if (!message) return;
  addChatMessage("user", message);
  chatInput.value = "";

  let reply = "";
  if (useLocalModel.checked) {
    reply = await getLocalModelReply(`You are a helpful game assistant. Answer concisely.\nUser: ${message}`);
  } else {
    const key = Object.keys(tips).find((k) => message.toLowerCase().includes(k));
    const fallback = key ? tips[key] : pickRandom(jokes);
    reply = typeof fallback === "function" ? fallback() : fallback;
  }

  addChatMessage("bot", reply);
}

function saveScore(score) {
  const normalizedScore = Number(score) || 0;
  const entry = { score: normalizedScore, time: new Date().toLocaleString() };
  state.history.unshift(entry);
  state.history = state.history.slice(0, 6);
  state.bestScore = Math.max(Number(state.bestScore) || 0, normalizedScore);
  localStorage.setItem(storageKey, JSON.stringify({
    bestScore: state.bestScore,
    history: state.history,
  }));
  renderScoreHistory();
  updateHUD();
}

function loadScores() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    state.bestScore = Number(data.bestScore) || 0;
    state.history = Array.isArray(data.history) ? data.history : [];
  } catch (err) {
    state.bestScore = 0;
    state.history = [];
  }
  renderScoreHistory();
  updateHUD();
}

function renderScoreHistory() {
  scoreHistory.innerHTML = "";
  state.history.forEach((entry, index) => {
    const row = document.createElement("div");
    row.className = "score-item";
    row.innerHTML = `<span>#${index + 1} · ${entry.score}</span><span>${entry.time}</span>`;
    scoreHistory.appendChild(row);
  });
  bestDisplay.textContent = `Best: ${state.bestScore}`;
}

startBtn.addEventListener("click", () => {
  if (!state.gameStarted) {
    requestFlap();
  }
});

restartBtn.addEventListener("click", () => {
  resetGame();
});

muteBtn.addEventListener("click", () => {
  audioEnabled = !audioEnabled;
  muteBtn.textContent = `Audio: ${audioEnabled ? "On" : "Off"}`;
});

sendBtn.addEventListener("click", () => handleSend(chatInput.value));
chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") handleSend(chatInput.value);
});

quickButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.quick;
    const value = tips[key];
    const output = typeof value === "function" ? value() : value;
    handleSend(output);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.code === "ArrowUp" || event.code === "Space") {
    requestFlap();
  }
  if (state.gameOver && event.code === "Enter") {
    resetGame();
  }
});

difficultyButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    applyDifficulty(btn.dataset.difficulty);
    resetGame();
  });
});

gravitySlider.addEventListener("input", () => {
  const value = Number.parseFloat(gravitySlider.value);
  state.gravityOverride = value;
  bird.gravity = value;
  gravityValue.textContent = value.toFixed(2);
});

endpointPreset.addEventListener("change", () => {
  const preset = endpointPreset.value;
  if (preset === "ollama") {
    endpointInput.value = "http://localhost:11434/api/generate";
    modelInput.value = "deepseek-r1:1.5b";
  } else if (preset === "lmstudio") {
    endpointInput.value = "http://localhost:1234/v1/chat/completions";
    modelInput.value = "deepseek-r1-distill-qwen-1.5b";
  }
});

testModelBtn.addEventListener("click", () => {
  testLocalModel();
});

resetScoresBtn.addEventListener("click", () => {
  localStorage.removeItem(storageKey);
  state.bestScore = 0;
  state.history = [];
  renderScoreHistory();
  updateHUD();
});

window.addEventListener("resize", () => {
  resizeCanvas();
  initStars();
});

resizeCanvas();
initStars();
loadScores();
updateHUD();
resetGame();
applyDifficulty(state.difficulty);
scheduleComedy();
addChatMessage("bot", "Flight AI online. Ask me how to play or request a joke.");
animate();
