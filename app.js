const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");
const timeEl = document.getElementById("time");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const stateEl = document.getElementById("state");
const overlayEl = document.getElementById("overlay");
const resultTitleEl = document.getElementById("result-title");
const resultCauseEl = document.getElementById("result-cause");
const resultScoreEl = document.getElementById("result-score");
const retryHintEl = document.getElementById("retry-hint");
const reentryCueEl = document.getElementById("reentry-cue");
const liveCueEl = document.getElementById("live-cue");
const retryBtn = document.getElementById("retry");

const width = canvas.width;
const height = canvas.height;
const bestScoreKey = "dodge60-best-score";

const player = {
  x: width / 2,
  y: height - 72,
  w: 24,
  h: 24,
  speed: 245,
};

const state = {
  timer: 60,
  score: 0,
  bestScore: loadBestScore(),
  running: true,
  pendingResult: false,
  pendingClear: false,
  hitFlashTimer: 0,
  hitFlashDuration: 0.22,
  hazards: [],
  spawnCooldown: 0,
  graceTimer: 1.2,
  lastTs: 0,
  pointerActive: false,
  dragOffsetX: player.w / 2,
  dragOffsetY: player.h / 2,
  pointerStageX: null,
  pointerStageY: null,
  reentryCueTimer: null,
  liveCueTimer: null,
  liveCueAwaitingInput: false,
  liveCueMinVisibleTimer: 0,
};

const keys = new Set();

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D", " "].includes(event.key)) {
    event.preventDefault();
  }

  if (event.key === " " && !state.running) {
    resetGame(true);
    return;
  }

  keys.add(event.key.toLowerCase());
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

canvas.addEventListener("pointerdown", (event) => {
  state.pointerActive = true;
  canvas.setPointerCapture(event.pointerId);
  beginPointerDrag(event);
  movePlayerToPointer(event);
});

canvas.addEventListener("pointermove", (event) => {
  if (state.pointerActive) {
    movePlayerToPointer(event);
  }
});

canvas.addEventListener("pointerup", (event) => {
  state.pointerActive = false;
  state.pointerStageX = null;
  state.pointerStageY = null;
  canvas.releasePointerCapture(event.pointerId);
});

canvas.addEventListener("pointercancel", () => {
  state.pointerActive = false;
  state.pointerStageX = null;
  state.pointerStageY = null;
});

retryBtn.addEventListener("click", () => resetGame(true));

function loadBestScore() {
  try {
    return Number(window.localStorage.getItem(bestScoreKey) || 0);
  } catch {
    return 0;
  }
}

function saveBestScore(nextBest) {
  try {
    window.localStorage.setItem(bestScoreKey, String(nextBest));
  } catch {
    // Local play should still work even when storage is unavailable.
  }
}

