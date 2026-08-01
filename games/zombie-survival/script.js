"use strict";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const pauseScreen = document.getElementById("pauseScreen");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const pauseButton = document.getElementById("pauseButton");
const resumeButton = document.getElementById("resumeButton");

const healthFill = document.getElementById("healthFill");
const healthText = document.getElementById("healthText");
const scoreText = document.getElementById("scoreText");
const killsText = document.getElementById("killsText");
const waveText = document.getElementById("waveText");

const finalScore = document.getElementById("finalScore");
const finalKills = document.getElementById("finalKills");

const joystickArea = document.getElementById("joystickArea");
const joystickStick = document.getElementById("joystickStick");
const shootButton = document.getElementById("shootButton");

let gameRunning = false;
let gamePaused = false;
let lastTime = 0;

let score = 0;
let kills = 0;
let wave = 1;

let zombieSpawnTimer = 0;
let zombieSpawnDelay = 1300;

let mouseX = 0;
let mouseY = 0;

const keys = {};

const joystick = {
    active: false,
    x: 0,
    y: 0,
    pointerId: null
};

const player = {
    x: 0,
    y: 0,
    radius: 22,
    speed: 250,
    health: 100,
    maxHealth: 100,
    aimAngle: 0
};

let bullets = [];
let zombies = [];
let particles = [];

/* Canvas Size */

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (!gameRunning) {
        player.x = canvas.width / 2;
        player.y = canvas.height / 2;
    }
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* Start Game */

function resetGame() {
    score = 0;
    kills = 0;
    wave = 1;

    zombieSpawnTimer = 0;
    zombieSpawnDelay = 1300;

    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.health = player.maxHealth;
    player.aimAngle = 0;

    bullets = [];
    zombies = [];
    particles = [];

    updateUI();
}

