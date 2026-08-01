"use strict";

/* Loading Screen */

const loader = document.getElementById("loader");

window.addEventListener("load", function () {
    setTimeout(function () {
        loader.classList.add("hide-loader");
    }, 1900);
});


/* Elements */

const header = document.querySelector(".header");
const navbar = document.getElementById("navbar");
const menuButton = document.getElementById("menuButton");
const soundButton = document.getElementById("soundButton");
const navLinks = document.querySelectorAll(".nav-link");

const gameSearch = document.getElementById("gameSearch");
const gameCards = document.querySelectorAll(".game-card");
const categoryButtons = document.querySelectorAll(".category-button");
const noResults = document.getElementById("noResults");

const playButtons = document.querySelectorAll(".play-game-button");

const newsletterForm =
    document.getElementById("newsletterForm");

const contactForm =
    document.getElementById("contactForm");

const notification =
    document.getElementById("notification");

const notificationText =
    document.getElementById("notificationText");

const backToTop =
    document.getElementById("backToTop");

const counters =
    document.querySelectorAll(".counter");


/* Current Year */

document.getElementById("currentYear").textContent =
    new Date().getFullYear();


/* Header Scroll */

window.addEventListener("scroll", function () {
    if (window.scrollY > 40) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }

    if (window.scrollY > 500) {
        backToTop.classList.add("show");
    } else {
        backToTop.classList.remove("show");
    }

    updateActiveNavigation();
});


/* Mobile Menu */

menuButton.addEventListener("click", function () {
    navbar.classList.toggle("open");
    menuButton.classList.toggle("active");
});

navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
        navbar.classList.remove("open");
        menuButton.classList.remove("active");
    });
});


/* Active Navigation */

function updateActiveNavigation() {
    const sections = document.querySelectorAll("section[id]");

    let currentSection = "home";

    sections.forEach(function (section) {
        const sectionTop = section.offsetTop - 160;
        const sectionHeight = section.offsetHeight;

        if (
            window.scrollY >= sectionTop &&
            window.scrollY < sectionTop + sectionHeight
        ) {
            currentSection = section.id;
        }
    });

    navLinks.forEach(function (link) {
        link.classList.remove("active");

        if (
            link.getAttribute("href") ===
            "#" + currentSection
        ) {
            link.classList.add("active");
        }
    });
}


/* Sound System */

let soundEnabled = true;
let audioContext = null;

function createAudioContext() {
    if (!audioContext) {
        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();
    }
}

function playClickSound(frequency = 450) {
    if (!soundEnabled) {
        return;
    }

    try {
        createAudioContext();

        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(
            frequency,
            audioContext.currentTime
        );

        gain.gain.setValueAtTime(
            0.08,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + 0.14
        );

        oscillator.start();
        oscillator.stop(
            audioContext.currentTime + 0.14
        );
    } catch (error) {
        console.log("Sound could not play:", error);
    }
}

soundButton.addEventListener("click", function () {
    soundEnabled = !soundEnabled;

    soundButton.textContent =
        soundEnabled ? "🔊" : "🔇";

    showNotification(
        soundEnabled
            ? "Sound turned ON 🔊"
            : "Sound turned OFF 🔇"
    );

    if (soundEnabled) {
        playClickSound(550);
    }
});

document.querySelectorAll("button, .primary-button")
    .forEach(function (button) {
        button.addEventListener("click", function () {
            playClickSound();
        });
    });


/* Game Search and Category Filter */

let selectedCategory = "all";

gameSearch.addEventListener("input", filterGames);

categoryButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        categoryButtons.forEach(function (item) {
            item.classList.remove("active");
        });

        button.classList.add("active");

        selectedCategory =
            button.dataset.category;

        filterGames();
    });
});

function filterGames() {
    const searchValue =
        gameSearch.value.trim().toLowerCase();

    let visibleGames = 0;

    gameCards.forEach(function (card) {
        const gameName =
            card.dataset.name.toLowerCase();

        const gameCategory =
            card.dataset.category;

        const matchesSearch =
            gameName.includes(searchValue);

        const matchesCategory =
            selectedCategory === "all" ||
            gameCategory === selectedCategory;

        if (matchesSearch && matchesCategory) {
            card.classList.remove("hide-card");
            visibleGames++;
        } else {
            card.classList.add("hide-card");
        }
    });

    if (visibleGames === 0) {
        noResults.classList.add("show");
    } else {
        noResults.classList.remove("show");
    }
}


/* Game Play Buttons */

playButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        const gameName = button.dataset.game;

        showNotification(
            gameName +
            " is coming soon! 🎮🔥"
        );
    });
});


/* Newsletter */

