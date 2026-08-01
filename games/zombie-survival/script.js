"use strict";

/* =====================================
   HTML ELEMENTS
===================================== */

const gameLoader = document.getElementById("gameLoader");
const loaderProgress = document.getElementById("loaderProgress");
const loaderPercent = document.getElementById("loaderPercent");
const loaderStatus = document.getElementById("loaderStatus");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const pauseScreen = document.getElementById("pauseScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const startButton = document.getElementById("startButton");
const resumeButton = document.getElementById("resumeButton");
const restartButton = document.getElementById("restartButton");

const pauseButton = document.getElementById("pauseButton");
const soundButton = document.getElementById("soundButton");

const healthFill = document.getElementById("healthFill");
const healthText = document.getElementById("healthText");
const armorText = document.getElementById("armorText");

const scoreText = document.getElementById("scoreText");
const killsText = document.getElementById("killsText");
const waveText = document.getElementById("waveText");
const highScoreText = document.getElementById("highScoreText");

const ammoText = document.getElementById("ammoText");
const reloadBar = document.getElementById("reloadBar");
const reloadProgress = document.getElementById("reloadProgress");

const finalScore = document.getElementById("finalScore");
const finalKills = document.getElementById("finalKills");
const finalWave = document.getElementById("finalWave");
const finalBest = document.getElementById("finalBest");

const damageFlash = document.getElementById("damageFlash");

const waveAnnouncement =
    document.getElementById("waveAnnouncement");

const waveAnnouncementNumber =
    document.getElementById("waveAnnouncementNumber");

const tankHealthPanel =
    document.getElementById("tankHealthPanel");

const tankHealthFill =
    document.getElementById("tankHealthFill");

const joystickArea = document.getElementById("joystickArea");
const joystickStick = document.getElementById("joystickStick");

const shootButton = document.getElementById("shootButton");
const reloadButton = document.getElementById("reloadButton");

/* =====================================
   GAME SETTINGS
===================================== */

const WORLD_WIDTH = 3200;
const WORLD_HEIGHT = 2400;

const PLAYER_MAX_HEALTH = 100;
const PLAYER_SPEED = 285;

const MAGAZINE_SIZE = 12;
const RELOAD_TIME = 1.15;
const FIRE_DELAY = 0.2;

const keys = {};

let gameRunning = false;
let gamePaused = false;
let lastTime = 0;

let score = 0;
let kills = 0;
let wave = 1;
let lastAnnouncedWave = 0;

let highScore = Number(
    localStorage.getItem("potaraZombieHighScore") || 0
);

let bullets = [];
let zombies = [];
let particles = [];
let decorations = [];
let buildings = [];
let pickups = [];

let zombieSpawnTimer = 0;
let zombieSpawnDelay = 1.3;

let mouseX = 0;
let mouseY = 0;

let screenShake = 0;
let muzzleFlash = 0;
let fogTime = 0;

let ammo = MAGAZINE_SIZE;
let reloading = false;
let reloadTimer = 0;
let fireCooldown = 0;

let soundEnabled = true;
let audioContext = null;

let gameLoopId = null;

/* =====================================
   CAMERA
===================================== */

const camera = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    shakeX: 0,
    shakeY: 0
};

/* =====================================
   PLAYER
===================================== */

const player = {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
    radius: 24,
    speed: PLAYER_SPEED,
    health: PLAYER_MAX_HEALTH,
    maxHealth: PLAYER_MAX_HEALTH,
    armor: 0,
    aimAngle: 0,
    walkTime: 0
};

/* =====================================
   MOBILE JOYSTICK
===================================== */

const joystick = {
    active: false,
    x: 0,
    y: 0,
    pointerId: null
};

/* =====================================
   LOADING SCREEN
===================================== */

const loadingMessages = [
    "Preparing weapons...",
    "Scanning infected zone...",
    "Generating abandoned city...",
    "Releasing zombie infection...",
    "Activating survival systems...",
    "Mission ready!"
];

let loadingValue = 0;

function runGameLoader() {
    const interval = setInterval(function () {
        loadingValue += Math.floor(Math.random() * 9) + 4;
        loadingValue = Math.min(loadingValue, 100);

        loaderProgress.style.width = loadingValue + "%";
        loaderPercent.textContent = loadingValue + "%";

        const messageIndex = Math.min(
            Math.floor(
                loadingValue /
                (100 / loadingMessages.length)
            ),
            loadingMessages.length - 1
        );

        loaderStatus.textContent =
            loadingMessages[messageIndex];

        if (loadingValue >= 100) {
            clearInterval(interval);

            setTimeout(function () {
                gameLoader.classList.add("loader-hidden");

                setTimeout(function () {
                    gameLoader.style.display = "none";
                }, 900);
            }, 600);
        }
    }, 130);
}

window.addEventListener("load", function () {
    setTimeout(runGameLoader, 300);
});

/* =====================================
   CANVAS
===================================== */

function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);

    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!gameRunning) {
        updateCameraInstant();
        draw();
    }
}

window.addEventListener("resize", resizeCanvas);

/* =====================================
   WORLD CREATION
===================================== */

function createWorld() {
    decorations = [];
    buildings = [];
    pickups = [];

    createBuildings();
    createTrees();
    createRocks();
    createBarrels();
}

function createBuildings() {
    const buildingData = [
        { x: 180, y: 190, w: 420, h: 290 },
        { x: 830, y: 130, w: 360, h: 250 },
        { x: 1440, y: 170, w: 520, h: 300 },
        { x: 2300, y: 150, w: 480, h: 340 },

        { x: 180, y: 900, w: 470, h: 330 },
        { x: 2500, y: 850, w: 470, h: 330 },

        { x: 220, y: 1750, w: 430, h: 350 },
        { x: 1020, y: 1900, w: 430, h: 260 },
        { x: 1700, y: 1820, w: 500, h: 310 },
        { x: 2550, y: 1740, w: 400, h: 350 }
    ];

    buildingData.forEach(function (data, index) {
        buildings.push({
            x: data.x,
            y: data.y,
            w: data.w,
            h: data.h,
            height: 65 + (index % 3) * 18,
            color: index % 2 === 0
                ? "#1a241c"
                : "#202820",
            roof: index % 2 === 0
                ? "#273229"
                : "#252d26"
        });
    });
}

function createTrees() {
    for (let i = 0; i < 75; i++) {
        let position = getSafeRandomPosition(55);

        decorations.push({
            type: "tree",
            x: position.x,
            y: position.y,
            radius: 28 + Math.random() * 18,
            height: 38 + Math.random() * 25,
            shade: Math.random()
        });
    }
}

function createRocks() {
    for (let i = 0; i < 50; i++) {
        let position = getSafeRandomPosition(35);

        decorations.push({
            type: "rock",
            x: position.x,
            y: position.y,
            radius: 14 + Math.random() * 18,
            rotation: Math.random() * Math.PI,
            shade: Math.random()
        });
    }
}