function startGame() {
    resetGame();

    gameRunning = true;
    gamePaused = false;

    startScreen.style.display = "none";
    gameOverScreen.style.display = "none";
    pauseScreen.style.display = "none";

    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

/* Pause */

function pauseGame() {
    if (!gameRunning) {
        return;
    }

    gamePaused = true;
    pauseScreen.style.display = "grid";
}

function resumeGame() {
    gamePaused = false;
    pauseScreen.style.display = "none";

    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

pauseButton.addEventListener("click", function () {
    if (gamePaused) {
        resumeGame();
    } else {
        pauseGame();
    }
});

resumeButton.addEventListener("click", resumeGame);

/* Keyboard */

window.addEventListener("keydown", function (event) {
    keys[event.key.toLowerCase()] = true;

    if (event.code === "Space") {
        event.preventDefault();
        shootBullet();
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

/* Mouse Aim */

canvas.addEventListener("mousemove", function (event) {
    const rect = canvas.getBoundingClientRect();

    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;

    player.aimAngle = Math.atan2(
        mouseY - player.y,
        mouseX - player.x
    );
});

canvas.addEventListener("mousedown", function () {
    shootBullet();
});

/* Mobile Joystick */

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

function stopJoystick(event) {
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

/* Mobile Shooting */

let shootingInterval = null;

shootButton.addEventListener("pointerdown", function (event) {
    event.preventDefault();

    shootBullet();

    shootingInterval = setInterval(shootBullet, 220);
});

function stopShooting() {
    clearInterval(shootingInterval);
    shootingInterval = null;
}

shootButton.addEventListener("pointerup", stopShooting);
shootButton.addEventListener("pointercancel", stopShooting);
shootButton.addEventListener("pointerleave", stopShooting);

/* Bullet */

function shootBullet() {
    if (!gameRunning || gamePaused) {
        return;
    }

    let angle = player.aimAngle;

    if (isMobileDevice()) {
        const nearestZombie = findNearestZombie();

        if (nearestZombie) {
            angle = Math.atan2(
                nearestZombie.y - player.y,
                nearestZombie.x - player.x
            );

            player.aimAngle = angle;
        }
    }

    bullets.push({
        x: player.x + Math.cos(angle) * 28,
        y: player.y + Math.sin(angle) * 28,
        radius: 5,
        speed: 650,
        angle: angle,
        life: 1.2
    });

    createParticles(
        player.x + Math.cos(angle) * 30,
        player.y + Math.sin(angle) * 30,
        "#ffd84a",
        5
    );
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

/* Zombies */

function spawnZombie() {
    const side = Math.floor(Math.random() * 4);

    let x;
    let y;

    if (side === 0) {
        x = Math.random() * canvas.width;
        y = -50;
    } else if (side === 1) {
        x = canvas.width + 50;
        y = Math.random() * canvas.height;
    } else if (side === 2) {
        x = Math.random() * canvas.width;
        y = canvas.height + 50;
    } else {
        x = -50;
        y = Math.random() * canvas.height;
    }

    const difficulty = 1 + wave * 0.09;

    zombies.push({
        x: x,
        y: y,
        radius: 24 + Math.random() * 8,
        speed: (55 + Math.random() * 35) * difficulty,
        health: Math.ceil(1 + wave / 4),
        damageTimer: 0,
        rotation: Math.random() * Math.PI * 2
    });
}

/* Update */

function update(deltaTime) {
    updatePlayer(deltaTime);
    updateBullets(deltaTime);
    updateZombies(deltaTime);
    updateParticles(deltaTime);

    zombieSpawnTimer += deltaTime * 1000;

    if (zombieSpawnTimer >= zombieSpawnDelay) {
        zombieSpawnTimer = 0;
        spawnZombie();
    }

    wave = Math.floor(kills / 10) + 1;

    zombieSpawnDelay = Math.max(
        350,
        1300 - wave * 75
    );

    updateUI();
}

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
    }

    player.x += moveX * player.speed * deltaTime;
    player.y += moveY * player.speed * deltaTime;

    player.x = Math.max(
        player.radius,
        Math.min(canvas.width - player.radius, player.x)
    );

    player.y = Math.max(
        player.radius,
        Math.min(canvas.height - player.radius, player.y)
    );
}

function updateBullets(deltaTime) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        bullet.x += Math.cos(bullet.angle) *
            bullet.speed * deltaTime;

        bullet.y += Math.sin(bullet.angle) *
            bullet.speed * deltaTime;

        bullet.life -= deltaTime;

        if (
            bullet.life <= 0 ||
            bullet.x < -30 ||
            bullet.x > canvas.width + 30 ||
            bullet.y < -30 ||
            bullet.y > canvas.height + 30
        ) {
            bullets.splice(i, 1);
            continue;
        }

        for (let j = zombies.length - 1; j >= 0; j--) {
            const zombie = zombies[j];

            const distance = Math.hypot(
                bullet.x - zombie.x,
                bullet.y - zombie.y
            );

            if (distance < bullet.radius + zombie.radius) {
                zombie.health--;

                createParticles(
                    bullet.x,
                    bullet.y,
                    "#49ff70",
                    8
                );

                bullets.splice(i, 1);

                if (zombie.health <= 0) {
                    createParticles(
                        zombie.x,
                        zombie.y,
                        "#39d353",
                        18
                    );

                    zombies.splice(j, 1);

                    kills++;
                    score += 100 * wave;
                }

                break;
            }
        }
    }
}

function updateZombies(deltaTime) {
    for (let i = zombies.length - 1; i >= 0; i--) {
        const zombie = zombies[i];

        const angle = Math.atan2(
            player.y - zombie.y,
            player.x - zombie.x
        );

        zombie.x += Math.cos(angle) *
            zombie.speed * deltaTime;

        zombie.y += Math.sin(angle) *
            zombie.speed * deltaTime;

        zombie.rotation = angle;

        zombie.damageTimer -= deltaTime;

        const distance = Math.hypot(
            zombie.x - player.x,
            zombie.y - player.y
        );

        if (
            distance < zombie.radius + player.radius &&
            zombie.damageTimer <= 0
        ) {
            player.health -= 10;
            zombie.damageTimer = 0.65;

            createParticles(
                player.x,
                player.y,
                "#ff365e",
                12
            );

            if (player.health <= 0) {
                player.health = 0;
                endGame();
                return;
            }
        }
    }
}

function updateParticles(deltaTime) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];

        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        particle.life -= deltaTime;
        particle.radius *= 0.97;

        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

/* Particles */

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 180;

        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 2 + Math.random() * 4,
            color: color,
            life: 0.25 + Math.random() * 0.45
        });
    }
}