function pointerToStage(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = width / rect.width;
  const scaleY = height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function updatePointerStage(event) {
  const stage = pointerToStage(event);
  state.pointerStageX = stage.x;
  state.pointerStageY = stage.y;
  return stage;
}

function beginPointerDrag(event) {
  const stage = updatePointerStage(event);
  const insidePlayer =
    stage.x >= player.x &&
    stage.x <= player.x + player.w &&
    stage.y >= player.y &&
    stage.y <= player.y + player.h;

  if (insidePlayer) {
    state.dragOffsetX = stage.x - player.x;
    state.dragOffsetY = stage.y - player.y;
    return;
  }

  // Outside touches use center grab so flick-to-dodge still feels responsive.
  state.dragOffsetX = player.w / 2;
  state.dragOffsetY = player.h / 2;
}

function movePlayerToPointer(event) {
  const stage = updatePointerStage(event);
  if (isInputLocked()) {
    return;
  }
  player.x = stage.x - state.dragOffsetX;
  player.y = stage.y - state.dragOffsetY;
  clampPlayer();
}

function applyHeldPointerAfterReady() {
  if (!state.pointerActive || state.pointerStageX === null || state.pointerStageY === null || isInputLocked()) {
    return;
  }
  player.x = state.pointerStageX - state.dragOffsetX;
  player.y = state.pointerStageY - state.dragOffsetY;
  clampPlayer();
}

function clampPlayer() {
  player.x = Math.max(0, Math.min(width - player.w, player.x));
  player.y = Math.max(0, Math.min(height - player.h, player.y));
}

function isInputLocked() {
  return state.running && state.graceTimer > 0;
}

function clearReentryCue() {
  if (state.reentryCueTimer) {
    window.clearTimeout(state.reentryCueTimer);
    state.reentryCueTimer = null;
  }
  reentryCueEl.classList.add("hidden");
  reentryCueEl.classList.remove("active");
  reentryCueEl.textContent = "";
}

function showReentryCue() {
  clearReentryCue();
  reentryCueEl.textContent = "New run started - controls unlock at LIVE";
  reentryCueEl.classList.remove("hidden");
  reentryCueEl.classList.add("active");
  const cueMs = Math.max(980, Math.ceil(state.graceTimer * 1000) + 240);
  state.reentryCueTimer = window.setTimeout(() => {
    clearReentryCue();
  }, cueMs);
}

function clearLiveCue() {
  if (state.liveCueTimer) {
    window.clearTimeout(state.liveCueTimer);
    state.liveCueTimer = null;
  }
  state.liveCueAwaitingInput = false;
  state.liveCueMinVisibleTimer = 0;
  liveCueEl.classList.add("hidden");
  liveCueEl.classList.remove("active");
  liveCueEl.textContent = "";
}

function showLiveCue() {
  clearLiveCue();
  liveCueEl.textContent = "LIVE - move now";
  state.liveCueAwaitingInput = true;
  state.liveCueMinVisibleTimer = 0.5;
  liveCueEl.classList.remove("hidden");
  liveCueEl.classList.add("active");
  state.liveCueTimer = window.setTimeout(() => {
    clearLiveCue();
  }, 1800);
}

function resetGame(fromRetry = false) {
  state.timer = 60;
  state.score = 0;
  state.running = true;
  state.pendingResult = false;
  state.pendingClear = false;
  state.hitFlashTimer = 0;
  state.hazards = [];
  state.spawnCooldown = 0;
  state.graceTimer = 1.2;
  state.lastTs = 0;
  state.pointerActive = false;
  state.pointerStageX = null;
  state.pointerStageY = null;
  keys.clear();
  player.x = width / 2;
  player.y = height - 72;
  overlayEl.classList.add("hidden");
  clearReentryCue();
  clearLiveCue();
  if (fromRetry) {
    showReentryCue();
  }
  render();
}

function spawnHazard() {
  const size = 18 + Math.random() * 24;
  state.hazards.push({
    x: Math.random() * (width - size),
    y: -size,
    w: size,
    h: size,
    speed: 120 + Math.random() * 190,
  });
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update(dt) {
  if (!state.running) {
    if (state.pendingResult) {
      state.hitFlashTimer = Math.max(0, state.hitFlashTimer - dt);
      if (state.hitFlashTimer <= 0) {
        showResult(state.pendingClear);
        state.pendingResult = false;
      }
    }
    return;
  }

  const wasInGrace = state.graceTimer > 0;
  state.graceTimer = Math.max(0, state.graceTimer - dt);
  if (wasInGrace && state.graceTimer <= 0) {
    clearReentryCue();
    showLiveCue();
  }

  // Keep the advertised 60-second run fair by starting timer/score after READY.
  if (!wasInGrace) {
    state.timer = Math.max(0, state.timer - dt);
    state.score += dt * 10;
  }

  const moveX = (keys.has("arrowright") || keys.has("d") ? 1 : 0) - (keys.has("arrowleft") || keys.has("a") ? 1 : 0);
  const moveY = (keys.has("arrowdown") || keys.has("s") ? 1 : 0) - (keys.has("arrowup") || keys.has("w") ? 1 : 0);

  if (state.graceTimer <= 0 && state.liveCueMinVisibleTimer > 0) {
    state.liveCueMinVisibleTimer = Math.max(0, state.liveCueMinVisibleTimer - dt);
  }

  if (
    state.graceTimer <= 0 &&
    state.liveCueAwaitingInput &&
    state.liveCueMinVisibleTimer <= 0 &&
    (moveX || moveY || state.pointerActive)
  ) {
    clearLiveCue();
  }

  if (state.graceTimer <= 0 && (moveX || moveY)) {
    player.x += moveX * player.speed * dt;
    player.y += moveY * player.speed * dt;
    clampPlayer();
  }

  applyHeldPointerAfterReady();

  const progress = 1 - state.timer / 60;
  if (state.graceTimer <= 0) {
    state.spawnCooldown -= dt;
    if (state.spawnCooldown <= 0) {
      spawnHazard();
      state.spawnCooldown = Math.max(0.14, 0.5 - progress * 0.34);
    }
  }

  const playerHitbox = { x: player.x, y: player.y, w: player.w, h: player.h };
  for (const hazard of state.hazards) {
    hazard.y += hazard.speed * dt * (1 + progress * 0.65);
    if (state.graceTimer <= 0 && intersects(playerHitbox, hazard)) {
      finish(false);
      return;
    }
  }

  state.hazards = state.hazards.filter((hazard) => hazard.y < height + hazard.h);

  if (state.timer <= 0) {
    finish(true);
  }
}

function finish(isClear) {
  state.running = false;
  const finalScore = Math.floor(state.score);
  if (finalScore > state.bestScore) {
    state.bestScore = finalScore;
    saveBestScore(finalScore);
  }

  if (!isClear) {
    state.pendingResult = true;
    state.pendingClear = false;
    state.hitFlashTimer = state.hitFlashDuration;
    return;
  }

  showResult(true);
}

function showResult(isClear) {
  const finalScore = Math.floor(state.score);
  resultTitleEl.textContent = isClear ? "Clear!" : "Game Over";
  resultCauseEl.className = `result-cause ${isClear ? "clear" : "hit"}`;
  resultCauseEl.textContent = isClear ? "Reason: Survived 60s" : "Reason: Hit by hazard";
  retryHintEl.textContent = isClear ? "Play again: Tap Retry or press Space" : "Quick restart: Tap Retry or press Space";
  resultScoreEl.textContent = `Score: ${finalScore}`;
  overlayEl.classList.remove("hidden");
  requestAnimationFrame(() => retryBtn.focus());
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#08131f");
  gradient.addColorStop(1, "#102336");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(139, 245, 200, 0.08)";
  ctx.lineWidth = 1;
  for (let y = 0; y <= height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawPlayer() {
  ctx.fillStyle = "#8bf5c8";
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.strokeStyle = "#f2f7fb";
  ctx.lineWidth = 2;
  ctx.strokeRect(player.x, player.y, player.w, player.h);
}

function drawHazards() {
  for (const hazard of state.hazards) {
    ctx.fillStyle = "#ff6f61";
    ctx.fillRect(hazard.x, hazard.y, hazard.w, hazard.h);
  }
}

function drawReadyBanner() {
  if (state.graceTimer <= 0 || !state.running) {
    return;
  }

  ctx.fillStyle = "rgba(8, 19, 31, 0.68)";
  ctx.fillRect(36, height * 0.42, width - 72, 64);
  ctx.strokeStyle = "rgba(139, 245, 200, 0.75)";
  ctx.lineWidth = 2;
  ctx.strokeRect(36, height * 0.42, width - 72, 64);

  ctx.fillStyle = "#8bf5c8";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 22px 'Franklin Gothic Medium', sans-serif";
  ctx.fillText("READY", width / 2, height * 0.42 + 32);
}

function drawHitFlash() {
  if (state.hitFlashTimer <= 0) {
    return;
  }

  const ratio = state.hitFlashTimer / state.hitFlashDuration;
  ctx.fillStyle = `rgba(255, 111, 97, ${0.28 * ratio})`;
  ctx.fillRect(0, 0, width, height);

  const pulse = 26 + (1 - ratio) * 70;
  const centerX = player.x + player.w / 2;
  const centerY = player.y + player.h / 2;
  const gradient = ctx.createRadialGradient(centerX, centerY, 8, centerX, centerY, pulse);
  gradient.addColorStop(0, `rgba(255, 255, 255, ${0.72 * ratio})`);
  gradient.addColorStop(1, "rgba(255, 111, 97, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulse, 0, Math.PI * 2);
  ctx.fill();
}

function render() {
  drawBackground();
  drawPlayer();
  drawHazards();
  drawReadyBanner();
  drawHitFlash();

  timeEl.textContent = state.timer.toFixed(1);
  scoreEl.textContent = Math.floor(state.score).toString();
  bestEl.textContent = state.bestScore.toString();
  if (!state.running) {
    stateEl.textContent = "RESULT";
  } else if (state.graceTimer > 0) {
    stateEl.textContent = `READY ${state.graceTimer.toFixed(1)}s`;
  } else {
    stateEl.textContent = "LIVE";
  }
}

function frame(ts) {
  if (!state.lastTs) {
    state.lastTs = ts;
  }

  const dt = Math.min(0.033, (ts - state.lastTs) / 1000);
  state.lastTs = ts;

  update(dt);
  render();
  requestAnimationFrame(frame);
}

resetGame();
requestAnimationFrame(frame);
