"use strict";

const $ = (id) => document.getElementById(id);
const canvas = $("gameCanvas");
const ctx = canvas.getContext("2d");
const miniCtx = $("miniMap").getContext("2d");

const UI = {
  loader: $("gameLoader"),
  loaderProgress: $("loaderProgress"),
  loaderPercent: $("loaderPercent"),
  loaderStatus: $("loaderStatus"),
  start: $("startScreen"),
  pause: $("pauseScreen"),
  over: $("gameOverScreen"),
  startBtn: $("startButton"),
  resumeBtn: $("resumeButton"),
  restartBtn: $("restartButton"),
  pauseBtn: $("pauseButton"),
  soundBtn: $("soundButton"),
  healthFill: $("healthFill"),
  healthText: $("healthText"),
  armorText: $("armorText"),
  ammoText: $("ammoText"),
  reloadBar: $("reloadBar"),
  reloadProgress: $("reloadProgress"),
  kills: $("killsText"),
  score: $("scoreText"),
  wave: $("waveText"),
  best: $("highScoreText"),
  finalScore: $("finalScore"),
  finalKills: $("finalKills"),
  finalWave: $("finalWave"),
  finalBest: $("finalBest"),
  damageFlash: $("damageFlash"),
  waveBanner: $("waveBanner"),
  waveBannerNumber: $("waveBannerNumber"),
  joystickArea: $("joystickArea"),
  joystickStick: $("joystickStick"),
  shootBtn: $("shootButton"),
  reloadBtn: $("reloadButton"),
  crosshair: $("crosshair"),
  fullscreenBtn: $("fullscreenButton"),
  weaponName: $("weaponName"),
  reserveAmmoText: $("reserveAmmoText"),
  coins: $("coinsText"),
  miniMap: $("miniMap"),
  bossBar: $("bossBar"),
  bossFill: $("bossFill"),
  weaponBtn: $("weaponButton"),
  waveComplete: $("waveCompleteScreen"),
  completeWave: $("completeWave"),
  completeKills: $("completeKills"),
  completeCoins: $("completeCoins"),
  completeScore: $("completeScore"),
  continueWaveBtn: $("continueWaveButton"),
  openShopBtn: $("openShopButton"),
  shop: $("shopScreen"),
  shopCoins: $("shopCoins"),
  closeShopBtn: $("closeShopButton"),
  inventory: $("inventoryScreen"),
  inventoryGrid: $("inventoryGrid"),
  closeInventoryBtn: $("closeInventoryButton"),
  useItemBtn: $("useItemButton"),
  selectedItemName: $("selectedItemName"),
  selectedItemDescription: $("selectedItemDescription"),
  interactPrompt: $("interactPrompt"),
  interactText: $("interactText"),
  missionText: $("missionText"),
  inventoryBtn: $("inventoryButton"),
  interactBtn: $("interactButton")
};

const WORLD = { w: 3200, h: 2400 };
const WEAPONS = {
  pistol: {
    name: "PISTOL",
    mag: 12,
    fireDelay: 0.19,
    reload: 1.05,
    speed: 950,
    damage: 1,
    pellets: 1,
    spread: 0.015,
    shake: 5,
    color: "#ffd85c"
  },
  smg: {
    name: "SMG",
    mag: 28,
    fireDelay: 0.075,
    reload: 1.35,
    speed: 900,
    damage: 0.72,
    pellets: 1,
    spread: 0.055,
    shake: 3.5,
    color: "#9fe9ff"
  },
  shotgun: {
    name: "SHOTGUN",
    mag: 6,
    fireDelay: 0.65,
    reload: 1.7,
    speed: 820,
    damage: 0.8,
    pellets: 7,
    spread: 0.23,
    shake: 12,
    color: "#ffb25c"
  }
};

let currentWeapon = "pistol";
let weaponAmmo = {
  pistol: WEAPONS.pistol.mag,
  smg: WEAPONS.smg.mag,
  shotgun: WEAPONS.shotgun.mag
};

let running = false;
let paused = false;
let lastTime = 0;
let raf = 0;
let kills = 0;
let score = 0;
let wave = 1;
let lastWaveShown = 0;
let spawnTimer = 0;
let spawnDelay = 1.2;
let bullets = [];
let zombies = [];
let particles = [];
let buildings = [];
let decor = [];
let pickups = [];
let ammo = weaponAmmo[currentWeapon];
let coins = Number(localStorage.getItem("potaraZombieCoins") || 0);
let reloading = false;
let reloadTimer = 0;
let fireCooldown = 0;
let muzzleFlash = 0;
let shake = 0;
let fogTime = 0;
let mouseX = 0;
let mouseY = 0;
let soundEnabled = true;
let audioCtx = null;
let pointerLocked = false;
let virtualMouseX = innerWidth / 2;
let virtualMouseY = innerHeight / 2;
let highScore = Number(localStorage.getItem("potaraZombieV2Best") || 0);
let waveKills = 0;
let waveCoins = 0;
let waveBreakActive = false;
let nextWaveKillTarget = 12;
let bossAttackTimer = 0;
let inventoryOpen = false;
let selectedInventoryItem = null;
let interior = null;
let outsidePosition = null;
let nearbyInteraction = null;
let buildingsSearched = 0;

const inventory = JSON.parse(
  localStorage.getItem("potaraZombieInventory") ||
  JSON.stringify({
    medkit: 1,
    bandage: 2,
    armor: 0,
    food: 1,
    ammo: 2,
    key: 0
  })
);

const ITEM_DATA = {
  medkit: {
    name: "MEDKIT",
    icon: "🧰",
    description: "Restores 50 health.",
    usable: true
  },
  bandage: {
    name: "BANDAGE",
    icon: "🩹",
    description: "Restores 20 health.",
    usable: true
  },
  armor: {
    name: "ARMOR PLATE",
    icon: "🛡️",
    description: "Adds 25 armor.",
    usable: true
  },
  food: {
    name: "FOOD",
    icon: "🥫",
    description: "Restores 10 health.",
    usable: true
  },
  ammo: {
    name: "AMMO BOX",
    icon: "📦",
    description: "Refills all weapon magazines.",
    usable: true
  },
  key: {
    name: "CITY KEY",
    icon: "🗝️",
    description: "A mysterious key found inside the infected city.",
    usable: false
  }
};

const upgrades = JSON.parse(
  localStorage.getItem("potaraZombieUpgrades") ||
  JSON.stringify({
    pistolDamage: 1,
    smgRate: 1,
    shotgunPower: 1,
    maxHealth: 1,
    armor: 0,
    speed: 1
  })
);

const keys = {};
const camera = { x: 0, y: 0, tx: 0, ty: 0, sx: 0, sy: 0 };
const joystick = { active: false, id: null, x: 0, y: 0 };
const player = {
  x: WORLD.w / 2,
  y: WORLD.h / 2,
  r: 23,
  speed: 285,
  health: 100,
  maxHealth: 100,
  armor: 0,
  aim: 0,
  walk: 0
};

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function isMobile() {
  return matchMedia("(pointer: coarse)").matches || innerWidth <= 900;
}

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cameraInstant();
  draw();
}
addEventListener("resize", resize);

function worldToScreen(x, y) {
  return { x: x - camera.x + camera.sx, y: y - camera.y + camera.sy };
}
function screenToWorld(x, y) {
  return { x: x + camera.x - camera.sx, y: y + camera.y - camera.sy };
}
function visible(x, y, margin = 180) {
  const p = worldToScreen(x, y);
  return p.x > -margin && p.x < innerWidth + margin && p.y > -margin && p.y < innerHeight + margin;
}

/* Loader */
const loadMessages = [
  "Preparing weapons...",
  "Generating abandoned city...",
  "Releasing zombie infection...",
  "Activating camera systems...",
  "Mission ready!"
];

function startLoader() {
  let value = 0;
  const timer = setInterval(() => {
    value = Math.min(100, value + Math.floor(Math.random() * 9) + 5);
    UI.loaderProgress.style.width = value + "%";
    UI.loaderPercent.textContent = value + "%";
    UI.loaderStatus.textContent = loadMessages[Math.min(loadMessages.length - 1, Math.floor(value / 21))];

    if (value >= 100) {
      clearInterval(timer);
      setTimeout(() => {
        UI.loader.classList.add("hide");
        setTimeout(() => UI.loader.style.display = "none", 850);
      }, 500);
    }
  }, 120);
}
addEventListener("load", () => setTimeout(startLoader, 250));

/* World */
function insideBuilding(x, y, pad = 0) {
  return buildings.some(b => x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad);
}

function safePosition(margin = 45) {
  for (let i = 0; i < 120; i++) {
    const x = margin + Math.random() * (WORLD.w - margin * 2);
    const y = margin + Math.random() * (WORLD.h - margin * 2);
    if (!insideBuilding(x, y, margin) && Math.hypot(x - WORLD.w / 2, y - WORLD.h / 2) > 260) {
      return { x, y };
    }
  }
  return { x: 100, y: 100 };
}