function createBarrels() {
    for (let i = 0; i < 35; i++) {
        let position = getSafeRandomPosition(28);

        decorations.push({
            type: "barrel",
            x: position.x,
            y: position.y,
            radius: 15,
            explosive: Math.random() > 0.55
        });
    }
}

function getSafeRandomPosition(margin) {
    let x;
    let y;
    let attempts = 0;

    do {
        x = margin + Math.random() * (WORLD_WIDTH - margin * 2);
        y = margin + Math.random() * (WORLD_HEIGHT - margin * 2);
        attempts++;
    } while (
        (
            pointInsideBuilding(x, y, margin + 20) ||
            Math.hypot(
                x - WORLD_WIDTH / 2,
                y - WORLD_HEIGHT / 2
            ) < 250
        ) &&
        attempts < 100
    );

    return { x, y };
}

function pointInsideBuilding(x, y, padding = 0) {
    return buildings.some(function (building) {
        return (
            x > building.x - padding &&
            x < building.x + building.w + padding &&
            y > building.y - padding &&
            y < building.y + building.h + padding
        );
    });
}

/* =====================================
   START / RESET
===================================== */

function resetGame() {
    score = 0;
    kills = 0;
    wave = 1;
    lastAnnouncedWave = 0;

    bullets = [];
    zombies = [];
    particles = [];
    pickups = [];

    zombieSpawnTimer = 0;
    zombieSpawnDelay = 1.3;

    screenShake = 0;
    muzzleFlash = 0;

    ammo = MAGAZINE_SIZE;
    reloading = false;
    reloadTimer = 0;
    fireCooldown = 0;

    player.x = WORLD_WIDTH / 2;
    player.y = WORLD_HEIGHT / 2;
    player.health = player.maxHealth;
    player.armor = 0;
    player.aimAngle = 0;
    player.walkTime = 0;

    createWorld();
    updateCameraInstant();
    updateUI();
}

function startGame() {
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }

    resetGame();

    gameRunning = true;
    gamePaused = false;

    startScreen.style.display = "none";
    pauseScreen.style.display = "none";
    gameOverScreen.style.display = "none";

    showWaveAnnouncement(1);

    lastTime = performance.now();
    gameLoopId = requestAnimationFrame(gameLoop);
}

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

/* =====================================
   PAUSE
===================================== */

function pauseGame() {
    if (!gameRunning || gamePaused) {
        return;
    }

    gamePaused = true;
    pauseScreen.style.display = "grid";
}

function resumeGame() {
    if (!gameRunning || !gamePaused) {
        return;
    }

    gamePaused = false;
    pauseScreen.style.display = "none";

    lastTime = performance.now();
    gameLoopId = requestAnimationFrame(gameLoop);
}

pauseButton.addEventListener("click", function () {
    if (gamePaused) {
        resumeGame();
    } else {
        pauseGame();
    }
});

resumeButton.addEventListener("click", resumeGame);

/* =====================================
   INPUT
===================================== */