newsletterForm.addEventListener(
    "submit",
    function (event) {
        event.preventDefault();

        const emailInput =
            document.getElementById("emailInput");

        const email =
            emailInput.value.trim();

        if (!isValidEmail(email)) {
            showNotification(
                "Please enter a valid email!",
                false
            );

            return;
        }

        showNotification(
            "Welcome to the POTARA Army! 🔥"
        );

        newsletterForm.reset();
    }
);


/* Contact Form */

contactForm.addEventListener(
    "submit",
    function (event) {
        event.preventDefault();

        const name =
            document
                .getElementById("nameInput")
                .value
                .trim();

        const email =
            document
                .getElementById("contactEmail")
                .value
                .trim();

        const subject =
            document
                .getElementById("subjectInput")
                .value
                .trim();

        const message =
            document
                .getElementById("messageInput")
                .value
                .trim();

        if (
            !name ||
            !email ||
            !subject ||
            !message
        ) {
            showNotification(
                "Please fill all fields!",
                false
            );

            return;
        }

        if (!isValidEmail(email)) {
            showNotification(
                "Please enter a valid email!",
                false
            );

            return;
        }

        showNotification(
            "Message sent successfully! 🚀"
        );

        contactForm.reset();
    }
);

function isValidEmail(email) {
    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailPattern.test(email);
}


/* Notification */

let notificationTimer;

function showNotification(message, success = true) {
    clearTimeout(notificationTimer);

    notificationText.textContent = message;

    const icon =
        document.getElementById(
            "notificationIcon"
        );

    if (success) {
        icon.textContent = "✓";
        icon.style.background = "#38ff9c";
    } else {
        icon.textContent = "!";
        icon.style.background = "#ff4b6e";
    }

    notification.classList.add("show");

    notificationTimer = setTimeout(
        function () {
            notification.classList.remove("show");
        },
        3000
    );
}


/* Counter Animation */

let countersStarted = false;

function startCounters() {
    if (countersStarted) {
        return;
    }

    const statsSection =
        document.querySelector(".hero-stats");

    const statsPosition =
        statsSection.getBoundingClientRect().top;

    if (statsPosition < window.innerHeight) {
        countersStarted = true;

        counters.forEach(function (counter) {
            const target =
                Number(counter.dataset.target);

            const duration = 1500;
            const startTime =
                performance.now();

            function updateCounter(currentTime) {
                const elapsed =
                    currentTime - startTime;

                const progress =
                    Math.min(
                        elapsed / duration,
                        1
                    );

                const easedProgress =
                    1 - Math.pow(
                        1 - progress,
                        3
                    );

                const currentValue =
                    Math.floor(
                        target * easedProgress
                    );

                if (target >= 1000) {
                    counter.textContent =
                        currentValue.toLocaleString() +
                        "+";
                } else if (target === 99) {
                    counter.textContent =
                        currentValue;
                } else {
                    counter.textContent =
                        currentValue + "+";
                }

                if (progress < 1) {
                    requestAnimationFrame(
                        updateCounter
                    );
                }
            }

            requestAnimationFrame(
                updateCounter
            );
        });
    }
}

window.addEventListener(
    "scroll",
    startCounters
);

window.addEventListener(
    "load",
    startCounters
);


/* Back To Top */

backToTop.addEventListener(
    "click",
    function () {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
);


/* 3D Controller Mouse Effect */

const heroVisual =
    document.querySelector(".hero-visual");

const gamingController =
    document.querySelector(".gaming-controller");

heroVisual.addEventListener(
    "mousemove",
    function (event) {
        if (window.innerWidth < 900) {
            return;
        }

        const rect =
            heroVisual.getBoundingClientRect();

        const mouseX =
            event.clientX - rect.left;

        const mouseY =
            event.clientY - rect.top;

        const rotateY =
            ((mouseX / rect.width) - 0.5) * 18;

        const rotateX =
            ((mouseY / rect.height) - 0.5) * -18;

        gamingController.style.animation =
            "none";

        gamingController.style.transform =
            `rotateX(${10 + rotateX}deg)
             rotateY(${rotateY}deg)
             rotateZ(-4deg)`;
    }
);

heroVisual.addEventListener(
    "mouseleave",
    function () {
        gamingController.style.transform = "";
        gamingController.style.animation = "";
    }
);


/* Social Buttons */

document
    .querySelectorAll(".social-buttons button")
    .forEach(function (button) {
        button.addEventListener("click", function () {
            showNotification(
                "Social link coming soon! 🚀"
            );
        });
    });


/* Keyboard Shortcut */

document.addEventListener(
    "keydown",
    function (event) {
        if (
            event.key === "/" &&
            document.activeElement !== gameSearch
        ) {
            event.preventDefault();

            document
                .getElementById("games")
                .scrollIntoView({
                    behavior: "smooth"
                });

            setTimeout(function () {
                gameSearch.focus();
            }, 600);
        }

        if (event.key === "Escape") {
            navbar.classList.remove("open");
            menuButton.classList.remove("active");
        }
    }
);