function createWorld() {
  buildings = [
    {x:150,y:170,w:420,h:300,h3:75},{x:820,y:120,w:380,h:260,h3:60},
    {x:1450,y:170,w:500,h:310,h3:85},{x:2320,y:140,w:500,h:340,h3:70},
    {x:180,y:850,w:470,h:350,h3:65},{x:2500,y:840,w:470,h:340,h3:80},
    {x:220,y:1760,w:450,h:350,h3:75},{x:980,y:1890,w:440,h:280,h3:62},
    {x:1710,y:1810,w:510,h:320,h3:88},{x:2550,y:1740,w:400,h:350,h3:68}
  ];

  buildings.forEach((building, index) => {
    building.id = index;
    building.type =
      index % 4 === 0 ? "hospital" :
      index % 4 === 1 ? "house" :
      index % 4 === 2 ? "store" : "police";
    building.doorX = building.x + building.w / 2;
    building.doorY = building.y + building.h + 18;
    building.searched = false;
  });

  decor = [];
  for (let i = 0; i < 85; i++) {
    const p = safePosition(55);
    decor.push({ type: "tree", x: p.x, y: p.y, r: 24 + Math.random() * 18, h: 40 + Math.random() * 24, shade: Math.random() });
  }
  for (let i = 0; i < 60; i++) {
    const p = safePosition(35);
    decor.push({ type: "rock", x: p.x, y: p.y, r: 12 + Math.random() * 18, rot: Math.random() * Math.PI });
  }
  for (let i = 0; i < 32; i++) {
    const p = safePosition(30);
    decor.push({ type: "barrel", x: p.x, y: p.y, r: 15, explosive: Math.random() > .35, health: 2, exploded: false });
  }
}

function collideBuildings(entity, ox, oy, radius) {
  for (const b of buildings) {
    const cx = clamp(entity.x, b.x, b.x + b.w);
    const cy = clamp(entity.y, b.y, b.y + b.h);
    const dx = entity.x - cx;
    const dy = entity.y - cy;
    if (dx * dx + dy * dy < radius * radius) {
      entity.x = ox;
      entity.y = oy;
      return;
    }
  }
}


/* Fullscreen helper */
async function enterFullscreen() {
  try {
    const target = document.documentElement;

    if (!document.fullscreenElement && target.requestFullscreen) {
      await target.requestFullscreen();
    }

    if (
      screen.orientation &&
      screen.orientation.lock &&
      isMobile()
    ) {
      try {
        await screen.orientation.lock("landscape");
      } catch (_) {
        // Some browsers allow orientation lock only in installed apps/fullscreen.
      }
    }

    setTimeout(resize, 100);
  } catch (error) {
    console.warn("Fullscreen could not start:", error);
  }
}

if (UI.fullscreenBtn) {
  UI.fullscreenBtn.addEventListener("click", enterFullscreen);
}

document.addEventListener("fullscreenchange", () => {
  setTimeout(resize, 100);
});

/* Start/pause */
function resetGame() {
  kills = 0;
  score = 0;
  wave = 1;
  lastWaveShown = 0;
  spawnTimer = 0;
  spawnDelay = 1.2;
  bullets = [];
  zombies = [];
  particles = [];
  pickups = [];
  weaponAmmo = {
    pistol: WEAPONS.pistol.mag,
    smg: WEAPONS.smg.mag,
    shotgun: WEAPONS.shotgun.mag
  };
  currentWeapon = "pistol";
  ammo = weaponAmmo[currentWeapon];
  reloading = false;
  reloadTimer = 0;
  fireCooldown = 0;
  muzzleFlash = 0;
  shake = 0;
  player.x = WORLD.w / 2;
  player.y = WORLD.h / 2;
  player.maxHealth = 100 + (upgrades.maxHealth - 1) * 15;
  player.speed = 285 + (upgrades.speed - 1) * 18;
  player.health = player.maxHealth;
  player.armor = upgrades.armor * 12;
  player.aim = 0;
  player.walk = 0;
  waveKills = 0;
  waveCoins = 0;
  waveBreakActive = false;
  nextWaveKillTarget = 12;
  bossAttackTimer = 0;
  inventoryOpen = false;
  interior = null;
  outsidePosition = null;
  nearbyInteraction = null;
  buildingsSearched = 0;
  UI.inventory.classList.add("hidden");
  createWorld();
  cameraInstant();
  updateUI();
}

function startGame() {
  cancelAnimationFrame(raf);
  resetGame();
  running = true;
  paused = false;
  UI.start.style.display = "none";
  UI.pause.classList.add("hidden");
  UI.over.classList.add("hidden");
  showWave(1);
  lastTime = performance.now();
  raf = requestAnimationFrame(loop);

  if (!isMobile()) {
    setTimeout(lockMouse, 60);
  }
}

function pauseGame(shouldUnlock = true) {
  if (!running || paused) return;
  paused = true;

  if (shouldUnlock) {
    unlockMouse();
  }

  UI.pause.classList.remove("hidden");
}
function resumeGame() {
  if (!running || !paused) return;
  paused = false;
  UI.pause.classList.add("hidden");
  lastTime = performance.now();
  raf = requestAnimationFrame(loop);

  if (!isMobile()) {
    setTimeout(lockMouse, 60);
  }
}

UI.startBtn.addEventListener("click", async () => {
  if (isMobile() && !document.fullscreenElement) {
    await enterFullscreen();
  }

  startGame();
});
UI.restartBtn.addEventListener("click", startGame);
UI.resumeBtn.addEventListener("click", resumeGame);
UI.pauseBtn.addEventListener("click", () => paused ? resumeGame() : pauseGame(true));

/* Input */
addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.code === "Space") {
    e.preventDefault();
    shoot();
  }
  if (e.key.toLowerCase() === "r") startReload();

  if (e.key.toLowerCase() === "e") {
    interact();
  }

  if (e.key === "Tab" || e.key.toLowerCase() === "i") {
    e.preventDefault();
    toggleInventory();
  }
});
addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

canvas.addEventListener("mousemove", (e) => {
  if (pointerLocked) {
    virtualMouseX = clamp(virtualMouseX + e.movementX, 0, innerWidth);
    virtualMouseY = clamp(virtualMouseY + e.movementY, 0, innerHeight);
    mouseX = virtualMouseX;
    mouseY = virtualMouseY;
  } else {
    mouseX = e.clientX;
    mouseY = e.clientY;
    virtualMouseX = mouseX;
    virtualMouseY = mouseY;
  }

  const m = screenToWorld(mouseX, mouseY);
  player.aim = Math.atan2(m.y - player.y, m.x - player.x);
});

canvas.addEventListener("mousedown", (e) => {
  if (!running || paused) return;

  if (!isMobile() && !pointerLocked) {
    lockMouse();
    return;
  }

  if (e.button === 0) {
    shoot();
  }
});


/* Pointer lock — PC only */
function lockMouse() {
  if (!running || paused || isMobile() || document.pointerLockElement === canvas) {
    return;
  }

  virtualMouseX = innerWidth / 2;
  virtualMouseY = innerHeight / 2;
  canvas.requestPointerLock();
}

function unlockMouse() {
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }
}

document.addEventListener("pointerlockchange", () => {
  pointerLocked = document.pointerLockElement === canvas;
  document.body.classList.toggle("pointer-locked", pointerLocked);

  if (!pointerLocked && running && !paused && !inventoryOpen && !isMobile()) {
    pauseGame(false);
  }
});

document.addEventListener("pointerlockerror", () => {
  pointerLocked = false;
  document.body.classList.remove("pointer-locked");
  console.warn("Mouse lock could not start.");
});

/* Joystick */
UI.joystickArea.addEventListener("pointerdown", (e) => {
  joystick.active = true;
  joystick.id = e.pointerId;
  UI.joystickArea.setPointerCapture(e.pointerId);
  updateJoystick(e);
});
UI.joystickArea.addEventListener("pointermove", (e) => {
  if (joystick.active && e.pointerId === joystick.id) updateJoystick(e);
});
UI.joystickArea.addEventListener("pointerup", stopJoystick);
UI.joystickArea.addEventListener("pointercancel", stopJoystick);

function updateJoystick(e) {
  const base = UI.joystickArea.querySelector(".joystick-base");
  const rect = base.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = e.clientX - cx;
  let dy = e.clientY - cy;
  const max = rect.width / 2 - 24;
  const d = Math.hypot(dx, dy);
  if (d > max) {
    dx = dx / d * max;
    dy = dy / d * max;
  }
  joystick.x = dx / max;
  joystick.y = dy / max;
  UI.joystickStick.style.transform = `translate(${dx}px,${dy}px)`;
}

function stopJoystick(e = {}) {
  if (e.pointerId !== undefined && e.pointerId !== joystick.id) return;
  joystick.active = false;
  joystick.id = null;
  joystick.x = 0;
  joystick.y = 0;
  UI.joystickStick.style.transform = "translate(0,0)";
}

