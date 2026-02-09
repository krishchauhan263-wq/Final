const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const readyScreen = document.getElementById('ready-screen');
const readyBtn = document.getElementById('ready-btn');

const startScreen = document.getElementById('start-screen');
const proposalScreen = document.getElementById('proposal-screen');
const celebrationScreen = document.getElementById('celebration-screen');
const failScreen = document.getElementById('fail-screen');

const startBtn = document.getElementById('start-btn');
const yesBtn = document.getElementById('yes-btn');
const noBtn = document.getElementById('no-btn');
const retryBtn = document.getElementById('retry-btn');

const loveMeter = document.getElementById('love-fill');

// ---------------- GAME STATE ----------------
let gameState = 'START'; // START, PLAYING, READY, PROPOSAL, CELEBRATION, FAIL
let score = 0;
const WIN_SCORE = 15;

let player;
let hearts = [];
let bombs = [];
let particles = [];
let animationId = null;
let beatInterval = null;

// ---------------- RESIZE ----------------
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (player) player.y = canvas.height - 100;
}
window.addEventListener('resize', resize);

// ---------------- PLAYER ----------------
class Player {
    constructor() {
        this.w = 100;
        this.h = 80;
        this.x = canvas.width / 2 - this.w / 2;
        this.y = canvas.height - 100;
    }

    draw() {
        ctx.fillStyle = '#ff4d6d';
        ctx.beginPath();
        ctx.arc(this.x + this.w / 2, this.y, this.w / 2, 0, Math.PI);
        ctx.fill();

        ctx.strokeStyle = '#c9184a';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(this.x + this.w / 2, this.y - 10, this.w / 2, Math.PI, 0);
        ctx.stroke();
    }

    update() {
        if (this.x < 0) this.x = 0;
        if (this.x + this.w > canvas.width) {
            this.x = canvas.width - this.w;
        }
    }
}

// ---------------- HEART ----------------
class Heart {
    constructor() {
        this.size = Math.random() * 20 + 20;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -this.size;
        this.speed = Math.random() * 3 + 2;
        this.color = `hsl(${Math.random() * 20 + 340},100%,60%)`;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        const t = this.size * 0.3;
        ctx.moveTo(this.x, this.y + t);
        ctx.bezierCurveTo(this.x, this.y, this.x - this.size / 2, this.y, this.x - this.size / 2, this.y + t);
        ctx.bezierCurveTo(this.x - this.size / 2, this.y + this.size / 2, this.x, this.y + this.size / 2, this.x, this.y + this.size);
        ctx.bezierCurveTo(this.x, this.y + this.size / 2, this.x + this.size / 2, this.y + this.size / 2, this.x + this.size / 2, this.y + t);
        ctx.bezierCurveTo(this.x + this.size / 2, this.y, this.x, this.y, this.x, this.y + t);
        ctx.fill();
    }

    update() {
        this.y += this.speed;
    }
}

// ---------------- BOMB ----------------
class Bomb {
    constructor() {
        this.size = 30;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -this.size;
        this.speed = 4;
    }

    draw() {
        ctx.font = `${this.size}px Arial`;
        ctx.fillText("💣", this.x, this.y);
    }

    update() {
        this.y += this.speed;
    }
}

