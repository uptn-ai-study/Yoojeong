import { ICONS } from './icons.js';

const MAX_LEVEL = 30;
const RANKING_KEY = 'iconHunt_rankings';
const PLAYER_KEY = 'iconHunt_player';

const COLORS = [
  'Crimson', 'Golden', 'Azure', 'Emerald', 'Violet', 'Coral',
  'Indigo', 'Amber', 'Teal', 'Ruby', 'Silver', 'Jade', 'Scarlet', 'Ivory'
];

const ANIMALS = [
  'Wolf', 'Tiger', 'Panda', 'Eagle', 'Dolphin', 'Fox', 'Bear', 'Owl',
  'Rabbit', 'Lion', 'Hawk', 'Otter', 'Lynx', 'Falcon', 'Koala', 'Badger'
];

const state = {
  screen: 'intro',
  playerId: '',
  level: 1,
  totalScore: 0,
  levelScore: 0,
  timeLeft: 0,
  timerId: null,
  targetIcons: [],
  foundTargetCount: 0,
  placedIcons: [],
  gameActive: false,
  levelStartTime: 0,
  moveIntervalId: null,
  blinkIntervalId: null,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generatePlayerId() {
  return randomPick(COLORS) + randomPick(ANIMALS);
}

function iconPath(name) {
  return `icons/${name}.svg`;
}

function getLevelConfig(level) {
  const t = (level - 1) / (MAX_LEVEL - 1);
  const targetCount = Math.min(20, Math.max(1, Math.round(1 + (level - 1) * 19 / (MAX_LEVEL - 1))));
  return {
    targetCount,
    timeLimit: Math.round(35 - t * 12) + (targetCount - 1) * 4,
    iconCount: Math.round(25 + t * 50) + targetCount * 3,
    rotationEnabled: level >= 4,
    maxRotation: level >= 4 ? Math.round(60 + t * 300) : 0,
    bgScale: level >= 8 ? 1.2 + t * 2.2 : 1,
    targetScale: level >= 8 ? Math.max(0.18, 1 - t * 0.82) : 1,
    decoyCount: level >= 12 ? Math.min(6, Math.floor((level - 11) / 3)) : 0,
    movementEnabled: level >= 6,
    moveSpeed: level >= 6 ? 0.6 + t * 2.2 : 0,
    blinkEnabled: level >= 10,
    blinkCycleMs: level >= 10 ? Math.round(2600 - t * 1100) : 0,
    blinkHideMs: level >= 10 ? Math.round(650 - t * 220) : 0,
    blinkRatio: level >= 10 ? 0.28 + t * 0.42 : 0,
    baseScore: 100 + level * 50,
    timeBonusRate: 8 + Math.floor(level / 3),
  };
}

function getPlayerData() {
  try {
    const raw = localStorage.getItem(PLAYER_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.id) return null;
    return { id: data.id, bestScore: data.bestScore ?? 0 };
  } catch {
    return null;
  }
}

function savePlayerData(id, bestScore) {
  localStorage.setItem(PLAYER_KEY, JSON.stringify({ id, bestScore }));
}

function deletePlayerData(id) {
  const targetId = id || getPlayerData()?.id;
  localStorage.removeItem(PLAYER_KEY);
  if (targetId) {
    const rankings = getRankings().filter((r) => r.id !== targetId);
    localStorage.setItem(RANKING_KEY, JSON.stringify(rankings));
  }
}

function savePlayerBest(score) {
  const data = getPlayerData();
  if (!data || data.id !== state.playerId) return;
  if (score > data.bestScore) {
    savePlayerData(state.playerId, score);
  }
}

function loadPlayer() {
  const raw = localStorage.getItem(PLAYER_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.id) {
        state.playerId = parsed.id;
        if (typeof parsed.bestScore !== 'number') {
          const rankings = getRankings().filter((r) => r.id === parsed.id);
          const best = rankings.length ? Math.max(...rankings.map((r) => r.score)) : 0;
          savePlayerData(parsed.id, best);
        }
        return false;
      }
    } catch {
      /* fall through */
    }
  }
  state.playerId = generatePlayerId();
  savePlayerData(state.playerId, 0);
  return true;
}