/* Draw */

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackgroundGrid();
    drawParticles();
    drawBullets();
    drawZombies();
    drawPlayer();
}

function drawBackgroundGrid() {
    ctx.fillStyle = "#06080d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gridSize = 55;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
    ctx.lineWidth = 1;

    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    const gradient = ctx.createRadialGradient(
        player.x,
        player.y,
        20,
        player.x,
        player.y,
        400
    );

    gradient.addColorStop(
        0,
        "rgba(0, 245, 255, 0.08)"
    );

    gradient.addColorStop(
        1,
        "rgba(0, 0, 0, 0)"
    );

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawPlayer() {
    ctx.save();

    ctx.translate(player.x, player.y);
    ctx.rotate(player.aimAngle);

    ctx.shadowColor = "#00f5ff";
    ctx.shadowBlur = 18;

    ctx.fillStyle = "#00ddea";
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.fillStyle = "#071019";
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#dcefff";
    ctx.fillRect(8, -6, 33, 12);

    ctx.fillStyle = "#ffbf45";
    ctx.fillRect(35, -4, 12, 8);

    ctx.restore();
}

function drawZombieFace(zombie) {
    ctx.save();

    ctx.translate(zombie.x, zombie.y);
    ctx.rotate(zombie.rotation);

    ctx.shadowColor = "#49ff70";
    ctx.shadowBlur = 14;

    ctx.fillStyle = "#39964f";
    ctx.beginPath();
    ctx.arc(
        0,
        0,
        zombie.radius,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.fillStyle = "#132719";
    ctx.beginPath();
    ctx.arc(
        0,
        0,
        zombie.radius * 0.67,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = "#ff365e";
    ctx.beginPath();
    ctx.arc(7, -7, 4, 0, Math.PI * 2);
    ctx.arc(7, 7, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#a6ff8c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-5, -10);
    ctx.lineTo(-12, 0);
    ctx.lineTo(-5, 10);
    ctx.stroke();

    ctx.restore();
}

function drawZombies() {
    zombies.forEach(drawZombieFace);
}

function drawBullets() {
    bullets.forEach(function (bullet) {
        ctx.save();

        ctx.shadowColor = "#ffd84a";
        ctx.shadowBlur = 13;

        ctx.fillStyle = "#fff08a";
        ctx.beginPath();
        ctx.arc(
            bullet.x,
            bullet.y,
            bullet.radius,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.restore();
    });
}

function drawParticles() {
    particles.forEach(function (particle) {
        ctx.save();

        ctx.globalAlpha = Math.max(
            0,
            particle.life * 2
        );

        ctx.fillStyle = particle.color;

        ctx.beginPath();
        ctx.arc(
            particle.x,
            particle.y,
            particle.radius,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.restore();
    });
}

/* UI */

function updateUI() {
    const healthPercent =
        (player.health / player.maxHealth) * 100;

    healthFill.style.width = healthPercent + "%";

    healthText.textContent =
        player.health + " / " + player.maxHealth;

    scoreText.textContent = score;
    killsText.textContent = kills;
    waveText.textContent = wave;

    if (healthPercent > 55) {
        healthFill.style.background =
            "linear-gradient(90deg, #26ff72, #b6ff42)";
    } else if (healthPercent > 25) {
        healthFill.style.background =
            "linear-gradient(90deg, #ffbd2f, #ffe768)";
    } else {
        healthFill.style.background =
            "linear-gradient(90deg, #ff365e, #ff764a)";
    }
}

/* Game Over */

function endGame() {
    gameRunning = false;
    gamePaused = false;

    finalScore.textContent = score;
    finalKills.textContent = kills;

    gameOverScreen.style.display = "grid";
}

/* Main Loop */

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

    requestAnimationFrame(gameLoop);
}

/* Initial Screen Drawing */

player.x = canvas.width / 2;
player.y = canvas.height / 2;

draw();