// ---------------- PARTICLE ----------------
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 2;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 100;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 2;
    }

    draw() {
        ctx.globalAlpha = this.life / 100;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// ---------------- INPUT ----------------
function handleInput(e) {
    if (!player || gameState !== 'PLAYING') return;

    if (e.type === 'touchmove') e.preventDefault();
    const x = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
    player.x = x - player.w / 2;
}
window.addEventListener('mousemove', handleInput);
window.addEventListener('touchmove', handleInput, { passive: false });

// ---------------- HELPERS ----------------
function spawnHeart() {
    if (Math.random() < 0.02) hearts.push(new Heart());
}

function spawnBomb() {
    if (Math.random() < 0.008) bombs.push(new Bomb());
}

function createParticles(x, y) {
    for (let i = 0; i < 6; i++) particles.push(new Particle(x, y));
}

function updateScore() {
    loveMeter.style.width = `${(score / WIN_SCORE) * 100}%`;
}

// ---------------- GAME LOOP ----------------
function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState !== 'PLAYING') return;

    player.update();
    player.draw();

    spawnHeart();
    spawnBomb();

    hearts.forEach((h, i) => {
        h.update();
        h.draw();

        if (
            h.y + h.size > player.y &&
            h.y < player.y + player.h &&
            h.x + h.size > player.x &&
            h.x < player.x + player.w
        ) {
            hearts.splice(i, 1);
            score++;
            createParticles(h.x, h.y);
            updateScore();
            if (score >= WIN_SCORE) triggerProposal();
        } else if (h.y > canvas.height) {
            hearts.splice(i, 1);
        }
    });

    bombs.forEach((b, i) => {
        b.update();
        b.draw();

        if (
            b.y + b.size > player.y &&
            b.y < player.y + player.h &&
            b.x + b.size > player.x &&
            b.x < player.x + player.w
        ) {
            triggerFail();
        }

        if (b.y > canvas.height) bombs.splice(i, 1);
    });

    particles.forEach((p, i) => {
        p.update();
        p.draw();
        if (p.life <= 0) particles.splice(i, 1);
    });

    animationId = requestAnimationFrame(updateGame);
}

// ---------------- STATES ----------------
function startGame() {
    resize();
    player = new Player();
    hearts = [];
    bombs = [];
    particles = [];
    score = 0;
    updateScore();

    gameState = 'PLAYING';
    startScreen.classList.add('hidden');
    updateGame();
}

function triggerProposal() {
    gameState = 'READY';
    cancelAnimationFrame(animationId);
    setTimeout(() => readyScreen.classList.add('active'), 500);
}

function triggerFail() {
    gameState = 'FAIL';
    cancelAnimationFrame(animationId);
    failScreen.classList.add('active');
}

// ---------------- BUTTONS ----------------
startBtn.onclick = startGame;

readyBtn.onclick = () => {
    readyScreen.classList.remove('active');
    proposalScreen.classList.remove('hidden');
    proposalScreen.classList.add('active');
    gameState = 'PROPOSAL';
};

yesBtn.onclick = () => {
    proposalScreen.classList.remove('active');
    celebrationScreen.classList.remove('hidden');
    celebrationScreen.classList.add('active');
    gameState = 'CELEBRATION';

    const music = document.getElementById('celebration-music');
    music.volume = 0.6;
    music.play();

    const title = celebrationScreen.querySelector('h1');
    beatInterval = setInterval(() => {
        title.classList.remove('beat');
        void title.offsetWidth;
        title.classList.add('beat');
    }, 1000);

    typeMessage();
};

retryBtn.onclick = () => {
    failScreen.classList.remove('active');
    startGame();
};

// ---------------- NO BUTTON RUN ----------------
function moveNoButton() {
    noBtn.style.position = 'fixed';
    noBtn.style.left = Math.random() * (window.innerWidth - 100) + 'px';
    noBtn.style.top = Math.random() * (window.innerHeight - 50) + 'px';
}
noBtn.addEventListener('mouseover', moveNoButton);
noBtn.addEventListener('touchstart', moveNoButton);

// ---------------- MESSAGE ----------------
const messageText = `Hey Himakshi ❤️
Thank you meri life ka hissa banne ke liye 🫶
Tumhari presence sab kuch better bana deti hai.
Lucky hoon jo tum meri ho 💕
— Krish 💫`;

function typeMessage() {
    const el = document.getElementById('typed-message');
    el.innerHTML = "";
    let i = 0;
    const t = setInterval(() => {
        el.innerHTML += messageText[i++];
        if (i >= messageText.length) clearInterval(t);
    }, 40);
}

// ---------------- INIT ----------------
resize();