let shootInterval = 0;
UI.shootBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  shoot();
  clearInterval(shootInterval);
  shootInterval = setInterval(shoot, WEAPONS[currentWeapon].fireDelay * 1000);
});
["pointerup","pointercancel","pointerleave"].forEach(type => UI.shootBtn.addEventListener(type, () => clearInterval(shootInterval)));
UI.reloadBtn.addEventListener("click", startReload);


/* Weapon system */
function selectWeapon(name) {
  if (!WEAPONS[name] || reloading) return;

  weaponAmmo[currentWeapon] = ammo;
  currentWeapon = name;
  ammo = weaponAmmo[currentWeapon];

  document.querySelectorAll(".weapon-slot").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.weapon === currentWeapon
    );
  });

  updateUI();
  beep(420, .08, "square", .025);
}

document.querySelectorAll(".weapon-slot").forEach((button) => {
  button.addEventListener("click", () => {
    selectWeapon(button.dataset.weapon);
  });
});

addEventListener("keydown", (event) => {
  if (event.key === "1") selectWeapon("pistol");
  if (event.key === "2") selectWeapon("smg");
  if (event.key === "3") selectWeapon("shotgun");
});

if (UI.weaponBtn) {
  UI.weaponBtn.addEventListener("click", () => {
    const order = ["pistol", "smg", "shotgun"];
    const next = order[(order.indexOf(currentWeapon) + 1) % order.length];
    selectWeapon(next);
  });
}


/* Inventory + interaction */
UI.inventoryBtn.addEventListener("click", toggleInventory);
UI.interactBtn.addEventListener("click", interact);
UI.closeInventoryBtn.addEventListener("click", closeInventory);
UI.useItemBtn.addEventListener("click", useSelectedItem);

function saveInventory() {
  localStorage.setItem("potaraZombieInventory", JSON.stringify(inventory));
}

function toggleInventory() {
  if (!running || UI.shop && !UI.shop.classList.contains("hidden")) return;

  if (inventoryOpen) {
    closeInventory();
  } else {
    openInventory();
  }
}

function openInventory() {
  if (!running || paused && !waveBreakActive) return;

  inventoryOpen = true;
  paused = true;
  unlockMouse();
  renderInventory();
  UI.inventory.classList.remove("hidden");
}

function closeInventory() {
  if (!inventoryOpen) return;

  inventoryOpen = false;
  UI.inventory.classList.add("hidden");

  if (!waveBreakActive) {
    paused = false;
    lastTime = performance.now();
    raf = requestAnimationFrame(loop);

    if (!isMobile()) {
      setTimeout(lockMouse, 60);
    }
  }
}

function renderInventory() {
  UI.inventoryGrid.innerHTML = "";

  const entries = Object.keys(ITEM_DATA);

  for (let i = 0; i < 18; i++) {
    const key = entries[i] || null;
    const slot = document.createElement("button");
    slot.className = "inventory-slot";

    if (!key) {
      slot.classList.add("empty");
      slot.innerHTML = '<span class="item-icon">＋</span>';
      slot.disabled = true;
    } else {
      const item = ITEM_DATA[key];
      const count = inventory[key] || 0;

      if (count <= 0) {
        slot.classList.add("empty");
      }

      if (selectedInventoryItem === key) {
        slot.classList.add("selected");
      }

      slot.innerHTML = `
        <span class="item-icon">${item.icon}</span>
        <span class="item-count">${count}</span>
      `;

      slot.addEventListener("click", () => {
        selectedInventoryItem = key;
        renderInventory();
        updateSelectedItemInfo();
      });
    }

    UI.inventoryGrid.appendChild(slot);
  }

  updateSelectedItemInfo();
}

function updateSelectedItemInfo() {
  if (!selectedInventoryItem) {
    UI.selectedItemName.textContent = "SELECT AN ITEM";
    UI.selectedItemDescription.textContent =
      "Loot buildings and crates to collect survival supplies.";
    UI.useItemBtn.disabled = true;
    return;
  }

  const item = ITEM_DATA[selectedInventoryItem];
  const count = inventory[selectedInventoryItem] || 0;

  UI.selectedItemName.textContent = item.name;
  UI.selectedItemDescription.textContent = item.description;
  UI.useItemBtn.disabled = !item.usable || count <= 0;
}

function useSelectedItem() {
  if (!selectedInventoryItem || (inventory[selectedInventoryItem] || 0) <= 0) return;

  let used = false;

  if (selectedInventoryItem === "medkit" && player.health < player.maxHealth) {
    player.health = Math.min(player.maxHealth, player.health + 50);
    used = true;
  }

  if (selectedInventoryItem === "bandage" && player.health < player.maxHealth) {
    player.health = Math.min(player.maxHealth, player.health + 20);
    used = true;
  }

  if (selectedInventoryItem === "food" && player.health < player.maxHealth) {
    player.health = Math.min(player.maxHealth, player.health + 10);
    used = true;
  }

  if (selectedInventoryItem === "armor" && player.armor < 75) {
    player.armor = Math.min(75, player.armor + 25);
    used = true;
  }

  if (selectedInventoryItem === "ammo") {
    for (const name of Object.keys(weaponAmmo)) {
      weaponAmmo[name] = WEAPONS[name].mag;
    }
    ammo = weaponAmmo[currentWeapon];
    used = true;
  }

  if (!used) {
    beep(120, .1, "square", .035);
    return;
  }

  inventory[selectedInventoryItem]--;
  saveInventory();
  beep(680, .13, "triangle", .045);
  renderInventory();
  updateUI();
}