window.addEventListener("keydown", function (event) {
    keys[event.key.toLowerCase()] = true;

    if (event.code === "Space") {
        event.preventDefault();
        shootBullet();
    }

    if (event.key.toLowerCase() === "r") {
        startReload();
    }

    if (event.key === "Escape") {
        if (gamePaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
});

window.addEventListener("keyup", function (event) {
    keys[event.key.toLowerCase()] = false;
});

canvas.addEventListener("mousemove", function (event) {
    mouseX = event.clientX;
    mouseY = event.clientY;

    const worldMouse = screenToWorld(mouseX, mouseY);

    player.aimAngle = Math.atan2(
        worldMouse.y - player.y,
        worldMouse.x - player.x
    );
});

canvas.addEventListener("mousedown", function () {
    shootBullet();
});

/* =====================================
   JOYSTICK
===================================== */

joystickArea.addEventListener("pointerdown", function (event) {
    joystick.active = true;
    joystick.pointerId = event.pointerId;

    joystickArea.setPointerCapture(event.pointerId);
    updateJoystick(event);
});

joystickArea.addEventListener("pointermove", function (event) {
    if (
        joystick.active &&
        event.pointerId === joystick.pointerId
    ) {
        updateJoystick(event);
    }
});

joystickArea.addEventListener("pointerup", stopJoystick);
joystickArea.addEventListener("pointercancel", stopJoystick);

function updateJoystick(event) {
    const base = joystickArea.querySelector(".joystick-base");
    const rect = base.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;

    const maxDistance = rect.width / 2 - 30;
    const distance = Math.hypot(dx, dy);

    if (distance > maxDistance) {
        dx = (dx / distance) * maxDistance;
        dy = (dy / distance) * maxDistance;
    }

    joystick.x = dx / maxDistance;
    joystick.y = dy / maxDistance;

    joystickStick.style.transform =
        `translate(${dx}px, ${dy}px)`;
}

function stopJoystick(event = {}) {
    if (
        event.pointerId !== undefined &&
        event.pointerId !== joystick.pointerId
    ) {
        return;
    }

    joystick.active = false;
    joystick.x = 0;
    joystick.y = 0;
    joystick.pointerId = null;

    joystickStick.style.transform = "translate(0, 0)";
}

/* =====================================
   MOBILE SHOOTING
===================================== */

let shootingInterval = null;

shootButton.addEventListener("pointerdown", function (event) {
    event.preventDefault();

    shootBullet();

    clearInterval(shootingInterval);

    shootingInterval = setInterval(function () {
        shootBullet();
    }, FIRE_DELAY * 1000);
});

function stopShooting() {
    clearInterval(shootingInterval);
    shootingInterval = null;
}

shootButton.addEventListener("pointerup", stopShooting);
shootButton.addEventListener("pointercancel", stopShooting);
shootButton.addEventListener("pointerleave", stopShooting);

reloadButton.addEventListener("click", startReload);

/* =====================================
   AUDIO
===================================== */

function getAudioContext() {
    if (!audioContext) {
        audioContext = new (
            window.AudioContext ||
            window.webkitAudioContext
        )();
    }

    return audioContext;
}

function playSound(frequency, duration, type, volume) {
    if (!soundEnabled) {
        return;
    }

    try {
        const audio = getAudioContext();

        const oscillator = audio.createOscillator();
        const gain = audio.createGain();

        oscillator.connect(gain);
        gain.connect(audio.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(
            frequency,
            audio.currentTime
        );

        oscillator.frequency.exponentialRampToValueAtTime(
            Math.max(40, frequency * 0.5),
            audio.currentTime + duration
        );

        gain.gain.setValueAtTime(
            volume,
            audio.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audio.currentTime + duration
        );

        oscillator.start();
        oscillator.stop(audio.currentTime + duration);
    } catch (error) {
        console.log("Audio error:", error);
    }
}

soundButton.addEventListener("click", function () {
    soundEnabled = !soundEnabled;
    soundButton.textContent = soundEnabled ? "🔊" : "🔇";

    if (soundEnabled) {
        playSound(500, 0.12, "sine", 0.06);
    }
});

/* =====================================
   SHOOT / RELOAD
===================================== */

function shootBullet() {
    if (
        !gameRunning ||
        gamePaused ||
        reloading ||
        fireCooldown > 0
    ) {
        return;
    }

    if (ammo <= 0) {
        startReload();
        return;
    }

    let angle = player.aimAngle;

    if (isMobileDevice()) {
        const target = findNearestZombie();

        if (target) {
            angle = Math.atan2(
                target.y - player.y,
                target.x - player.x
            );

            player.aimAngle = angle;
        }
    }

    ammo--;
    fireCooldown = FIRE_DELAY;
    muzzleFlash = 0.09;
    screenShake = Math.max(screenShake, 5);

    const gunX =
        player.x + Math.cos(angle) * 38;

    const gunY =
        player.y + Math.sin(angle) * 38;

    bullets.push({
        x: gunX,
        y: gunY,
        previousX: gunX,
        previousY: gunY,
        radius: 4,
        speed: 930,
        angle: angle,
        life: 1.2,
        damage: 1
    });

    createParticles(
        gunX,
        gunY,
        "#ffd85c",
        7,
        180
    );

    playSound(170, 0.09, "sawtooth", 0.08);

    if (ammo === 0) {
        setTimeout(startReload, 180);
    }

    updateUI();
}

function startReload() {
    if (
        !gameRunning ||
        gamePaused ||
        reloading ||
        ammo === MAGAZINE_SIZE
    ) {
        return;
    }

    reloading = true;
    reloadTimer = 0;

    reloadBar.classList.add("show");
    reloadProgress.style.width = "0%";

    playSound(350, 0.12, "square", 0.03);
}

function updateReload(deltaTime) {
    if (!reloading) {
        return;
    }

    reloadTimer += deltaTime;

    const progress = Math.min(
        reloadTimer / RELOAD_TIME,
        1
    );

    reloadProgress.style.width =
        progress * 100 + "%";

    if (progress >= 1) {
        reloading = false;
        ammo = MAGAZINE_SIZE;

        reloadBar.classList.remove("show");

        playSound(560, 0.1, "square", 0.04);
        updateUI();
    }
}

function findNearestZombie() {
    let nearest = null;
    let nearestDistance = Infinity;

    zombies.forEach(function (zombie) {
        const distance = Math.hypot(
            zombie.x - player.x,
            zombie.y - player.y
        );

        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = zombie;
        }
    });

    return nearest;
}

function isMobileDevice() {
    return (
        window.matchMedia("(pointer: coarse)").matches ||
        window.innerWidth <= 900
    );
}

/* =====================================
   ZOMBIES
===================================== */

function spawnZombie() {
    const spawnPosition = getZombieSpawnPosition();

    const random = Math.random();

    let type = "normal";

    if (wave >= 2 && random > 0.76) {
        type = "runner";
    }

    if (wave >= 4 && random > 0.92) {
        type = "tank";
    }

    const zombie = createZombie(
        type,
        spawnPosition.x,
        spawnPosition.y
    );

    zombies.push(zombie);
}

function createZombie(type, x, y) {
    const waveBoost = 1 + wave * 0.055;

    if (type === "runner") {
        return {
            type: "runner",
            x,
            y,
            radius: 21,
            speed: 145 * waveBoost,
            health: 1 + Math.floor(wave / 6),
            maxHealth: 1 + Math.floor(wave / 6),
            damage: 7,
            damageTimer: 0,
            rotation: 0,
            walkTime: Math.random() * 10,
            hitFlash: 0
        };
    }

    if (type === "tank") {
        const health = 8 + Math.floor(wave * 1.2);

        return {
            type: "tank",
            x,
            y,
            radius: 39,
            speed: 48 * waveBoost,
            health,
            maxHealth: health,
            damage: 18,
            damageTimer: 0,
            rotation: 0,
            walkTime: Math.random() * 10,
            hitFlash: 0
        };
    }

    const health = 2 + Math.floor(wave / 4);

    return {
        type: "normal",
        x,
        y,
        radius: 27,
        speed: 78 * waveBoost,
        health,
        maxHealth: health,
        damage: 10,
        damageTimer: 0,
        rotation: 0,
        walkTime: Math.random() * 10,
        hitFlash: 0
    };
}

function getZombieSpawnPosition() {
    const angle = Math.random() * Math.PI * 2;
    const distance =
        Math.max(window.innerWidth, window.innerHeight) * 0.72 +
        300;

    let x = player.x + Math.cos(angle) * distance;
    let y = player.y + Math.sin(angle) * distance;

    x = clamp(x, 60, WORLD_WIDTH - 60);
    y = clamp(y, 60, WORLD_HEIGHT - 60);

    if (pointInsideBuilding(x, y, 70)) {
        return getSafeRandomPosition(70);
    }

    return { x, y };
}

/* =====================================
   UPDATE
===================================== */

function update(deltaTime) {
    fogTime += deltaTime;

    fireCooldown = Math.max(0, fireCooldown - deltaTime);
    muzzleFlash = Math.max(0, muzzleFlash - deltaTime);
    screenShake = Math.max(0, screenShake - 22 * deltaTime);

    updateReload(deltaTime);
    updatePlayer(deltaTime);
    updateBullets(deltaTime);
    updateZombies(deltaTime);
    updateParticles(deltaTime);
    updatePickups(deltaTime);
    updateCamera(deltaTime);

    zombieSpawnTimer += deltaTime;

    if (zombieSpawnTimer >= zombieSpawnDelay) {
        zombieSpawnTimer = 0;
        spawnZombie();
    }

    const newWave = Math.floor(kills / 12) + 1;

    if (newWave !== wave) {
        wave = newWave;
        zombieSpawnDelay = Math.max(
            0.36,
            1.3 - wave * 0.07
        );

        showWaveAnnouncement(wave);
    }

    updateUI();
}

/* =====================================
   PLAYER UPDATE
===================================== */

function updatePlayer(deltaTime) {
    let moveX = 0;
    let moveY = 0;

    if (keys["w"] || keys["arrowup"]) {
        moveY -= 1;
    }

    if (keys["s"] || keys["arrowdown"]) {
        moveY += 1;
    }

    if (keys["a"] || keys["arrowleft"]) {
        moveX -= 1;
    }

    if (keys["d"] || keys["arrowright"]) {
        moveX += 1;
    }

    moveX += joystick.x;
    moveY += joystick.y;

    const length = Math.hypot(moveX, moveY);

    if (length > 0) {
        moveX /= length;
        moveY /= length;

        player.walkTime += deltaTime * 10;
    }

    const oldX = player.x;
    const oldY = player.y;

    player.x += moveX * player.speed * deltaTime;
    player.y += moveY * player.speed * deltaTime;

    player.x = clamp(
        player.x,
        player.radius,
        WORLD_WIDTH - player.radius
    );

    player.y = clamp(
        player.y,
        player.radius,
        WORLD_HEIGHT - player.radius
    );

    resolveBuildingCollision(
        player,
        oldX,
        oldY,
        player.radius
    );

    collectNearbyPickups();
}

function resolveBuildingCollision(
    entity,
    oldX,
    oldY,
    radius
) {
    buildings.forEach(function (building) {
        const closestX = clamp(
            entity.x,
            building.x,
            building.x + building.w
        );

        const closestY = clamp(
            entity.y,
            building.y,
            building.y + building.h
        );

        const dx = entity.x - closestX;
        const dy = entity.y - closestY;

        if (dx * dx + dy * dy < radius * radius) {
            entity.x = oldX;
            entity.y = oldY;
        }
    });
}

/* =====================================
   BULLET UPDATE
===================================== */

function updateBullets(deltaTime) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        bullet.previousX = bullet.x;
        bullet.previousY = bullet.y;

        bullet.x +=
            Math.cos(bullet.angle) *
            bullet.speed *
            deltaTime;

        bullet.y +=
            Math.sin(bullet.angle) *
            bullet.speed *
            deltaTime;

        bullet.life -= deltaTime;

        if (
            bullet.life <= 0 ||
            bullet.x < 0 ||
            bullet.x > WORLD_WIDTH ||
            bullet.y < 0 ||
            bullet.y > WORLD_HEIGHT ||
            pointInsideBuilding(bullet.x, bullet.y)
        ) {
            createParticles(
                bullet.x,
                bullet.y,
                "#d8d5b8",
                5,
                80
            );

            bullets.splice(i, 1);
            continue;
        }

        let bulletRemoved = false;

        for (let j = zombies.length - 1; j >= 0; j--) {
            const zombie = zombies[j];

            const distance = Math.hypot(
                bullet.x - zombie.x,
                bullet.y - zombie.y
            );

            if (distance < bullet.radius + zombie.radius) {
                zombie.health -= bullet.damage;
                zombie.hitFlash = 0.1;

                createParticles(
                    bullet.x,
                    bullet.y,
                    zombie.type === "tank"
                        ? "#8dff6d"
                        : "#51d95f",
                    10,
                    170
                );

                bullets.splice(i, 1);
                bulletRemoved = true;

                screenShake = Math.max(
                    screenShake,
                    zombie.type === "tank" ? 5 : 2.5
                );

                if (zombie.health <= 0) {
                    killZombie(j, zombie);
                }

                break;
            }
        }

        if (bulletRemoved) {
            continue;
        }
    }
}

