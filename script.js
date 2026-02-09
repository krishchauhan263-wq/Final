const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const readyScreen = document.getElementById('ready-screen');
const readyBtn = document.getElementById('ready-btn');

// Game State
let gameState = 'START'; // START, PLAYING, WON, PROPOSAL, END
let score = 0;
const WIN_SCORE = 15; // Hearts needed to fill the meter
let player;
let hearts = [];
let particles = []; // For effects
let animationId;
let loveMeter = document.getElementById('love-fill');
let beatInterval;
let bombs = [];

// DOM Elements
const startScreen = document.getElementById('start-screen');
const proposalScreen = document.getElementById('proposal-screen');
const celebrationScreen = document.getElementById('celebration-screen');
const startBtn = document.getElementById('start-btn');
const yesBtn = document.getElementById('yes-btn');
const noBtn = document.getElementById('no-btn');
const retryBtn = document.getElementById('retry-btn');

retryBtn.addEventListener('click', () => {
    bombs = [];
    hearts = [];
    score = 0;
    updateScore();

    document.getElementById('fail-screen').classList.remove('active');
    document.getElementById('fail-screen').classList.add('hidden');

    startGame();
});

// Resize Handling
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (player) {
         player.y = canvas.height - 100;
    }
}
window.addEventListener('resize', resize);

function spawnBomb() {
    if (Math.random() < 0.008) { // rare but scary 😈
        bombs.push(new Bomb());
    }
}

// Player Object
class Player {
    constructor() {
        this.w = 100; // width
        this.h = 80;  // height
        this.x = canvas.width / 2 - this.w / 2;
        this.y = canvas.height - 100;
        this.speed = 10;
        this.dx = 0;
    }

    draw() {
        // Draw a cute basket or cup (using simple shapes for now, can be improved or replaced with image)
        ctx.fillStyle = '#ff4d6d';
        
        // Simple semi-circle basket
        ctx.beginPath();
        ctx.arc(this.x + this.w/2, this.y, this.w/2, 0, Math.PI, false);
        ctx.fill();
        
        // Handle
        ctx.beginPath();
        ctx.strokeStyle = '#c9184a';
        ctx.lineWidth = 5;
        ctx.arc(this.x + this.w/2, this.y - 10, this.w/2, Math.PI, 0, false);
        ctx.stroke();
    }

    update() {
        this.x += this.dx;
        
        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;
    }
}

// Heart Object
class Heart {
    constructor() {
        this.size = Math.random() * 20 + 20; // 20-40px
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -this.size;
        this.speed = Math.random() * 3 + 2; // 2-5 speed
        this.color = `hsl(${Math.random() * 20 + 340}, 100%, 60%)`; // Pinkish/Red variations
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        let topCurveHeight = this.size * 0.3;
        ctx.moveTo(this.x, this.y + topCurveHeight);
        // top left curve
        ctx.bezierCurveTo(
            this.x, this.y, 
            this.x - this.size / 2, this.y, 
            this.x - this.size / 2, this.y + topCurveHeight
        );
        // bottom left curve
        ctx.bezierCurveTo(
            this.x - this.size / 2, this.y + (this.size + topCurveHeight) / 2, 
            this.x, this.y + (this.size + topCurveHeight) / 2, 
            this.x, this.y + this.size
        );
        // bottom right curve
        ctx.bezierCurveTo(
            this.x, this.y + (this.size + topCurveHeight) / 2, 
            this.x + this.size / 2, this.y + (this.size + topCurveHeight) / 2, 
            this.x + this.size / 2, this.y + topCurveHeight
        );
        // top right curve
        ctx.bezierCurveTo(
            this.x + this.size / 2, this.y, 
            this.x, this.y, 
            this.x, this.y + topCurveHeight
        );
        ctx.fill();
    }

    update() {
        this.y += this.speed;
    }
}
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


// Particle Effect
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 2;
        this.speedX = (Math.random() - 0.5) * 4;
        this.speedY = (Math.random() - 0.5) * 4;
        this.life = 100;
        this.color = `rgba(255, 255, 255, 0.8)`;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 2;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / 100;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Input Handling
function handleInput(e) {
    if (!player) return;
    
    // Mouse / Touch
    if (e.type === 'mousemove' || e.type === 'touchmove') {
        const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        player.x = clientX - player.w / 2;
    }
}

window.addEventListener('mousemove', handleInput);
window.addEventListener('touchmove', handleInput, { passive: false });

// Game Functions
function spawnHeart() {
    if (Math.random() < 0.02) {
        hearts.push(new Heart());
    }
}