function getRankings() {
  try {
    return JSON.parse(localStorage.getItem(RANKING_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRanking(score) {
  savePlayerBest(score);

  const rankings = getRankings();
  const existing = rankings.findIndex((r) => r.id === state.playerId);
  const entry = { id: state.playerId, score, date: Date.now() };

  if (existing >= 0) {
    if (score > rankings[existing].score) rankings[existing] = entry;
  } else {
    rankings.push(entry);
  }

  rankings.sort((a, b) => b.score - a.score);
  localStorage.setItem(RANKING_KEY, JSON.stringify(rankings.slice(0, 100)));
  return rankings;
}

function getPlayerRank(score) {
  const sorted = [...getRankings()].sort((a, b) => b.score - a.score);
  const idx = sorted.findIndex((r) => r.id === state.playerId);
  if (idx >= 0) return idx + 1;
  const higher = sorted.filter((r) => r.score > score).length;
  return higher + 1;
}

function getBestScore() {
  const data = getPlayerData();
  if (!data || data.id !== state.playerId) return 0;
  return data.bestScore;
}

function showScreen(name) {
  state.screen = name;
  $$('.screen').forEach((el) => el.classList.remove('active'));
  $(`#${name}-screen`).classList.add('active');
}

function openOverlay(id) {
  const el = $(id);
  el.classList.add('open');
  requestAnimationFrame(() => el.classList.add('open'));
}

function closeOverlay(id) {
  $(id).classList.remove('open');
}

function openBottomSheet() {
  $('#sheet-best').textContent = getBestScore().toLocaleString();
  renderRankingList('#ranking-list');
  requestAnimationFrame(() => $('#ranking-sheet').classList.add('open'));
}

function closeBottomSheet() {
  $('#ranking-sheet').classList.remove('open');
}

function renderRankingList(containerSel, highlightId) {
  const container = $(containerSel);
  const rankings = getRankings().sort((a, b) => b.score - a.score).slice(0, 10);

  if (!rankings.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-text">아직 랭킹이 없습니다</div>
      </div>`;
    return;
  }

  container.innerHTML = rankings.map((r, i) => `
    <div class="rank-item${r.id === (highlightId || state.playerId) ? ' me' : ''}">
      <div class="rank-position">${i + 1}</div>
      <div class="rank-info">
        <div class="rank-name">${r.id}</div>
      </div>
      <div class="rank-score">${r.score.toLocaleString()}</div>
    </div>
  `).join('');
}

function populateIntroPattern() {
  const sample = shuffle(ICONS).slice(0, 40);
  ['#intro-pattern-top', '#intro-pattern-bottom'].forEach((sel, idx) => {
    const el = $(sel);
    const icons = idx === 1 ? [...sample].reverse() : sample;
    el.innerHTML = icons.map((name) =>
      `<img src="${iconPath(name)}" alt="" draggable="false">`
    ).join('');
  });
}

function updateHUD() {
  $('#hud-level').textContent = state.level;
  $('#hud-score').textContent = state.totalScore.toLocaleString();
  $('#hud-timer').textContent = state.timeLeft;
  $('#hud-timer').classList.toggle('timer-warning', state.timeLeft <= 10);
  $('#hud-player-id').textContent = state.playerId;
  updateTargetPreview();
}

function updateTargetPreview() {
  const total = state.targetIcons.length;
  const found = state.foundTargetCount;
  $('#target-progress').textContent = `${found}/${total}`;

  const list = $('#target-preview-list');
  list.className = 'target-preview-list';
  if (total > 12) list.classList.add('count-high');
  else if (total > 6) list.classList.add('count-mid');

  const foundNames = state.placedIcons
    .filter((icon) => icon.isTarget && icon.found)
    .map((icon) => icon.name);

  list.innerHTML = state.targetIcons.map((name) => {
    const countNeeded = state.targetIcons.filter((n) => n === name).length;
    const countFound = foundNames.filter((n) => n === name).length;
    const isFound = countFound >= countNeeded;
    return `
      <div class="target-preview-item${isFound ? ' found' : ''}">
        <img src="${iconPath(name)}" alt="">
      </div>`;
  }).join('');
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function placeIconsWithCollision(areaW, areaH, icons) {
  const placed = [];
  const maxAttempts = 80;

  for (const icon of icons) {
    let placed_ok = false;
    const half = icon.size / 2;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = half + Math.random() * (areaW - icon.size);
      const y = half + Math.random() * (areaH - icon.size);
      const minDist = icon.size * 0.55;

      const collision = placed.some((p) =>
        distance(x, y, p.x, p.y) < minDist + p.size * 0.55
      );

      if (!collision) {
        placed.push({ ...icon, x, y });
        placed_ok = true;
        break;
      }
    }

    if (!placed_ok) {
      const x = half + Math.random() * (areaW - icon.size);
      const y = half + Math.random() * (areaH - icon.size);
      placed.push({ ...icon, x, y });
    }
  }

  return placed;
}

function initIconVelocity(icon, speed) {
  const angle = Math.random() * Math.PI * 2;
  icon.vx = Math.cos(angle) * speed;
  icon.vy = Math.sin(angle) * speed;
}

function stopIconDynamics() {
  clearInterval(state.moveIntervalId);
  clearInterval(state.blinkIntervalId);
  state.moveIntervalId = null;
  state.blinkIntervalId = null;
}

function tickMovement() {
  if (!state.gameActive) return;

  const area = $('#play-area');
  const areaW = area.clientWidth;
  const areaH = area.clientHeight;

  state.placedIcons.forEach((icon, idx) => {
    if (icon.found || icon.hidden) return;

    icon.x += icon.vx;
    icon.y += icon.vy;

    const half = icon.size / 2;
    if (icon.x - half < 0) { icon.x = half; icon.vx *= -1; }
    if (icon.x + half > areaW) { icon.x = areaW - half; icon.vx *= -1; }
    if (icon.y - half < 0) { icon.y = half; icon.vy *= -1; }
    if (icon.y + half > areaH) { icon.y = areaH - half; icon.vy *= -1; }

    const el = document.querySelector(`.game-icon[data-idx="${idx}"]`);
    if (el) {
      el.style.left = `${icon.x - half}px`;
      el.style.top = `${icon.y - half}px`;
    }
  });
}

function runBlinkCycle() {
  if (!state.gameActive) return;

  const config = getLevelConfig(state.level);
  if (!config.blinkEnabled) return;

  const candidates = state.placedIcons
    .map((icon, idx) => ({ icon, idx }))
    .filter(({ icon }) => !icon.found && !icon.hidden);

  const count = Math.max(1, Math.ceil(candidates.length * config.blinkRatio));
  const picked = shuffle(candidates).slice(0, count);

  picked.forEach(({ icon, idx }) => {
    icon.hidden = true;
    const el = document.querySelector(`.game-icon[data-idx="${idx}"]`);
    if (el) el.classList.add('icon-hidden');
  });

  setTimeout(() => {
    if (!state.gameActive) return;
    picked.forEach(({ icon, idx }) => {
      if (icon.found) return;
      icon.hidden = false;
      const el = document.querySelector(`.game-icon[data-idx="${idx}"]`);
      if (el) el.classList.remove('icon-hidden');
    });
  }, config.blinkHideMs);
}

function startIconDynamics(config) {
  stopIconDynamics();

  if (config.movementEnabled) {
    state.placedIcons.forEach((icon) => {
      if (!icon.found) initIconVelocity(icon, config.moveSpeed);
    });
    state.moveIntervalId = setInterval(tickMovement, 50);
  }

  if (config.blinkEnabled) {
    state.blinkIntervalId = setInterval(runBlinkCycle, config.blinkCycleMs);
  }
}

function pickTargetIcons(count) {
  return shuffle(ICONS).slice(0, count);
}

function buildLevelIcons(config) {
  const baseSize = 32;
  const bgSize = baseSize * config.bgScale;
  const targetSize = baseSize * config.targetScale;
  const targetSet = new Set(state.targetIcons);

  const fillerPool = shuffle(ICONS.filter((i) => !targetSet.has(i)));
  const fillers = [];

  for (let i = 0; i < config.iconCount; i++) {
    fillers.push(fillerPool[i % fillerPool.length]);
  }

  const icons = fillers.map((name) => ({
    name,
    size: bgSize,
    rotation: config.rotationEnabled
      ? Math.random() * config.maxRotation * (Math.random() > 0.5 ? 1 : -1)
      : 0,
    isTarget: false,
    isDecoy: false,
  }));

  state.targetIcons.forEach((name) => {
    icons.push({
      name,
      size: targetSize,
      rotation: config.rotationEnabled
        ? Math.random() * config.maxRotation * (Math.random() > 0.5 ? 1 : -1)
        : 0,
      isTarget: true,
      isDecoy: false,
      found: false,
    });
  });

  for (let d = 0; d < config.decoyCount; d++) {
    icons.push({
      name: randomPick(state.targetIcons),
      size: bgSize * (0.7 + Math.random() * 0.5),
      rotation: config.rotationEnabled
        ? Math.random() * config.maxRotation * (Math.random() > 0.5 ? 1 : -1)
        : 0,
      isTarget: false,
      isDecoy: true,
    });
  }

  return shuffle(icons);
}

function renderPlayArea() {
  stopIconDynamics();
  const area = $('#play-area');
  area.innerHTML = '';
  const config = getLevelConfig(state.level);
  const areaW = area.clientWidth;
  const areaH = area.clientHeight;

  const iconData = buildLevelIcons(config);
  state.placedIcons = placeIconsWithCollision(areaW, areaH, iconData);

  state.placedIcons.forEach((icon, idx) => {
    const el = document.createElement('div');
    el.className = 'game-icon';
    el.dataset.idx = idx;
    el.style.width = `${icon.size}px`;
    el.style.height = `${icon.size}px`;
    el.style.left = `${icon.x - icon.size / 2}px`;
    el.style.top = `${icon.y - icon.size / 2}px`;
    el.style.setProperty('--rot', `${icon.rotation}deg`);
    el.style.transform = `rotate(${icon.rotation}deg)`;

    const img = document.createElement('img');
    img.src = iconPath(icon.name);
    img.alt = '';
    img.draggable = false;
    el.appendChild(img);

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      handleIconClick(idx);
    });

    area.appendChild(el);
  });

  if (state.gameActive) startIconDynamics(config);
}

function startLevel() {
  const config = getLevelConfig(state.level);
  state.targetIcons = pickTargetIcons(config.targetCount);
  state.foundTargetCount = 0;
  state.timeLeft = config.timeLimit;
  state.levelStartTime = Date.now();
  state.gameActive = true;
  state.levelScore = 0;

  updateHUD();
  renderPlayArea();

  clearInterval(state.timerId);
  state.timerId = setInterval(() => {
    state.timeLeft--;
    updateHUD();
    if (state.timeLeft <= 0) {
      handleTimeUp();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timerId);
  state.timerId = null;
  state.gameActive = false;
  stopIconDynamics();
}

function handleIconClick(idx) {
  if (!state.gameActive) return;

  const icon = state.placedIcons[idx];
  if (icon.hidden) return;

  const el = $(`.game-icon[data-idx="${idx}"]`);

  if (icon.isTarget && !icon.found) {
    icon.vx = 0;
    icon.vy = 0;
    icon.found = true;
    state.foundTargetCount++;
    el.classList.add('found', 'found-gold');

    const img = el.querySelector('img');
    img.style.filter = 'brightness(0) saturate(100%) invert(48%) sepia(90%) saturate(1500%) hue-rotate(10deg)';

    updateHUD();

    const config = getLevelConfig(state.level);
    const allFound = state.foundTargetCount >= config.targetCount;

    if (allFound) {
      stopTimer();
      const timeBonus = state.timeLeft * config.timeBonusRate;
      state.levelScore = config.baseScore + timeBonus;
      state.totalScore += state.levelScore;
      setTimeout(() => showLevelClear(timeBonus, config.baseScore), 300);
    }
  } else if (!icon.isTarget) {
    const area = $('#play-area');
    area.classList.add('wrong-flash');
    setTimeout(() => area.classList.remove('wrong-flash'), 300);
    state.timeLeft = Math.max(0, state.timeLeft - 2);
    updateHUD();
    if (state.timeLeft <= 0) handleTimeUp();
  }
}

function handleTimeUp() {
  stopTimer();
  $('#timeup-msg').textContent = `레벨 ${state.level} 시간 초과! 다시 도전해보세요.`;
  openOverlay('#timeup-overlay');
}

function showLevelClear(timeBonus, baseScore) {
  saveRanking(state.totalScore);
  const rank = getPlayerRank(state.totalScore);
  const config = getLevelConfig(state.level);

  $('#clear-level').textContent = state.level;
  $('#clear-targets').textContent = `${config.targetCount}개`;
  $('#clear-base').textContent = baseScore.toLocaleString();
  $('#clear-time').textContent = timeBonus.toLocaleString();
  $('#clear-total-level').textContent = state.levelScore.toLocaleString();
  $('#clear-total').textContent = state.totalScore.toLocaleString();
  $('#clear-rank').textContent = rank <= 10 ? `${rank}위` : `${rank}위`;
  $('#clear-rank-sub').textContent = rank <= 10
    ? 'TOP 10 안에 들었습니다!'
    : 'TOP 10 진입을 노려보세요!';

  renderRankingList('#clear-ranking-preview', state.playerId);

  const isAllClear = state.level >= MAX_LEVEL;
  $('#clear-title').innerHTML = isAllClear
    ? '🎉 올클리어!'
    : `레벨 <span id="clear-level">${state.level}</span> 클리어!`;
  $('#btn-next-level').textContent = isAllClear ? '결과 보기' : '점수 확인';

  openOverlay('#clear-overlay');
}

function startGame() {
  state.level = 1;
  state.totalScore = 0;
  showScreen('game');
  updateHUD();
  startLevel();
}

function nextLevel() {
  closeOverlay('#clear-overlay');
  if (state.level >= MAX_LEVEL) {
    showCredits();
    return;
  }
  state.level++;
  updateHUD();
  startLevel();
}

function retryLevel() {
  closeOverlay('#timeup-overlay');
  startLevel();
}

function showCredits() {
  closeOverlay('#clear-overlay');
  saveRanking(state.totalScore);
  savePlayerBest(state.totalScore);
  const rank = getPlayerRank(state.totalScore);
  $('#credits-final-score').textContent = state.totalScore.toLocaleString();
  $('#credits-player').textContent = state.playerId;
  $('#credits-rank').textContent = `${rank}위`;
  showScreen('credits');
}

function exitGame() {
  stopIconDynamics();
  stopTimer();
  closeOverlay('#exit-overlay');
  closeOverlay('#clear-overlay');
  closeOverlay('#timeup-overlay');
  closeBottomSheet();
  if (state.totalScore > 0) saveRanking(state.totalScore);
  state.level = 1;
  state.totalScore = 0;
  state.gameActive = false;
  showScreen('intro');
  populateIntroPattern();
}

function init() {
  populateIntroPattern();
  const isNew = loadPlayer();

  $('#btn-guide').addEventListener('click', () => openOverlay('#guide-overlay'));
  $('#btn-guide-ok').addEventListener('click', () => closeOverlay('#guide-overlay'));

  $('#btn-start').addEventListener('click', () => {
    if (isNew) {
      $('#welcome-id').textContent = state.playerId;
      openOverlay('#welcome-overlay');
    } else {
      startGame();
    }
  });

  $('#btn-welcome-ok').addEventListener('click', () => {
    closeOverlay('#welcome-overlay');
    startGame();
  });

  $('#btn-exit').addEventListener('click', () => openOverlay('#exit-overlay'));
  $('#btn-exit-cancel').addEventListener('click', () => closeOverlay('#exit-overlay'));
  $('#btn-exit-confirm').addEventListener('click', exitGame);

  $('#btn-ranking').addEventListener('click', openBottomSheet);
  $('#btn-ranking-close').addEventListener('click', closeBottomSheet);
  $('#ranking-sheet').addEventListener('click', (e) => {
    if (e.target === $('#ranking-sheet')) closeBottomSheet();
  });

  $('#btn-next-level').addEventListener('click', nextLevel);
  $('#btn-retry').addEventListener('click', retryLevel);
  $('#btn-credits-home').addEventListener('click', () => {
    showScreen('intro');
    populateIntroPattern();
  });

  window.addEventListener('resize', () => {
    if (state.screen === 'game' && state.gameActive && state.foundTargetCount === 0) {
      renderPlayArea();
    }
  });

  showScreen('intro');

  if (window.location.hash === '#allclear') {
    state.playerId = getPlayerData()?.id || 'GoldenTiger';
    state.totalScore = 52800;
    showCredits();
  }
}

init();