function killZombie(index, zombie) {
    zombies.splice(index, 1);

    kills++;

    let reward = 100;

    if (zombie.type === "runner") {
        reward = 160;
    }

    if (zombie.type === "tank") {
        reward = 500;
        screenShake = 18;
    }

    score += reward * wave;

    createParticles(
        zombie.x,
        zombie.y,
        zombie.type === "tank"
            ? "#7aff54"
            : "#41cc55",
        zombie.type === "tank" ? 45 : 22,
        zombie.type === "tank" ? 300 : 220
    );

    if (Math.random() < 0.13) {
        spawnPickup(zombie.x, zombie.y);
    }

    playSound(
        zombie.type === "tank" ? 70 : 110,
        zombie.type === "tank" ? 0.28 : 0.13,
        "sawtooth",
        zombie.type === "tank" ? 0.08 : 0.035
    );
}

/* =====================================
   ZOMBIE UPDATE
===================================== */

function updateZombies(deltaTime) {
    let visibleTank = null;

    for (let i = zombies.length - 1; i >= 0; i--) {
        const zombie = zombies[i];

        zombie.damageTimer -= deltaTime;
        zombie.hitFlash = Math.max(
            0,
            zombie.hitFlash - deltaTime
        );

        zombie.walkTime += deltaTime * (
            zombie.type === "runner" ? 14 : 8
        );

        const angle = Math.atan2(
            player.y - zombie.y,
            player.x - zombie.x
        );

        zombie.rotation = angle;

        const oldX = zombie.x;
        const oldY = zombie.y;

        zombie.x +=
            Math.cos(angle) *
            zombie.speed *
            deltaTime;

        zombie.y +=
            Math.sin(angle) *
            zombie.speed *
            deltaTime;

        resolveBuildingCollision(
            zombie,
            oldX,
            oldY,
            zombie.radius
        );

        const distance = Math.hypot(
            zombie.x - player.x,
            zombie.y - player.y
        );

        if (
            distance <
                zombie.radius +
                player.radius &&
            zombie.damageTimer <= 0
        ) {
            damagePlayer(zombie.damage);

            zombie.damageTimer =
                zombie.type === "runner"
                    ? 0.48
                    : 0.72;
        }

        if (
            zombie.type === "tank" &&
            isWorldPointVisible(zombie.x, zombie.y)
        ) {
            visibleTank = zombie;
        }
    }

    updateTankHealthPanel(visibleTank);
}

function damagePlayer(amount) {
    let remainingDamage = amount;

    if (player.armor > 0) {
        const absorbed = Math.min(
            player.armor,
            remainingDamage
        );

        player.armor -= absorbed;
        remainingDamage -= absorbed;
    }

    player.health -= remainingDamage;

    screenShake = Math.max(screenShake, 14);

    createParticles(
        player.x,
        player.y,
        "#ff385c",
        18,
        250
    );

    showDamageFlash();
    playSound(95, 0.18, "square", 0.07);

    if (player.health <= 0) {
        player.health = 0;
        endGame();
    }
}

/* =====================================
   PICKUPS
===================================== */

function spawnPickup(x, y) {
    const random = Math.random();

    let type = "health";

    if (random > 0.55) {
        type = "armor";
    }

    pickups.push({
        type,
        x,
        y,
        radius: 16,
        life: 15,
        floatTime: Math.random() * 10
    });
}

function updatePickups(deltaTime) {
    for (let i = pickups.length - 1; i >= 0; i--) {
        pickups[i].life -= deltaTime;
        pickups[i].floatTime += deltaTime * 4;

        if (pickups[i].life <= 0) {
            pickups.splice(i, 1);
        }
    }
}

function collectNearbyPickups() {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const pickup = pickups[i];

        const distance = Math.hypot(
            player.x - pickup.x,
            player.y - pickup.y
        );

        if (distance < player.radius + pickup.radius + 5) {
            if (pickup.type === "health") {
                player.health = Math.min(
                    player.maxHealth,
                    player.health + 30
                );

                playSound(620, 0.15, "sine", 0.05);
            } else {
                player.armor = Math.min(
                    50,
                    player.armor + 25
                );

                playSound(760, 0.15, "triangle", 0.05);
            }

            pickups.splice(i, 1);
        }
    }
}

/* =====================================
   PARTICLES
===================================== */

function createParticles(
    x,
    y,
    color,
    count,
    maximumSpeed = 180
) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed =
            30 + Math.random() * maximumSpeed;

        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 2 + Math.random() * 4,
            color,
            life: 0.25 + Math.random() * 0.55,
            maxLife: 0.8
        });
    }
}