function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

    if (gameState === 'PLAYING') {
        player.update();
        player.draw();

        spawnHeart();
        spawnBomb();


        hearts.forEach((heart, index) => {
            heart.update();
            heart.draw();

            // Collision Detection
            // Simple box-ish collision for now
            if (
                heart.y + heart.size > player.y &&
                heart.x > player.x &&
                heart.x < player.x + player.w
            ) {
                // Catch!
                hearts.splice(index, 1);
                score++;
                createParticles(heart.x, heart.y);
                updateScore();
                
                if (score >= WIN_SCORE) {
                    triggerProposal();
                }
            } else if (heart.y > canvas.height) {
                hearts.splice(index, 1); // Missed
            }   
        });

        bombs.forEach((bomb, index) => {
    bomb.update();
    bomb.draw();

    // Collision with player
    if (
        bomb.y + bomb.size > player.y &&
        bomb.x > player.x &&
        bomb.x < player.x + player.w
    ) {
        triggerFail();
    }

    // Remove off-screen bomb
    if (bomb.y > canvas.height) {
        bombs.splice(index, 1);
    }
});



        particles.forEach((p, idx) => {
            p.update();
            p.draw();
            if (p.life <= 0) particles.splice(idx, 1);
        });
    }

    animationId = requestAnimationFrame(updateGame);
}

function createParticles(x, y) {
    for(let i=0; i<5; i++) {
        particles.push(new Particle(x, y));
    }
}

function updateScore() {
    const percentage = (score / WIN_SCORE) * 100;
    loveMeter.style.width = `${percentage}%`;
}

function triggerProposal() {
    gameState = 'READY';

    setTimeout(() => {
        readyScreen.classList.remove('hidden');
        readyScreen.classList.add('active');
    }, 500);
}

function triggerFail() {
    gameState = 'FAIL';
    cancelAnimationFrame(animationId);

    document.getElementById('fail-screen').classList.remove('hidden');
    document.getElementById('fail-screen').classList.add('active');
}


function startGame() {
    resize();
    player = new Player();
    hearts = [];
    score = 0;
    updateScore();
    gameState = 'PLAYING';
    
    startScreen.classList.remove('active');
    startScreen.classList.add('hidden');
    
    updateGame();
}

// Event Listeners
startBtn.addEventListener('click', startGame);
readyBtn.addEventListener('click', () => {
    readyScreen.classList.remove('active');
    readyScreen.classList.add('hidden');

    proposalScreen.classList.remove('hidden');
    proposalScreen.classList.add('active');

    gameState = 'PROPOSAL';
});

yesBtn.addEventListener('click', () => {
    proposalScreen.classList.remove('active');
    proposalScreen.classList.add('hidden');

    celebrationScreen.classList.remove('hidden');
    celebrationScreen.classList.add('active');

    const music = document.getElementById('celebration-music');
    music.volume = 0.6;
    music.play();

    const title = celebrationScreen.querySelector('h1');

    // 💓 Sync heartbeat (Night Changes ~ 56–60 BPM feel)
    beatInterval = setInterval(() => {
        title.classList.remove('beat');
        void title.offsetWidth; // reflow trick
        title.classList.add('beat');
    }, 1000); // heartbeat timing
    typeMessage();
});


// "No" button runs away
noBtn.addEventListener('mouseover', moveNoButton);
noBtn.addEventListener('touchstart', moveNoButton);

function moveNoButton() {
    const x = Math.random() * (window.innerWidth - noBtn.offsetWidth);
    const y = Math.random() * (window.innerHeight - noBtn.offsetHeight);
    noBtn.style.position = 'fixed';
    noBtn.style.left = `${x}px`;
    noBtn.style.top = `${y}px`;
}

function triggerConfetti() {
    // Simple confetti effect using particles or similar
    // We can just reuse the heat/particle engine or add a simple CSS class to body
    // For now, let's just let it be.
}

// Initialize
resize();

const messageText = `Hey Himakshi ❤️
Bas itna kehna tha ki thank you meri life ka part banne ke liye 🫶
Tumhari presence hi sab kuch better bana deti hai.
Tumhari smile, care aur saath — sab bahut special hai mere liye 💕
Sach mein lucky hoon jo tum meri ho.
Always grateful for us 😌❤️

— Krish 💫`;

function typeMessage() {
    const el = document.getElementById('typed-message');
    el.innerHTML = "";
    let i = 0;

    const typing = setInterval(() => {
        el.innerHTML += messageText.charAt(i);
        i++;

        if (i >= messageText.length) {
            clearInterval(typing);
        }
    }, 40); // typing speed
}