function addLoot(type, amount = 1) {
  inventory[type] = (inventory[type] || 0) + amount;
  saveInventory();

  const toast = document.createElement("div");
  toast.className = "loot-toast";
  toast.textContent = `FOUND: ${ITEM_DATA[type].icon} ${ITEM_DATA[type].name} ×${amount}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1000);
}

function randomLoot() {
  const table = [
    ["bandage", 28],
    ["food", 24],
    ["ammo", 20],
    ["armor", 13],
    ["medkit", 11],
    ["key", 4]
  ];

  let roll = Math.random() * 100;

  for (const [type, chance] of table) {
    roll -= chance;
    if (roll <= 0) return type;
  }

  return "bandage";
}

function updateInteraction() {
  nearbyInteraction = null;

  if (interior) {
    const exitDistance = Math.hypot(
      player.x - interior.exitX,
      player.y - interior.exitY
    );

    if (exitDistance < 80) {
      nearbyInteraction = { type: "exit" };
      showInteraction("EXIT BUILDING");
      return;
    }

    for (const crate of interior.crates) {
      if (
        !crate.opened &&
        Math.hypot(player.x - crate.x, player.y - crate.y) < 70
      ) {
        nearbyInteraction = { type: "crate", crate };
        showInteraction("SEARCH LOOT CRATE");
        return;
      }
    }

    hideInteraction();
    return;
  }

  for (const building of buildings) {
    const distance = Math.hypot(
      player.x - building.doorX,
      player.y - building.doorY
    );

    if (distance < 85) {
      nearbyInteraction = { type: "building", building };
      showInteraction(`ENTER ${building.type.toUpperCase()}`);
      return;
    }
  }

  hideInteraction();
}

function showInteraction(text) {
  UI.interactText.textContent = text;
  UI.interactPrompt.classList.add("show");
}

function hideInteraction() {
  UI.interactPrompt.classList.remove("show");
}

function interact() {
  if (!running || paused || inventoryOpen || !nearbyInteraction) return;

  if (nearbyInteraction.type === "building") {
    enterBuilding(nearbyInteraction.building);
  } else if (nearbyInteraction.type === "exit") {
    exitBuilding();
  } else if (nearbyInteraction.type === "crate") {
    searchCrate(nearbyInteraction.crate);
  }
}

function enterBuilding(building) {
  outsidePosition = {
    x: building.doorX,
    y: building.doorY + 70,
    cameraX: camera.x,
    cameraY: camera.y
  };

  interior = {
    building,
    width: 1000,
    height: 700,
    exitX: 500,
    exitY: 645,
    crates: [
      { x: 190, y: 180, opened: false },
      { x: 785, y: 180, opened: false },
      { x: 500, y: 350, opened: false }
    ]
  };

  player.x = interior.exitX;
  player.y = interior.exitY - 75;
  zombies = [];
  bullets = [];
  particles = [];

  camera.x = 0;
  camera.y = 0;
  camera.tx = 0;
  camera.ty = 0;

  if (!building.searched) {
    building.searched = true;
    buildingsSearched++;
    UI.missionText.textContent =
      buildingsSearched >= 2
        ? "Find the City Key inside a loot crate"
        : "Search another building for supplies";
  }

  beep(380, .13, "square", .035);
}

function exitBuilding() {
  if (!interior || !outsidePosition) return;

  player.x = outsidePosition.x;
  player.y = outsidePosition.y;
  interior = null;
  outsidePosition = null;
  cameraInstant();
  hideInteraction();
  beep(310, .12, "square", .03);
}

function searchCrate(crate) {
  if (crate.opened) return;

  crate.opened = true;

  const lootCount = Math.random() > .72 ? 2 : 1;

  for (let i = 0; i < lootCount; i++) {
    const type = randomLoot();
    addLoot(type, 1);

    if (type === "key") {
      UI.missionText.textContent = "City Key found — survive the infected city";
    }
  }

  coins += 3;
  localStorage.setItem("potaraZombieCoins", String(coins));
  burst(crate.x, crate.y, "#ffe45c", 18, 150);
  beep(760, .14, "triangle", .05);
  updateUI();
}

/* Audio */
function audio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function beep(freq, duration, type = "sine", volume = .04) {
  if (!soundEnabled) return;
  try {
    const a = audio();
    const o = a.createOscillator();
    const g = a.createGain();
    o.connect(g); g.connect(a.destination);
    o.type = type;
    o.frequency.setValueAtTime(freq, a.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * .55), a.currentTime + duration);
    g.gain.setValueAtTime(volume, a.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, a.currentTime + duration);
    o.start(); o.stop(a.currentTime + duration);
  } catch (_) {}
}
UI.soundBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  UI.soundBtn.textContent = soundEnabled ? "🔊" : "🔇";
  if (soundEnabled) beep(520,.1);
});

/* Shooting */
function nearestZombie() {
  let found = null, best = Infinity;
  for (const z of zombies) {
    const d = Math.hypot(z.x - player.x, z.y - player.y);
    if (d < best) { best = d; found = z; }
  }
  return found;
}

function shoot() {
  const baseWeapon = WEAPONS[currentWeapon];
  const weapon = {
    ...baseWeapon,
    damage:
      currentWeapon === "pistol"
        ? baseWeapon.damage * (1 + (upgrades.pistolDamage - 1) * .22)
        : currentWeapon === "shotgun"
        ? baseWeapon.damage * (1 + (upgrades.shotgunPower - 1) * .18)
        : baseWeapon.damage,
    fireDelay:
      currentWeapon === "smg"
        ? Math.max(.038, baseWeapon.fireDelay * Math.pow(.92, upgrades.smgRate - 1))
        : baseWeapon.fireDelay
  };

  if (!running || paused || waveBreakActive || reloading || fireCooldown > 0) return;
  if (ammo <= 0) return startReload();

  let baseAngle = player.aim;

  if (isMobile()) {
    const target = nearestZombie();
    if (target) {
      baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
      player.aim = baseAngle;
    }
  }

  ammo--;
  weaponAmmo[currentWeapon] = ammo;
  fireCooldown = weapon.fireDelay;
  muzzleFlash = currentWeapon === "shotgun" ? .13 : .085;
  shake = Math.max(shake, weapon.shake);

  for (let i = 0; i < weapon.pellets; i++) {
    const angle =
      baseAngle +
      (Math.random() - .5) * weapon.spread;

    const x = player.x + Math.cos(angle) * 42;
    const y = player.y + Math.sin(angle) * 42;

    bullets.push({
      x,
      y,
      px: x,
      py: y,
      r: currentWeapon === "shotgun" ? 3.5 : 4,
      speed: weapon.speed,
      angle,
      life: currentWeapon === "shotgun" ? .72 : 1.25,
      damage: weapon.damage,
      color: weapon.color
    });
  }

  burst(
    player.x + Math.cos(baseAngle) * 42,
    player.y + Math.sin(baseAngle) * 42,
    weapon.color,
    currentWeapon === "shotgun" ? 12 : 7,
    currentWeapon === "shotgun" ? 250 : 180
  );

  beep(
    currentWeapon === "shotgun" ? 90 : currentWeapon === "smg" ? 210 : 175,
    currentWeapon === "shotgun" ? .16 : .08,
    "sawtooth",
    currentWeapon === "shotgun" ? .1 : .07
  );

  if (ammo === 0) setTimeout(startReload, 170);
  updateUI();
}

function startReload() {
  if (!running || paused || reloading || ammo === WEAPONS[currentWeapon].mag) return;
  reloading = true;
  reloadTimer = 0;
  UI.reloadBar.classList.add("show");
  UI.reloadProgress.style.width = "0%";
  beep(340,.11,"square",.025);
}

function updateReload(dt) {
  if (!reloading) return;
  reloadTimer += dt;
  const p = Math.min(1, reloadTimer / WEAPONS[currentWeapon].reload);
  UI.reloadProgress.style.width = p * 100 + "%";
  if (p >= 1) {
    reloading = false;
    ammo = WEAPONS[currentWeapon].mag;
    weaponAmmo[currentWeapon] = ammo;
    UI.reloadBar.classList.remove("show");
    beep(560,.09,"square",.035);
  }
}

/* Zombies */
function spawnZombie() {
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.max(innerWidth, innerHeight) * .75 + 320;
  let x = clamp(player.x + Math.cos(angle) * dist, 60, WORLD.w - 60);
  let y = clamp(player.y + Math.sin(angle) * dist, 60, WORLD.h - 60);
  if (insideBuilding(x,y,70)) {
    const p = safePosition(70); x = p.x; y = p.y;
  }

  const rand = Math.random();
  let type = "normal";

  const bossAlreadyAlive = zombies.some(z => z.type === "boss");
  if (wave >= 5 && wave % 5 === 0 && !bossAlreadyAlive) {
    type = "boss";
  } else {
    if (wave >= 2 && rand > .75) type = "runner";
    if (wave >= 4 && rand > .92) type = "tank";
  }

  const boost = 1 + wave * .055;

  if (type === "boss") {
    const hp = 35 + wave * 5;
    zombies.push({
      type,
      x,
      y,
      r: 52,
      speed: 42 * boost,
      health: hp,
      maxHealth: hp,
      damage: 24,
      hit: 0,
      attack: 0,
      walk: Math.random() * 10,
      angle: 0
    });
    return;
  }
  if (type === "runner") {
    zombies.push({type,x,y,r:20,speed:150*boost,health:1+Math.floor(wave/6),maxHealth:1+Math.floor(wave/6),damage:7,hit:0,attack:0,walk:Math.random()*10,angle:0});
  } else if (type === "tank") {
    const hp = 8 + Math.floor(wave * 1.2);
    zombies.push({type,x,y,r:38,speed:48*boost,health:hp,maxHealth:hp,damage:18,hit:0,attack:0,walk:Math.random()*10,angle:0});
  } else {
    const hp = 2 + Math.floor(wave / 4);
    zombies.push({type,x,y,r:26,speed:80*boost,health:hp,maxHealth:hp,damage:10,hit:0,attack:0,walk:Math.random()*10,angle:0});
  }
}

function killZombie(index, z) {
  zombies.splice(index,1);
  kills++;
  waveKills++;
  const reward =
    z.type === "boss" ? 1500 :
    z.type === "tank" ? 500 :
    z.type === "runner" ? 160 : 100;

  const coinReward =
    z.type === "boss" ? 50 :
    z.type === "tank" ? 12 :
    z.type === "runner" ? 4 : 2;

  score += reward * wave;
  coins += coinReward;
  waveCoins += coinReward;
  localStorage.setItem("potaraZombieCoins", String(coins));
  showCoinPopup(z.x, z.y, coinReward);
  burst(z.x,z.y,z.type === "boss" ? "#ff4f88" : z.type === "tank" ? "#7aff54" : "#42cf56",z.type === "boss" ? 70 : z.type === "tank" ? 42 : 22,z.type === "boss" ? 360 : z.type === "tank" ? 300 : 220);
  if (Math.random() < .14) pickups.push({type:Math.random()>.55?"armor":"health",x:z.x,y:z.y,r:16,life:15,t:Math.random()*10});
  if (z.type === "tank") shake = 18;
  beep(z.type === "tank" ? 70 : 110,z.type === "tank" ? .25 : .12,"sawtooth",z.type === "tank" ? .07 : .03);
}

/* Updates */
function update(dt) {
  fogTime += dt;
  fireCooldown = Math.max(0, fireCooldown - dt);
  muzzleFlash = Math.max(0, muzzleFlash - dt);
  shake = Math.max(0, shake - 22 * dt);

  updateReload(dt);
  updatePlayer(dt);
  updateBullets(dt);
  if (!interior) updateZombies(dt);
  updateParticles(dt);
  updatePickups(dt);
  updateCamera(dt);
  updateBossBar();
  updateBossAttacks(dt);
  updateInteraction();

  if (!waveBreakActive && !interior) spawnTimer += dt;
  if (!waveBreakActive && !interior && spawnTimer >= spawnDelay) {
    spawnTimer = 0;
    spawnZombie();
  }

  if (
    !waveBreakActive &&
    waveKills >= nextWaveKillTarget &&
    !zombies.some(z => z.type === "boss")
  ) {
    beginWaveBreak();
  }
  updateUI();
}

function updatePlayer(dt) {
  let mx = 0, my = 0;

  if (keys.w || keys.arrowup) my -= 1;
  if (keys.s || keys.arrowdown) my += 1;
  if (keys.a || keys.arrowleft) mx -= 1;
  if (keys.d || keys.arrowright) mx += 1;

  mx += joystick.x;
  my += joystick.y;

  const len = Math.hypot(mx, my);

  if (len > 0) {
    mx /= len;
    my /= len;
    player.walk += dt * 10;
  }

  const ox = player.x;
  const oy = player.y;

  player.x += mx * player.speed * dt;
  player.y += my * player.speed * dt;

  if (interior) {
    player.x = clamp(player.x, player.r + 35, interior.width - player.r - 35);
    player.y = clamp(player.y, player.r + 55, interior.height - player.r - 35);

    for (const obstacle of [
      { x: 320, y: 250, w: 360, h: 85 },
      { x: 120, y: 455, w: 230, h: 70 },
      { x: 650, y: 455, w: 230, h: 70 }
    ]) {
      const cx = clamp(player.x, obstacle.x, obstacle.x + obstacle.w);
      const cy = clamp(player.y, obstacle.y, obstacle.y + obstacle.h);
      const dx = player.x - cx;
      const dy = player.y - cy;

      if (dx * dx + dy * dy < player.r * player.r) {
        player.x = ox;
        player.y = oy;
      }
    }

    return;
  }

  player.x = clamp(player.x, player.r, WORLD.w - player.r);
  player.y = clamp(player.y, player.r, WORLD.h - player.r);
  collideBuildings(player, ox, oy, player.r);
  collectPickups();
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.px = b.x; b.py = b.y;
    b.x += Math.cos(b.angle) * b.speed * dt;
    b.y += Math.sin(b.angle) * b.speed * dt;
    b.life -= dt;

    if (b.life <= 0 || b.x < 0 || b.x > WORLD.w || b.y < 0 || b.y > WORLD.h || insideBuilding(b.x,b.y)) {
      burst(b.x,b.y,"#d8d5b8",4,70);
      bullets.splice(i,1);
      continue;
    }


    let hitBarrel = false;

    for (const item of decor) {
      if (
        item.type === "barrel" &&
        item.explosive &&
        !item.exploded &&
        Math.hypot(b.x - item.x, b.y - item.y) < b.r + item.r
      ) {
        item.health -= b.damage;
        bullets.splice(i, 1);
        hitBarrel = true;

        burst(b.x, b.y, "#ffb34c", 8, 150);

        if (item.health <= 0) {
          explodeBarrel(item);
        }

        break;
      }
    }

    if (hitBarrel) {
      continue;
    }

    for (let j = zombies.length - 1; j >= 0; j--) {
      const z = zombies[j];
      if (Math.hypot(b.x-z.x,b.y-z.y) < b.r + z.r) {
        z.health -= b.damage;
        z.hit = .1;
        burst(b.x,b.y,"#55d962",8,160);
        bullets.splice(i,1);
        shake = Math.max(shake,z.type==="tank"?5:2);
        if (z.health <= 0) killZombie(j,z);
        break;
      }
    }
  }
}

function updateZombies(dt) {
  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i];
    z.attack -= dt;
    z.hit = Math.max(0,z.hit-dt);
    z.walk += dt * (z.type==="runner"?14:8);
    const a = Math.atan2(player.y-z.y,player.x-z.x);
    z.angle = a;

    const ox=z.x, oy=z.y;
    z.x += Math.cos(a)*z.speed*dt;
    z.y += Math.sin(a)*z.speed*dt;
    collideBuildings(z,ox,oy,z.r);

    if (Math.hypot(z.x-player.x,z.y-player.y) < z.r + player.r && z.attack <= 0) {
      damagePlayer(z.damage);
      z.attack = z.type==="runner"?.48:.72;
    }
  }
}

function damagePlayer(amount) {
  let damage = amount;
  if (player.armor > 0) {
    const absorb = Math.min(player.armor, damage);
    player.armor -= absorb;
    damage -= absorb;
  }
  player.health -= damage;
  shake = Math.max(shake,14);
  burst(player.x,player.y,"#ff365d",16,240);
  UI.damageFlash.classList.add("active");
  setTimeout(()=>UI.damageFlash.classList.remove("active"),110);
  beep(95,.17,"square",.065);
  if (player.health <= 0) {
    player.health = 0;
    endGame();
  }
}

function updatePickups(dt) {
  for (let i = pickups.length - 1; i >= 0; i--) {
    pickups[i].life -= dt;
    pickups[i].t += dt * 4;
    if (pickups[i].life <= 0) pickups.splice(i,1);
  }
}

function collectPickups() {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];
    if (Math.hypot(player.x-p.x,player.y-p.y) < player.r + p.r + 5) {
      if (p.type === "health") player.health = Math.min(player.maxHealth,player.health+30);
      else player.armor = Math.min(50,player.armor+25);
      pickups.splice(i,1);
      beep(p.type==="health"?620:760,.14,p.type==="health"?"sine":"triangle",.045);
    }
  }
}

function burst(x,y,color,count,maxSpeed=180) {
  for (let i=0;i<count;i++) {
    const a=Math.random()*Math.PI*2;
    const speed=30+Math.random()*maxSpeed;
    particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:2+Math.random()*4,color,life:.25+Math.random()*.5,max:.75});
  }
}
function updateParticles(dt) {
  for (let i=particles.length-1;i>=0;i--) {
    const p=particles[i];
    p.x+=p.vx*dt; p.y+=p.vy*dt;
    p.vx*=.97; p.vy*=.97; p.life-=dt;
    if (p.life<=0) particles.splice(i,1);
  }
}

/* Camera */
function updateCamera(dt) {
  const activeWidth = interior ? interior.width : WORLD.w;
  const activeHeight = interior ? interior.height : WORLD.h;

  camera.tx = clamp(player.x - innerWidth/2,0,Math.max(0,activeWidth-innerWidth));
  camera.ty = clamp(player.y - innerHeight/2,0,Math.max(0,activeHeight-innerHeight));
  const smooth = 1 - Math.pow(.001,dt);
  camera.x += (camera.tx-camera.x)*smooth;
  camera.y += (camera.ty-camera.y)*smooth;
  camera.sx = shake>0 ? (Math.random()-.5)*shake : 0;
  camera.sy = shake>0 ? (Math.random()-.5)*shake : 0;
}
function cameraInstant() {
  camera.x = clamp(player.x-innerWidth/2,0,Math.max(0,WORLD.w-innerWidth));
  camera.y = clamp(player.y-innerHeight/2,0,Math.max(0,WORLD.h-innerHeight));
  camera.tx=camera.x; camera.ty=camera.y;
}

/* Draw */
function draw() {
  ctx.clearRect(0,0,innerWidth,innerHeight);

  if (interior) {
    drawInterior();
    drawParticles();
    drawLighting();
    drawVignette();
    return;
  }

  drawGround();
  drawRoads();

  const items = [];
  for (const b of buildings) items.push({y:b.y+b.h,draw:()=>drawBuilding(b)});
  for (const d of decor) items.push({y:d.y,draw:()=>drawDecor(d)});
  for (const p of pickups) items.push({y:p.y,draw:()=>drawPickup(p)});
  for (const z of zombies) items.push({y:z.y+z.r,draw:()=>drawZombie(z)});
  items.push({y:player.y+player.r,draw:drawPlayer});
  items.sort((a,b)=>a.y-b.y);

  drawShadows();
  for (const item of items) item.draw();

  drawBullets();
  drawParticles();
  drawLighting();
  drawFog();
  drawVignette();
  drawMiniMap();
}

function drawGround() {
  const horizon = innerHeight*.27;
  ctx.fillStyle="#071009";
  ctx.fillRect(0,0,innerWidth,innerHeight);
  const g=ctx.createLinearGradient(0,horizon,0,innerHeight);
  g.addColorStop(0,"#121a13");g.addColorStop(.35,"#0c150e");g.addColorStop(1,"#050a06");
  ctx.fillStyle=g;ctx.fillRect(0,horizon,innerWidth,innerHeight-horizon);

  ctx.strokeStyle="rgba(129,180,133,.07)";
  ctx.lineWidth=1;
  const grid=110;
  const ox=-(camera.x%grid), oy=-(camera.y%grid);
  for(let x=ox-grid;x<innerWidth+grid;x+=grid){
    ctx.beginPath();
    ctx.moveTo(innerWidth/2+(x-innerWidth/2)*.28,horizon);
    ctx.lineTo(x,innerHeight);ctx.stroke();
  }
  for(let y=horizon+oy;y<innerHeight+grid;y+=grid){
    const p=(y-horizon)/(innerHeight-horizon);
    const yy=horizon+p*p*(innerHeight-horizon);
    ctx.beginPath();ctx.moveTo(0,yy);ctx.lineTo(innerWidth,yy);ctx.stroke();
  }
}

function drawRoads() {
  const roads=[{x:1210,y:0,w:300,h:WORLD.h},{x:0,y:1260,w:WORLD.w,h:310}];
  for(const r of roads){
    const p=worldToScreen(r.x,r.y);
    ctx.fillStyle="#111513";ctx.fillRect(p.x,p.y,r.w,r.h);
    ctx.strokeStyle="rgba(230,220,130,.18)";ctx.lineWidth=4;ctx.setLineDash([35,30]);
    ctx.beginPath();
    if(r.w>r.h){ctx.moveTo(p.x,p.y+r.h/2);ctx.lineTo(p.x+r.w,p.y+r.h/2)}
    else{ctx.moveTo(p.x+r.w/2,p.y);ctx.lineTo(p.x+r.w/2,p.y+r.h)}
    ctx.stroke();ctx.setLineDash([]);
  }
}

function shadow(x,y,rx,ry){
  const gr=ctx.createRadialGradient(x,y,0,x,y,rx);
  gr.addColorStop(0,"rgba(0,0,0,.42)");gr.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(x,y,rx,ry,-.3,0,Math.PI*2);ctx.fill();
}
function drawShadows(){
  for(const d of decor){
    if(!visible(d.x,d.y))continue;
    const p=worldToScreen(d.x,d.y);
    if(d.type==="tree")shadow(p.x+15,p.y+16,d.r*1.25,d.r*.42);
    if(d.type==="rock")shadow(p.x+7,p.y+7,d.r,d.r*.4);
  }
  for(const z of zombies){
    if(!visible(z.x,z.y))continue;
    const p=worldToScreen(z.x,z.y);shadow(p.x+9,p.y+13,z.r*1.1,z.r*.45);
  }
  const p=worldToScreen(player.x,player.y);shadow(p.x+10,p.y+14,player.r*1.25,player.r*.5);
}

function drawBuilding(b){
  if(!visible(b.x+b.w/2,b.y+b.h/2,550))return;
  const p=worldToScreen(b.x,b.y);
  ctx.fillStyle="#1b241d";ctx.fillRect(p.x,p.y-b.h3,b.w,b.h+b.h3);
  const roof=ctx.createLinearGradient(p.x,p.y-b.h3,p.x,p.y);
  roof.addColorStop(0,"#3b463c");roof.addColorStop(1,"#273129");
  ctx.fillStyle=roof;ctx.beginPath();ctx.moveTo(p.x,p.y-b.h3);ctx.lineTo(p.x+b.w,p.y-b.h3);ctx.lineTo(p.x+b.w+20,p.y-b.h3+20);ctx.lineTo(p.x+20,p.y-b.h3+20);ctx.closePath();ctx.fill();
  ctx.strokeStyle="rgba(255,255,255,.08)";ctx.strokeRect(p.x,p.y-b.h3,b.w,b.h+b.h3);
  for(let x=p.x+35;x<p.x+b.w-35;x+=65){
    for(let y=p.y-b.h3+48;y<p.y+b.h-25;y+=76){
      ctx.fillStyle="rgba(5,8,6,.75)";ctx.fillRect(x,y,36,34);
    }
  }
}

function drawDecor(d){
  if(!visible(d.x,d.y))return;
  const p=worldToScreen(d.x,d.y);
  ctx.save();ctx.translate(p.x,p.y);
  if(d.type==="tree"){
    ctx.fillStyle="#372c1b";ctx.fillRect(-5,-d.h*.3,10,d.h);
    ctx.fillStyle=d.shade>.5?"#163f20":"#1b4b26";ctx.beginPath();ctx.arc(0,-d.h*.55,d.r,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="rgba(80,150,78,.22)";ctx.beginPath();ctx.arc(-d.r*.25,-d.h*.75,d.r*.58,0,Math.PI*2);ctx.fill();
  }else if(d.type==="rock"){
    ctx.rotate(d.rot);ctx.fillStyle="#39413b";ctx.beginPath();ctx.moveTo(-d.r,4);ctx.lineTo(-d.r*.5,-d.r*.8);ctx.lineTo(d.r*.4,-d.r);ctx.lineTo(d.r,-d.r*.2);ctx.lineTo(d.r*.7,d.r*.6);ctx.lineTo(-d.r*.4,d.r);ctx.closePath();ctx.fill();
  }else{
    if (d.exploded) {
      ctx.fillStyle = "#231b17";
      ctx.fillRect(-16, 5, 32, 9);
      ctx.restore();
      return;
    }
    ctx.fillStyle=d.explosive?"#812d23":"#304c44";ctx.fillRect(-14,-24,28,40);
    ctx.strokeStyle="#111";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-14,-15);ctx.lineTo(14,-15);ctx.moveTo(-14,7);ctx.lineTo(14,7);ctx.stroke();
    ctx.fillStyle=d.explosive?"#ffb938":"#65b8a2";ctx.beginPath();ctx.arc(0,-3,5,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

function drawPlayer(){
  const p=worldToScreen(player.x,player.y);
  const bob=Math.sin(player.walk)*2;
  ctx.save();ctx.translate(p.x,p.y+bob);ctx.rotate(player.aim);
  const swing=Math.sin(player.walk)*6;
  ctx.strokeStyle="#162126";ctx.lineWidth=9;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-6,7);ctx.lineTo(-10,22+swing);ctx.moveTo(5,7);ctx.lineTo(9,22-swing);ctx.stroke();
  const body=ctx.createLinearGradient(-20,-20,20,20);body.addColorStop(0,"#20b6c0");body.addColorStop(1,"#08606b");
  ctx.fillStyle=body;ctx.beginPath();ctx.roundRect(-17,-15,34,32,10);ctx.fill();
  ctx.fillStyle="#121820";ctx.beginPath();ctx.arc(-1,-17,13,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#9ceeff";ctx.fillRect(3,-23,12,6);
  ctx.strokeStyle="#192129";ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(10,-5);ctx.lineTo(27,-4);ctx.stroke();
  ctx.fillStyle="#232a31";ctx.fillRect(17,-7,35,11);ctx.fillStyle="#65717a";ctx.fillRect(24,-10,20,5);
  if(muzzleFlash>0){
    ctx.translate(55,-1);
    const g=ctx.createRadialGradient(0,0,0,0,0,30);g.addColorStop(0,"rgba(255,255,220,1)");g.addColorStop(.35,"rgba(255,190,60,.9)");g.addColorStop(1,"rgba(255,70,10,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(32,-14);ctx.lineTo(21,0);ctx.lineTo(32,14);ctx.closePath();ctx.fill();
  }
  ctx.restore();
}

function drawZombie(z){
  if(!visible(z.x,z.y))return;
  const p=worldToScreen(z.x,z.y);
  const bob=Math.sin(z.walk)*(z.type==="runner"?4:2);
  ctx.save();ctx.translate(p.x,p.y+bob);ctx.rotate(z.angle);
  const scale=z.type==="boss"?1.7:z.type==="tank"?1.35:z.type==="runner"?.82:1;ctx.scale(scale,scale);
  const col=z.hit>0?"#d9ffd3":z.type==="boss"?"#8f3d66":z.type==="tank"?"#527e48":z.type==="runner"?"#67a845":"#438b49";
  const swing=Math.sin(z.walk)*7;
  ctx.strokeStyle="#283328";ctx.lineWidth=z.type==="tank"?12:8;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-7,9);ctx.lineTo(-11,25+swing);ctx.moveTo(7,9);ctx.lineTo(11,25-swing);ctx.stroke();
  ctx.strokeStyle=col;ctx.lineWidth=z.type==="tank"?13:8;ctx.beginPath();ctx.moveTo(-12,-2);ctx.lineTo(-28,-4+swing*.25);ctx.moveTo(12,-2);ctx.lineTo(28,4-swing*.25);ctx.stroke();
  ctx.fillStyle=z.type==="tank"?"#3b4036":"#272d28";ctx.beginPath();ctx.roundRect(-18,-14,36,38,z.type==="tank"?8:12);ctx.fill();
  ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,-20,16,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#ff304e";ctx.beginPath();ctx.arc(7,-24,3.5,0,Math.PI*2);ctx.arc(7,-15,3.5,0,Math.PI*2);ctx.fill();
  ctx.restore();

  if(z.health<z.maxHealth){
    const w=z.type==="tank"?70:42;
    ctx.fillStyle="rgba(0,0,0,.65)";ctx.fillRect(p.x-w/2,p.y-z.r-32,w,5);
    ctx.fillStyle=z.type==="tank"?"#ff365d":"#65ff72";ctx.fillRect(p.x-w/2,p.y-z.r-32,w*(z.health/z.maxHealth),5);
  }
}

function drawBullets(){
  for(const b of bullets){
    const c=worldToScreen(b.x,b.y),p=worldToScreen(b.px,b.py);
    ctx.strokeStyle="rgba(255,223,105,.65)";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(c.x,c.y);ctx.stroke();
    ctx.shadowColor=b.color||"#ffd85c";ctx.shadowBlur=15;ctx.fillStyle=b.color||"#fff7bd";ctx.beginPath();ctx.arc(c.x,c.y,b.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  }
}

function drawPickup(p){
  if(!visible(p.x,p.y))return;
  const s=worldToScreen(p.x,p.y);const f=Math.sin(p.t)*5;
  ctx.save();ctx.translate(s.x,s.y+f);ctx.shadowColor=p.type==="health"?"#ff365d":"#00ecff";ctx.shadowBlur=20;
  ctx.fillStyle=p.type==="health"?"#a72a3f":"#157a8d";ctx.beginPath();ctx.roundRect(-16,-16,32,32,8);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle="#fff";
  if(p.type==="health"){ctx.fillRect(-4,-11,8,22);ctx.fillRect(-11,-4,22,8)}
  else{ctx.strokeStyle="#fff";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.stroke()}
  ctx.restore();
}

function drawParticles(){
  for(const p of particles){
    if(!visible(p.x,p.y))continue;
    const s=worldToScreen(p.x,p.y);
    ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(s.x,s.y,p.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  }
}

function drawLighting(){
  const p=worldToScreen(player.x,player.y);
  const dark=ctx.createRadialGradient(p.x,p.y,70,p.x,p.y,Math.max(innerWidth,innerHeight)*.72);
  dark.addColorStop(0,"rgba(0,0,0,0)");dark.addColorStop(.36,"rgba(0,0,0,.1)");dark.addColorStop(1,"rgba(0,3,1,.78)");
  ctx.fillStyle=dark;ctx.fillRect(0,0,innerWidth,innerHeight);

  ctx.save();ctx.globalCompositeOperation="lighter";
  const fx=p.x+Math.cos(player.aim)*150,fy=p.y+Math.sin(player.aim)*150;
  const light=ctx.createRadialGradient(p.x,p.y,10,fx,fy,390);
  light.addColorStop(0,"rgba(185,255,188,.16)");light.addColorStop(.5,"rgba(110,180,115,.06)");light.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=light;ctx.beginPath();ctx.arc(fx,fy,390,0,Math.PI*2);ctx.fill();ctx.restore();
}

function drawFog(){
  ctx.save();ctx.globalAlpha=.055;
  for(let i=0;i<7;i++){
    const x=(i*260+fogTime*(14+i*2))%(innerWidth+500)-250;
    const y=100+(i*130)%Math.max(200,innerHeight-150);
    const g=ctx.createRadialGradient(x,y,0,x,y,220);g.addColorStop(0,"rgba(150,190,155,.7)");g.addColorStop(1,"rgba(150,190,155,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,260,90,0,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

function drawVignette(){
  const g=ctx.createRadialGradient(innerWidth/2,innerHeight/2,Math.min(innerWidth,innerHeight)*.25,innerWidth/2,innerHeight/2,Math.max(innerWidth,innerHeight)*.7);
  g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.52)");
  ctx.fillStyle=g;ctx.fillRect(0,0,innerWidth,innerHeight);
}


function showCoinPopup(worldX, worldY, amount) {
  const point = worldToScreen(worldX, worldY);
  const popup = document.createElement("div");
  popup.className = "coin-popup";
  popup.textContent = `+${amount} 🪙`;
  popup.style.left = `${point.x}px`;
  popup.style.top = `${point.y}px`;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 800);
}

function updateBossBar() {
  const boss = zombies.find(z => z.type === "boss");

  if (!boss) {
    UI.bossBar.classList.remove("show");
    return;
  }

  UI.bossBar.classList.add("show");
  UI.bossFill.style.width =
    Math.max(0, boss.health / boss.maxHealth * 100) + "%";
}

function drawMiniMap() {
  const map = UI.miniMap;
  const w = map.width;
  const h = map.height;

  miniCtx.clearRect(0, 0, w, h);
  miniCtx.fillStyle = "rgba(3,8,4,.92)";
  miniCtx.fillRect(0, 0, w, h);

  const sx = w / WORLD.w;
  const sy = h / WORLD.h;

  miniCtx.fillStyle = "rgba(110,130,115,.22)";
  buildings.forEach((building) => {
    miniCtx.fillRect(
      building.x * sx,
      building.y * sy,
      Math.max(2, building.w * sx),
      Math.max(2, building.h * sy)
    );
  });

  zombies.forEach((zombie) => {
    miniCtx.fillStyle =
      zombie.type === "boss" ? "#ff365d" :
      zombie.type === "tank" ? "#ff8b5c" :
      "#79ff72";

    miniCtx.beginPath();
    miniCtx.arc(
      zombie.x * sx,
      zombie.y * sy,
      zombie.type === "boss" ? 4 : 2,
      0,
      Math.PI * 2
    );
    miniCtx.fill();
  });

  miniCtx.fillStyle = "#00ecff";
  miniCtx.beginPath();
  miniCtx.arc(player.x * sx, player.y * sy, 3.5, 0, Math.PI * 2);
  miniCtx.fill();

  miniCtx.strokeStyle = "rgba(87,255,109,.5)";
  miniCtx.strokeRect(
    camera.x * sx,
    camera.y * sy,
    innerWidth * sx,
    innerHeight * sy
  );
}


function explodeBarrel(barrel) {
  if (barrel.exploded) return;

  barrel.exploded = true;
  barrel.health = 0;

  const radius = 170;
  const damage = 6;

  const point = worldToScreen(barrel.x, barrel.y);
  const ring = document.createElement("div");
  ring.className = "explosion-ring";
  ring.style.left = `${point.x}px`;
  ring.style.top = `${point.y}px`;
  document.body.appendChild(ring);
  setTimeout(() => ring.remove(), 600);

  burst(barrel.x, barrel.y, "#ffb43f", 65, 360);
  burst(barrel.x, barrel.y, "#ff4e2e", 35, 260);
  shake = Math.max(shake, 22);
  beep(75, .35, "sawtooth", .12);

  for (let i = zombies.length - 1; i >= 0; i--) {
    const zombie = zombies[i];
    const distance = Math.hypot(zombie.x - barrel.x, zombie.y - barrel.y);

    if (distance < radius) {
      zombie.health -= damage * (1 - distance / radius * .45);
      zombie.hit = .15;

      if (zombie.health <= 0) {
        killZombie(i, zombie);
      }
    }
  }

  const playerDistance = Math.hypot(player.x - barrel.x, player.y - barrel.y);
  if (playerDistance < radius * .72) {
    damagePlayer(Math.ceil(20 * (1 - playerDistance / (radius * .72))));
  }

  for (const other of decor) {
    if (
      other !== barrel &&
      other.type === "barrel" &&
      other.explosive &&
      !other.exploded &&
      Math.hypot(other.x - barrel.x, other.y - barrel.y) < 145
    ) {
      setTimeout(() => explodeBarrel(other), 120);
    }
  }
}

function beginWaveBreak() {
  waveBreakActive = true;
  paused = true;
  unlockMouse();

  UI.completeWave.textContent = wave;
  UI.completeKills.textContent = waveKills;
  UI.completeCoins.textContent = waveCoins;
  UI.completeScore.textContent = score;
  UI.waveComplete.classList.remove("hidden");
}

function continueToNextWave() {
  wave++;
  waveKills = 0;
  waveCoins = 0;
  nextWaveKillTarget = 12 + Math.floor(wave * 1.5);
  spawnDelay = Math.max(.34, 1.2 - wave * .06);
  waveBreakActive = false;
  paused = false;

  UI.inventory.classList.add("hidden");
  inventoryOpen = false;
  UI.waveComplete.classList.add("hidden");
  UI.shop.classList.add("hidden");

  showWave(wave);
  lastTime = performance.now();
  raf = requestAnimationFrame(loop);

  if (!isMobile()) {
    setTimeout(lockMouse, 60);
  }
}

function openShop() {
  UI.waveComplete.classList.add("hidden");
  UI.shop.classList.remove("hidden");
  updateShopUI();
}

function closeShopAndContinue() {
  UI.shop.classList.add("hidden");
  continueToNextWave();
}

UI.continueWaveBtn.addEventListener("click", continueToNextWave);
UI.openShopBtn.addEventListener("click", openShop);
UI.closeShopBtn.addEventListener("click", closeShopAndContinue);

const upgradeConfig = {
  pistolDamage: { base: 40, step: 30, max: 8 },
  smgRate: { base: 60, step: 38, max: 8 },
  shotgunPower: { base: 75, step: 45, max: 8 },
  maxHealth: { base: 50, step: 35, max: 7 },
  armor: { base: 55, step: 40, max: 6 },
  speed: { base: 65, step: 42, max: 7 }
};

function upgradeCost(name) {
  const config = upgradeConfig[name];
  return config.base + (upgrades[name] - (name === "armor" ? 0 : 1)) * config.step;
}

function buyUpgrade(name) {
  const config = upgradeConfig[name];
  if (!config || upgrades[name] >= config.max) return;

  const cost = upgradeCost(name);
  if (coins < cost) {
    beep(120, .12, "square", .04);
    return;
  }

  coins -= cost;
  upgrades[name]++;

  localStorage.setItem("potaraZombieCoins", String(coins));
  localStorage.setItem("potaraZombieUpgrades", JSON.stringify(upgrades));

  beep(720, .15, "triangle", .05);
  updateShopUI();
  updateUI();
}

document.querySelectorAll("[data-upgrade]").forEach((button) => {
  button.addEventListener("click", () => {
    buyUpgrade(button.dataset.upgrade);
  });
});

function updateShopUI() {
  UI.shopCoins.textContent = coins;

  const fields = {
    pistolDamage: ["pistolDamageLevel", "pistolDamageCost"],
    smgRate: ["smgRateLevel", "smgRateCost"],
    shotgunPower: ["shotgunPowerLevel", "shotgunPowerCost"],
    maxHealth: ["maxHealthLevel", "maxHealthCost"],
    armor: ["armorLevel", "armorCost"],
    speed: ["speedLevel", "speedCost"]
  };

  for (const [name, ids] of Object.entries(fields)) {
    const [levelId, costId] = ids;
    const maxed = upgrades[name] >= upgradeConfig[name].max;

    $(levelId).textContent = `Level ${upgrades[name]}`;
    $(costId).textContent = maxed ? "MAX" : upgradeCost(name);

    const button = document.querySelector(`[data-upgrade="${name}"]`);
    button.disabled = maxed;
  }
}

function updateBossAttacks(dt) {
  const boss = zombies.find(z => z.type === "boss");

  if (!boss || waveBreakActive || paused) {
    bossAttackTimer = 0;
    UI.bossBar.classList.remove("rage");
    return;
  }

  const rage = boss.health / boss.maxHealth < .35;
  UI.bossBar.classList.toggle("rage", rage);

  bossAttackTimer += dt;

  const attackDelay = rage ? 2.1 : 3.4;

  if (bossAttackTimer < attackDelay) return;
  bossAttackTimer = 0;

  const distance = Math.hypot(player.x - boss.x, player.y - boss.y);

  if (distance < 260) {
    bossSlam(boss);
  } else {
    bossCharge(boss);
  }
}

function bossSlam(boss) {
  burst(boss.x, boss.y, "#ff4f88", 45, 280);
  shake = Math.max(shake, 20);
  beep(70, .3, "sawtooth", .1);

  if (Math.hypot(player.x - boss.x, player.y - boss.y) < 240) {
    damagePlayer(18);
  }

  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2;
    const x = clamp(boss.x + Math.cos(angle) * 120, 50, WORLD.w - 50);
    const y = clamp(boss.y + Math.sin(angle) * 120, 50, WORLD.h - 50);

    zombies.push({
      type: "runner",
      x,
      y,
      r: 20,
      speed: 155 * (1 + wave * .05),
      health: 2,
      maxHealth: 2,
      damage: 7,
      hit: 0,
      attack: 0,
      walk: Math.random() * 10,
      angle: 0
    });
  }
}

function bossCharge(boss) {
  const angle = Math.atan2(player.y - boss.y, player.x - boss.x);

  boss.x = clamp(boss.x + Math.cos(angle) * 150, boss.r, WORLD.w - boss.r);
  boss.y = clamp(boss.y + Math.sin(angle) * 150, boss.r, WORLD.h - boss.r);

  burst(boss.x, boss.y, "#ff784f", 24, 220);
  shake = Math.max(shake, 11);
  beep(95, .16, "square", .06);
}


function drawInterior() {
  ctx.fillStyle = "#090d0a";
  ctx.fillRect(0, 0, innerWidth, innerHeight);

  const origin = worldToScreen(0, 0);

  const floor = ctx.createLinearGradient(0, 0, 0, innerHeight);
  floor.addColorStop(0, "#202820");
  floor.addColorStop(1, "#101611");
  ctx.fillStyle = floor;
  ctx.fillRect(origin.x, origin.y, interior.width, interior.height);

  ctx.strokeStyle = "#3b493d";
  ctx.lineWidth = 35;
  ctx.strokeRect(
    origin.x + 18,
    origin.y + 18,
    interior.width - 36,
    interior.height - 36
  );

  ctx.fillStyle = "#1b241d";
  ctx.fillRect(
    origin.x + 320,
    origin.y + 250,
    360,
    85
  );

  ctx.fillStyle = "#222b24";
  ctx.fillRect(
    origin.x + 120,
    origin.y + 455,
    230,
    70
  );
  ctx.fillRect(
    origin.x + 650,
    origin.y + 455,
    230,
    70
  );

  ctx.fillStyle = "#1c231d";
  for (let x = 70; x < interior.width; x += 95) {
    for (let y = 75; y < interior.height; y += 95) {
      ctx.fillRect(origin.x + x, origin.y + y, 3, 3);
    }
  }

  for (const crate of interior.crates) {
    drawInteriorCrate(crate);
  }

  const exit = worldToScreen(interior.exitX, interior.exitY);

  ctx.fillStyle = "rgba(87,255,109,.12)";
  ctx.fillRect(exit.x - 55, exit.y - 18, 110, 36);

  ctx.strokeStyle = "rgba(87,255,109,.55)";
  ctx.strokeRect(exit.x - 55, exit.y - 18, 110, 36);

  ctx.fillStyle = varColor("#57ff6d");
  ctx.font = '700 9px "Orbitron"';
  ctx.textAlign = "center";
  ctx.fillText("EXIT", exit.x, exit.y + 4);

  drawPlayer();
}

function drawInteriorCrate(crate) {
  const point = worldToScreen(crate.x, crate.y);

  ctx.save();
  ctx.translate(point.x, point.y);

  ctx.fillStyle = crate.opened ? "#27241c" : "#4b3920";
  ctx.fillRect(-25, -18, 50, 36);

  ctx.strokeStyle = crate.opened ? "#403a2b" : "#c8943e";
  ctx.lineWidth = 3;
  ctx.strokeRect(-25, -18, 50, 36);

  ctx.fillStyle = crate.opened ? "#171713" : "#ffe45c";
  ctx.fillRect(-4, -5, 8, 10);

  ctx.restore();
}

function varColor(value) {
  return value;
}

/* UI/game over */
function updateUI(){
  const hp=player.health/player.maxHealth;
  UI.healthFill.style.width=hp*100+"%";
  UI.healthText.textContent=Math.ceil(player.health)+" / "+player.maxHealth;
  UI.armorText.textContent="ARMOR: "+Math.ceil(player.armor);
  UI.weaponName.textContent = WEAPONS[currentWeapon].name;
  UI.ammoText.textContent = ammo;
  UI.reserveAmmoText.textContent = "/ ∞";
  UI.coins.textContent = coins;
  if (UI.shopCoins) UI.shopCoins.textContent = coins;
  UI.kills.textContent=kills;
  UI.score.textContent=score;
  UI.wave.textContent=wave;
  UI.best.textContent=highScore;
  UI.healthFill.style.background=hp>.55?"linear-gradient(90deg,#20d957,#b7ff74)":hp>.25?"linear-gradient(90deg,#ffad32,#ffe45c)":"linear-gradient(90deg,#d91840,#ff6745)";
}

function showWave(n){
  if(n===lastWaveShown)return;
  lastWaveShown=n;
  UI.waveBannerNumber.textContent=n;
  UI.waveBanner.classList.add("show");
  beep(110+n*10,.35,"sawtooth",.035);
  setTimeout(()=>UI.waveBanner.classList.remove("show"),1400);
}

function endGame(){
  running=false;paused=false;
  unlockMouse();
  cancelAnimationFrame(raf);
  clearInterval(shootInterval);
  stopJoystick();
  if(score>highScore){
    highScore=score;
    localStorage.setItem("potaraZombieV2Best",String(highScore));
  }
  UI.finalScore.textContent=score;
  UI.finalKills.textContent=kills;
  UI.finalWave.textContent=wave;
  UI.finalBest.textContent=highScore;
  UI.best.textContent=highScore;
  UI.waveComplete.classList.add("hidden");
  UI.shop.classList.add("hidden");
  UI.over.classList.remove("hidden");
}

function loop(now){
  if(!running||paused)return;
  const dt=Math.min((now-lastTime)/1000,.033);
  lastTime=now;
  update(dt);
  draw();
  raf=requestAnimationFrame(loop);
}

createWorld();
resize();
updateUI();
draw();


document.addEventListener("visibilitychange", () => {
  if (document.hidden && running && !paused) {
    pauseGame(true);
  }
});

window.addEventListener("beforeunload", unlockMouse);