function updateParticles(deltaTime) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];

        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;

        particle.vx *= 0.97;
        particle.vy *= 0.97;

        particle.life -= deltaTime;

        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

/* =====================================
   CAMERA
===================================== */

function updateCamera(deltaTime) {
    camera.targetX =
        player.x - window.innerWidth / 2;

    camera.targetY =
        player.y - window.innerHeight / 2;

    camera.targetX = clamp(
        camera.targetX,
        0,
        Math.max(0, WORLD_WIDTH - window.innerWidth)
    );

    camera.targetY = clamp(
        camera.targetY,
        0,
        Math.max(0, WORLD_HEIGHT - window.innerHeight)
    );

    const smoothness = 1 - Math.pow(0.001, deltaTime);

    camera.x +=
        (camera.targetX - camera.x) *
        smoothness;

    camera.y +=
        (camera.targetY - camera.y) *
        smoothness;

    if (screenShake > 0) {
        camera.shakeX =
            (Math.random() - 0.5) * screenShake;

        camera.shakeY =
            (Math.random() - 0.5) * screenShake;
    } else {
        camera.shakeX = 0;
        camera.shakeY = 0;
    }
}

function updateCameraInstant() {
    camera.x = clamp(
        player.x - window.innerWidth / 2,
        0,
        Math.max(0, WORLD_WIDTH - window.innerWidth)
    );

    camera.y = clamp(
        player.y - window.innerHeight / 2,
        0,
        Math.max(0, WORLD_HEIGHT - window.innerHeight)
    );

    camera.targetX = camera.x;
    camera.targetY = camera.y;
}

function worldToScreen(x, y) {
    return {
        x: x - camera.x + camera.shakeX,
        y: y - camera.y + camera.shakeY
    };
}

function screenToWorld(x, y) {
    return {
        x: x + camera.x - camera.shakeX,
        y: y + camera.y - camera.shakeY
    };
}

function isWorldPointVisible(x, y, margin = 120) {
    const position = worldToScreen(x, y);

    return (
        position.x > -margin &&
        position.x < window.innerWidth + margin &&
        position.y > -margin &&
        position.y < window.innerHeight + margin
    );
}

/* =====================================
   DRAW
===================================== */

function draw() {
    ctx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );

    drawFake3DGround();
    drawWorldBoundary();

    const renderables = [];

    buildings.forEach(function (building) {
        renderables.push({
            y: building.y + building.h,
            draw: function () {
                drawBuilding(building);
            }
        });
    });

    decorations.forEach(function (decoration) {
        renderables.push({
            y: decoration.y,
            draw: function () {
                drawDecoration(decoration);
            }
        });
    });

    pickups.forEach(function (pickup) {
        renderables.push({
            y: pickup.y,
            draw: function () {
                drawPickup(pickup);
            }
        });
    });

    zombies.forEach(function (zombie) {
        renderables.push({
            y: zombie.y + zombie.radius,
            draw: function () {
                drawZombie(zombie);
            }
        });
    });

    renderables.push({
        y: player.y + player.radius,
        draw: drawPlayer
    });

    renderables.sort(function (a, b) {
        return a.y - b.y;
    });

    drawGroundShadows(renderables);

    renderables.forEach(function (item) {
        item.draw();
    });

    drawBullets();
    drawParticles();
    drawLightingAndFog();
    drawVignette();
}

/* =====================================
   FAKE 3D GROUND
===================================== */

function drawFake3DGround() {
    ctx.fillStyle = "#071009";
    ctx.fillRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );

    const horizon = window.innerHeight * 0.28;

    const groundGradient =
        ctx.createLinearGradient(
            0,
            horizon,
            0,
            window.innerHeight
        );

    groundGradient.addColorStop(0, "#121a13");
    groundGradient.addColorStop(0.35, "#0c150e");
    groundGradient.addColorStop(1, "#050a06");

    ctx.fillStyle = groundGradient;
    ctx.fillRect(
        0,
        horizon,
        window.innerWidth,
        window.innerHeight - horizon
    );

    ctx.save();

    ctx.strokeStyle = "rgba(129, 180, 133, 0.07)";
    ctx.lineWidth = 1;

    const gridSize = 110;

    const offsetX =
        -((camera.x - camera.shakeX) % gridSize);

    const offsetY =
        -((camera.y - camera.shakeY) % gridSize);

    for (
        let x = offsetX - gridSize;
        x < window.innerWidth + gridSize;
        x += gridSize
    ) {
        ctx.beginPath();
        ctx.moveTo(
            window.innerWidth / 2 +
                (x - window.innerWidth / 2) * 0.28,
            horizon
        );
        ctx.lineTo(x, window.innerHeight);
        ctx.stroke();
    }

    for (
        let y = horizon + offsetY;
        y < window.innerHeight + gridSize;
        y += gridSize
    ) {
        const perspective =
            (y - horizon) /
            (window.innerHeight - horizon);

        const curvedY =
            horizon +
            perspective *
            perspective *
            (window.innerHeight - horizon);

        ctx.beginPath();
        ctx.moveTo(0, curvedY);
        ctx.lineTo(window.innerWidth, curvedY);
        ctx.stroke();
    }

    ctx.restore();

    drawRoads();
}

function drawRoads() {
    const roads = [
        {
            x: 1200,
            y: 0,
            w: 300,
            h: WORLD_HEIGHT
        },
        {
            x: 0,
            y: 1260,
            w: WORLD_WIDTH,
            h: 310
        }
    ];

    roads.forEach(function (road) {
        const position = worldToScreen(road.x, road.y);

        ctx.fillStyle = "#111513";
        ctx.fillRect(
            position.x,
            position.y,
            road.w,
            road.h
        );

        ctx.strokeStyle = "rgba(230, 220, 130, 0.18)";
        ctx.lineWidth = 4;
        ctx.setLineDash([35, 30]);

        if (road.w > road.h) {
            ctx.beginPath();
            ctx.moveTo(
                position.x,
                position.y + road.h / 2
            );
            ctx.lineTo(
                position.x + road.w,
                position.y + road.h / 2
            );
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(
                position.x + road.w / 2,
                position.y
            );
            ctx.lineTo(
                position.x + road.w / 2,
                position.y + road.h
            );
            ctx.stroke();
        }

        ctx.setLineDash([]);
    });
}

function drawWorldBoundary() {
    const topLeft = worldToScreen(0, 0);

    ctx.strokeStyle = "rgba(85, 255, 109, 0.15)";
    ctx.lineWidth = 8;

    ctx.strokeRect(
        topLeft.x,
        topLeft.y,
        WORLD_WIDTH,
        WORLD_HEIGHT
    );
}

/* =====================================
   SHADOWS
===================================== */

function drawGroundShadows(renderables) {
    renderables.forEach(function (item) {
        if (!item.draw) {
            return;
        }
    });

    decorations.forEach(function (decoration) {
        if (!isWorldPointVisible(decoration.x, decoration.y)) {
            return;
        }

        const position = worldToScreen(
            decoration.x,
            decoration.y
        );

        if (decoration.type === "tree") {
            drawShadow(
                position.x + 15,
                position.y + 16,
                decoration.radius * 1.3,
                decoration.radius * 0.45
            );
        }

        if (decoration.type === "rock") {
            drawShadow(
                position.x + 7,
                position.y + 7,
                decoration.radius,
                decoration.radius * 0.42
            );
        }
    });

    zombies.forEach(function (zombie) {
        if (!isWorldPointVisible(zombie.x, zombie.y)) {
            return;
        }

        const position = worldToScreen(zombie.x, zombie.y);

        drawShadow(
            position.x + 9,
            position.y + 13,
            zombie.radius * 1.15,
            zombie.radius * 0.48
        );
    });

    const playerPosition =
        worldToScreen(player.x, player.y);

    drawShadow(
        playerPosition.x + 10,
        playerPosition.y + 14,
        player.radius * 1.3,
        player.radius * 0.52
    );
}

function drawShadow(x, y, radiusX, radiusY) {
    ctx.save();

    ctx.translate(x, y);
    ctx.rotate(-0.3);

    const gradient =
        ctx.createRadialGradient(
            0,
            0,
            0,
            0,
            0,
            radiusX
        );

    gradient.addColorStop(0, "rgba(0, 0, 0, 0.42)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.ellipse(
        0,
        0,
        radiusX,
        radiusY,
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
}

/* =====================================
   BUILDINGS
===================================== */

function drawBuilding(building) {
    if (
        !isWorldPointVisible(
            building.x + building.w / 2,
            building.y + building.h / 2,
            500
        )
    ) {
        return;
    }

    const position = worldToScreen(
        building.x,
        building.y
    );

    const height = building.height;

    ctx.save();

    ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
    ctx.beginPath();
    ctx.moveTo(
        position.x + 25,
        position.y + building.h + 20
    );
    ctx.lineTo(
        position.x + building.w + 45,
        position.y + building.h + 35
    );
    ctx.lineTo(
        position.x + building.w,
        position.y + building.h
    );
    ctx.lineTo(
        position.x,
        position.y + building.h
    );
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#111813";
    ctx.beginPath();
    ctx.moveTo(position.x, position.y);
    ctx.lineTo(
        position.x,
        position.y + building.h
    );
    ctx.lineTo(
        position.x + 22,
        position.y + building.h + 20
    );
    ctx.lineTo(
        position.x + 22,
        position.y + height
    );
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = building.color;
    ctx.fillRect(
        position.x,
        position.y - height,
        building.w,
        building.h + height
    );

    const roofGradient =
        ctx.createLinearGradient(
            position.x,
            position.y - height,
            position.x,
            position.y
        );

    roofGradient.addColorStop(0, "#39433a");
    roofGradient.addColorStop(1, building.roof);

    ctx.fillStyle = roofGradient;

    ctx.beginPath();
    ctx.moveTo(position.x, position.y - height);
    ctx.lineTo(
        position.x + building.w,
        position.y - height
    );
    ctx.lineTo(
        position.x + building.w + 22,
        position.y - height + 20
    );
    ctx.lineTo(
        position.x + 22,
        position.y - height + 20
    );
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.strokeRect(
        position.x,
        position.y - height,
        building.w,
        building.h + height
    );

    const windowSize = 38;
    const gap = 28;

    for (
        let x = position.x + 35;
        x < position.x + building.w - windowSize;
        x += windowSize + gap
    ) {
        for (
            let y = position.y - height + 50;
            y < position.y + building.h - 25;
            y += 78
        ) {
            ctx.fillStyle =
                Math.random() > 0.86
                    ? "rgba(255, 204, 83, 0.18)"
                    : "rgba(5, 8, 6, 0.75)";

            ctx.fillRect(x, y, windowSize, 35);
        }
    }

    ctx.restore();
}

/* =====================================
   DECORATIONS
===================================== */

function drawDecoration(decoration) {
    if (!isWorldPointVisible(decoration.x, decoration.y)) {
        return;
    }

    if (decoration.type === "tree") {
        drawTree(decoration);
    }

    if (decoration.type === "rock") {
        drawRock(decoration);
    }

    if (decoration.type === "barrel") {
        drawBarrel(decoration);
    }
}

function drawTree(tree) {
    const position = worldToScreen(tree.x, tree.y);

    ctx.save();
    ctx.translate(position.x, position.y);

    ctx.fillStyle = "#372c1b";
    ctx.fillRect(
        -5,
        -tree.height * 0.3,
        10,
        tree.height
    );

    ctx.fillStyle =
        tree.shade > 0.5
            ? "#163f20"
            : "#1b4b26";

    ctx.beginPath();
    ctx.arc(
        0,
        -tree.height * 0.55,
        tree.radius,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = "rgba(80, 150, 78, 0.22)";

    ctx.beginPath();
    ctx.arc(
        -tree.radius * 0.25,
        -tree.height * 0.75,
        tree.radius * 0.58,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
}

function drawRock(rock) {
    const position = worldToScreen(rock.x, rock.y);

    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.rotate(rock.rotation);

    ctx.fillStyle =
        rock.shade > 0.5
            ? "#414943"
            : "#333a35";

    ctx.beginPath();
    ctx.moveTo(-rock.radius, 4);
    ctx.lineTo(-rock.radius * 0.5, -rock.radius * 0.8);
    ctx.lineTo(rock.radius * 0.4, -rock.radius);
    ctx.lineTo(rock.radius, -rock.radius * 0.2);
    ctx.lineTo(rock.radius * 0.7, rock.radius * 0.6);
    ctx.lineTo(-rock.radius * 0.4, rock.radius);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";

    ctx.beginPath();
    ctx.moveTo(-rock.radius * 0.5, -rock.radius * 0.55);
    ctx.lineTo(rock.radius * 0.35, -rock.radius * 0.75);
    ctx.lineTo(rock.radius * 0.1, -rock.radius * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawBarrel(barrel) {
    const position = worldToScreen(barrel.x, barrel.y);

    ctx.save();
    ctx.translate(position.x, position.y);

    ctx.fillStyle = barrel.explosive
        ? "#812d23"
        : "#304c44";

    ctx.fillRect(-14, -24, 28, 40);

    ctx.strokeStyle = "#111";
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(-14, -15);
    ctx.lineTo(14, -15);
    ctx.moveTo(-14, 7);
    ctx.lineTo(14, 7);
    ctx.stroke();

    ctx.fillStyle = barrel.explosive
        ? "#ffb938"
        : "#65b8a2";

    ctx.beginPath();
    ctx.arc(0, -3, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

/* =====================================
   PLAYER MODEL
===================================== */

function drawPlayer() {
    const position = worldToScreen(player.x, player.y);

    const walkBob =
        Math.sin(player.walkTime) * 2;

    ctx.save();

    ctx.translate(
        position.x,
        position.y + walkBob
    );

    ctx.rotate(player.aimAngle);

    const legSwing =
        Math.sin(player.walkTime) * 6;

    ctx.strokeStyle = "#162126";
    ctx.lineWidth = 9;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(-6, 7);
    ctx.lineTo(-10, 22 + legSwing);
    ctx.moveTo(5, 7);
    ctx.lineTo(9, 22 - legSwing);
    ctx.stroke();

    ctx.fillStyle = "#111820";

    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    const bodyGradient =
        ctx.createLinearGradient(
            -20,
            -20,
            20,
            20
        );

    bodyGradient.addColorStop(0, "#20b6c0");
    bodyGradient.addColorStop(1, "#08606b");

    ctx.fillStyle = bodyGradient;

    ctx.beginPath();
    ctx.roundRect(-17, -15, 34, 32, 10);
    ctx.fill();

    ctx.fillStyle = "#121820";

    ctx.beginPath();
    ctx.arc(-1, -17, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#9ceeff";
    ctx.fillRect(3, -23, 12, 6);

    ctx.strokeStyle = "#192129";
    ctx.lineWidth = 8;

    ctx.beginPath();
    ctx.moveTo(10, -5);
    ctx.lineTo(27, -4);
    ctx.stroke();

    ctx.fillStyle = "#232a31";
    ctx.fillRect(17, -7, 35, 11);

    ctx.fillStyle = "#65717a";
    ctx.fillRect(24, -10, 20, 5);

    ctx.fillStyle = "#111";
    ctx.fillRect(33, 4, 8, 11);

    if (muzzleFlash > 0) {
        ctx.save();

        ctx.translate(55, -1);

        const flashGradient =
            ctx.createRadialGradient(
                0,
                0,
                0,
                0,
                0,
                30
            );

        flashGradient.addColorStop(
            0,
            "rgba(255, 255, 220, 1)"
        );

        flashGradient.addColorStop(
            0.35,
            "rgba(255, 190, 60, 0.9)"
        );

        flashGradient.addColorStop(
            1,
            "rgba(255, 70, 10, 0)"
        );

        ctx.fillStyle = flashGradient;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(32, -14);
        ctx.lineTo(21, 0);
        ctx.lineTo(32, 14);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    ctx.restore();
}

/* =====================================
   ZOMBIE MODELS
===================================== */

function drawZombie(zombie) {
    if (!isWorldPointVisible(zombie.x, zombie.y)) {
        return;
    }

    const position = worldToScreen(zombie.x, zombie.y);

    const walkBob =
        Math.sin(zombie.walkTime) *
        (zombie.type === "runner" ? 4 : 2);

    ctx.save();

    ctx.translate(
        position.x,
        position.y + walkBob
    );

    ctx.rotate(zombie.rotation);

    const scale =
        zombie.type === "tank"
            ? 1.35
            : zombie.type === "runner"
            ? 0.82
            : 1;

    ctx.scale(scale, scale);

    const zombieColor =
        zombie.hitFlash > 0
            ? "#d9ffd3"
            : zombie.type === "tank"
            ? "#527e48"
            : zombie.type === "runner"
            ? "#67a845"
            : "#438b49";

    const legSwing =
        Math.sin(zombie.walkTime) * 7;

    ctx.strokeStyle = "#283328";
    ctx.lineWidth = zombie.type === "tank" ? 12 : 8;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(-7, 9);
    ctx.lineTo(-11, 25 + legSwing);
    ctx.moveTo(7, 9);
    ctx.lineTo(11, 25 - legSwing);
    ctx.stroke();

    ctx.strokeStyle = zombieColor;
    ctx.lineWidth = zombie.type === "tank" ? 13 : 8;

    ctx.beginPath();
    ctx.moveTo(-12, -2);
    ctx.lineTo(-28, -4 + legSwing * 0.25);
    ctx.moveTo(12, -2);
    ctx.lineTo(28, 4 - legSwing * 0.25);
    ctx.stroke();

    ctx.fillStyle =
        zombie.type === "tank"
            ? "#3b4036"
            : "#272d28";

    ctx.beginPath();
    ctx.roundRect(
        -18,
        -14,
        36,
        38,
        zombie.type === "tank" ? 8 : 12
    );
    ctx.fill();

    ctx.fillStyle = zombieColor;

    ctx.beginPath();
    ctx.arc(0, -20, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff304e";

    ctx.beginPath();
    ctx.arc(7, -24, 3.5, 0, Math.PI * 2);
    ctx.arc(7, -15, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#d2f1b7";
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(-5, -27);
    ctx.lineTo(-11, -20);
    ctx.lineTo(-5, -13);
    ctx.stroke();

    if (zombie.type === "tank") {
        ctx.fillStyle = "#652632";

        ctx.beginPath();
        ctx.arc(-15, -3, 9, 0, Math.PI * 2);
        ctx.arc(15, -3, 9, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();

    drawZombieHealth(zombie, position.x, position.y);
}

function drawZombieHealth(zombie, x, y) {
    if (zombie.health >= zombie.maxHealth) {
        return;
    }

    const width =
        zombie.type === "tank" ? 70 : 42;

    const percentage =
        zombie.health / zombie.maxHealth;

    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(
        x - width / 2,
        y - zombie.radius - 34,
        width,
        5
    );

    ctx.fillStyle =
        zombie.type === "tank"
            ? "#ff385c"
            : "#65ff72";

    ctx.fillRect(
        x - width / 2,
        y - zombie.radius - 34,
        width * percentage,
        5
    );
}

/* =====================================
   BULLETS
===================================== */

function drawBullets() {
    bullets.forEach(function (bullet) {
        const current =
            worldToScreen(bullet.x, bullet.y);

        const previous =
            worldToScreen(
                bullet.previousX,
                bullet.previousY
            );

        ctx.save();

        ctx.strokeStyle = "rgba(255, 223, 105, 0.65)";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(previous.x, previous.y);
        ctx.lineTo(current.x, current.y);
        ctx.stroke();

        ctx.shadowColor = "#ffd85c";
        ctx.shadowBlur = 15;

        ctx.fillStyle = "#fff7bd";

        ctx.beginPath();
        ctx.arc(
            current.x,
            current.y,
            bullet.radius,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.restore();
    });
}

/* =====================================
   PICKUPS
===================================== */

function drawPickup(pickup) {
    if (!isWorldPointVisible(pickup.x, pickup.y)) {
        return;
    }

    const position = worldToScreen(
        pickup.x,
        pickup.y
    );

    const float =
        Math.sin(pickup.floatTime) * 5;

    ctx.save();

    ctx.translate(
        position.x,
        position.y + float
    );

    ctx.shadowColor =
        pickup.type === "health"
            ? "#ff385c"
            : "#00efff";

    ctx.shadowBlur = 20;

    ctx.fillStyle =
        pickup.type === "health"
            ? "#a72a3f"
            : "#157a8d";

    ctx.beginPath();
    ctx.roundRect(-16, -16, 32, 32, 8);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "white";

    if (pickup.type === "health") {
        ctx.fillRect(-4, -11, 8, 22);
        ctx.fillRect(-11, -4, 22, 8);
    } else {
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillRect(-3, -8, 6, 16);
    }

    ctx.restore();
}

/* =====================================
   PARTICLE DRAW
===================================== */

function drawParticles() {
    particles.forEach(function (particle) {
        if (!isWorldPointVisible(particle.x, particle.y)) {
            return;
        }

        const position = worldToScreen(
            particle.x,
            particle.y
        );

        ctx.save();

        ctx.globalAlpha = Math.max(
            0,
            particle.life / particle.maxLife
        );

        ctx.fillStyle = particle.color;

        ctx.beginPath();
        ctx.arc(
            position.x,
            position.y,
            particle.radius,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.restore();
    });
}

/* =====================================
   LIGHTING + FOG
===================================== */

function drawLightingAndFog() {
    const playerPosition =
        worldToScreen(player.x, player.y);

    ctx.save();

    const darkness =
        ctx.createRadialGradient(
            playerPosition.x,
            playerPosition.y,
            75,
            playerPosition.x,
            playerPosition.y,
            Math.max(
                window.innerWidth,
                window.innerHeight
            ) * 0.72
        );

    darkness.addColorStop(
        0,
        "rgba(0, 0, 0, 0)"
    );

    darkness.addColorStop(
        0.36,
        "rgba(0, 0, 0, 0.1)"
    );

    darkness.addColorStop(
        1,
        "rgba(0, 3, 1, 0.78)"
    );

    ctx.fillStyle = darkness;

    ctx.fillRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );

    ctx.globalCompositeOperation = "lighter";

    const flashlight =
        ctx.createRadialGradient(
            playerPosition.x,
            playerPosition.y,
            10,
            playerPosition.x +
                Math.cos(player.aimAngle) * 160,
            playerPosition.y +
                Math.sin(player.aimAngle) * 160,
            390
        );

    flashlight.addColorStop(
        0,
        "rgba(185, 255, 188, 0.16)"
    );

    flashlight.addColorStop(
        0.5,
        "rgba(110, 180, 115, 0.06)"
    );

    flashlight.addColorStop(
        1,
        "rgba(0, 0, 0, 0)"
    );

    ctx.fillStyle = flashlight;

    ctx.beginPath();
    ctx.arc(
        playerPosition.x +
            Math.cos(player.aimAngle) * 120,
        playerPosition.y +
            Math.sin(player.aimAngle) * 120,
        390,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.restore();

    drawMovingFog();
}

function drawMovingFog() {
    ctx.save();

    ctx.globalAlpha = 0.055;

    for (let i = 0; i < 7; i++) {
        const x =
            (
                i * 260 +
                fogTime * (14 + i * 2)
            ) %
            (window.innerWidth + 500) -
            250;

        const y =
            100 +
            (i * 130) %
                Math.max(200, window.innerHeight - 150);

        const gradient =
            ctx.createRadialGradient(
                x,
                y,
                0,
                x,
                y,
                220
            );

        gradient.addColorStop(
            0,
            "rgba(150, 190, 155, 0.7)"
        );

        gradient.addColorStop(
            1,
            "rgba(150, 190, 155, 0)"
        );

        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.ellipse(
            x,
            y,
            260,
            90,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    ctx.restore();
}

function drawVignette() {
    const gradient =
        ctx.createRadialGradient(
            window.innerWidth / 2,
            window.innerHeight / 2,
            Math.min(
                window.innerWidth,
                window.innerHeight
            ) * 0.25,
            window.innerWidth / 2,
            window.innerHeight / 2,
            Math.max(
                window.innerWidth,
                window.innerHeight
            ) * 0.7
        );

    gradient.addColorStop(
        0,
        "rgba(0, 0, 0, 0)"
    );

    gradient.addColorStop(
        1,
        "rgba(0, 0, 0, 0.52)"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );
}

/* =====================================
   UI
===================================== */

function updateUI() {
    const healthPercentage =
        player.health / player.maxHealth;

    healthFill.style.width =
        healthPercentage * 100 + "%";

    healthText.textContent =
        Math.ceil(player.health) +
        " / " +
        player.maxHealth;

    armorText.textContent =
        "ARMOR: " +
        Math.ceil(player.armor);

    scoreText.textContent = score;
    killsText.textContent = kills;
    waveText.textContent = wave;
    highScoreText.textContent = highScore;

    ammoText.textContent = ammo;

    if (healthPercentage > 0.55) {
        healthFill.style.background =
            "linear-gradient(90deg, #20db57, #b8ff73)";
    } else if (healthPercentage > 0.25) {
        healthFill.style.background =
            "linear-gradient(90deg, #ffad32, #ffe45c)";
    } else {
        healthFill.style.background =
            "linear-gradient(90deg, #d91840, #ff6745)";
    }
}

function showWaveAnnouncement(number) {
    if (number === lastAnnouncedWave) {
        return;
    }

    lastAnnouncedWave = number;

    waveAnnouncementNumber.textContent = number;
    waveAnnouncement.classList.add("show");

    playSound(
        110 + number * 10,
        0.4,
        "sawtooth",
        0.04
    );

    setTimeout(function () {
        waveAnnouncement.classList.remove("show");
    }, 1500);
}

function showDamageFlash() {
    damageFlash.classList.add("active");

    setTimeout(function () {
        damageFlash.classList.remove("active");
    }, 120);
}

function updateTankHealthPanel(tank) {
    if (!tank) {
        tankHealthPanel.classList.remove("show");
        return;
    }

    tankHealthPanel.classList.add("show");

    tankHealthFill.style.width =
        (
            tank.health /
            tank.maxHealth *
            100
        ) + "%";
}

/* =====================================
   GAME OVER
===================================== */

function endGame() {
    gameRunning = false;
    gamePaused = false;

    stopShooting();
    stopJoystick();

    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }

    if (score > highScore) {
        highScore = score;

        localStorage.setItem(
            "potaraZombieHighScore",
            String(highScore)
        );
    }

    finalScore.textContent = score;
    finalKills.textContent = kills;
    finalWave.textContent = wave;
    finalBest.textContent = highScore;

    highScoreText.textContent = highScore;

    gameOverScreen.style.display = "grid";
}

/* =====================================
   GAME LOOP
===================================== */

function gameLoop(currentTime) {
    if (!gameRunning || gamePaused) {
        return;
    }

    const deltaTime = Math.min(
        (currentTime - lastTime) / 1000,
        0.033
    );

    lastTime = currentTime;

    update(deltaTime);
    draw();

    gameLoopId = requestAnimationFrame(gameLoop);
}

/* =====================================
   HELPERS
===================================== */

function clamp(value, minimum, maximum) {
    return Math.max(
        minimum,
        Math.min(maximum, value)
    );
}

/* =====================================
   INITIALIZE
===================================== */

createWorld();
resizeCanvas();
updateCameraInstant();
updateUI();
draw();
