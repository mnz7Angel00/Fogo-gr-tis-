const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const healthDisplay = document.getElementById('health');
const ammoDisplay = document.getElementById('ammo');
const playersDisplay = document.getElementById('players');
const gameOverDisplay = document.getElementById('gameOver');

let gameRunning = false;
let player, bots, bullets, zone;
let totalPlayers = 0;

const map = {
    width: 800,
    height: 600,
    obstacles: [
        { x: 200, y: 150, w: 100, h: 100 },
        { x: 500, y: 400, w: 150, h: 80 }
    ]
};

function initGame() {
    player = {
        x: 400,
        y: 300,
        size: 15,
        color: 'lime',
        hp: 100,
        ammo: 10
    };
    bots = [];
    for (let i = 0; i < 5; i++) {
        bots.push({
            x: Math.random() * map.width,
            y: Math.random() * map.height,
            size: 15,
            color: 'red',
            hp: 100,
            ammo: 10
        });
    }
    totalPlayers = bots.length + 1;
    bullets = [];
    zone = {
        x: 0,
        y: 0,
        w: map.width,
        h: map.height,
        shrinkRate: 0.5
    };
    gameRunning = true;
    gameOverDisplay.style.display = 'none';
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (!gameRunning) return;
    update();
    render();
    requestAnimationFrame(gameLoop);
}

function update() {
    zone.w -= zone.shrinkRate;
    zone.h -= zone.shrinkRate;
    zone.x = (map.width - zone.w) / 2;
    zone.y = (map.height - zone.h) / 2;

    bots.forEach(bot => {
        const dx = player.x - bot.x;
        const dy = player.y - bot.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 200) {
            bot.x += dx / dist;
            bot.y += dy / dist;

            if (bot.ammo > 0 && Math.random() < 0.02) {
                bullets.push({
                    x: bot.x,
                    y: bot.y,
                    dx: dx / dist * 5,
                    dy: dy / dist * 5,
                    owner: bot
                });
                bot.ammo--;
            }
        } else {
            bot.x += (Math.random() - 0.5) * 2;
            bot.y += (Math.random() - 0.5) * 2;
        }
    });

    bullets.forEach(b => {
        b.x += b.dx;
        b.y += b.dy;
    });

    bullets = bullets.filter(b => {
        if (hit(b, player) && b.owner !== player) {
            player.hp -= 10;
            return false;
        }

        for (const bot of bots) {
            if (hit(b, bot) && b.owner !== bot) {
                bot.hp -= 10;
                return false;
            }
        }

        return (
            b.x > 0 && b.x < map.width &&
            b.y > 0 && b.y < map.height
        );
    });

    bots = bots.filter(b => b.hp > 0);
    if (player.hp <= 0) endGame();

    if (bots.length === 0) endGame();

    if (
        player.x < zone.x || player.x > zone.x + zone.w ||
        player.y < zone.y || player.y > zone.y + zone.h
    ) {
        player.hp -= 0.2;
    }
}

function render() {
    ctx.clearRect(0, 0, map.width, map.height);

    ctx.strokeStyle = 'yellow';
    ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);

    ctx.fillStyle = player.color;
    ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);

    bots.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
    });

    bullets.forEach(b => {
        ctx.fillStyle = 'white';
        ctx.fillRect(b.x - 2, b.y - 2, 4, 4);
    });

    map.obstacles.forEach(o => {
        ctx.fillStyle = '#555';
        ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    healthDisplay.innerText = `Vida: ${Math.max(0, Math.floor(player.hp))}`;
    ammoDisplay.innerText = `Munição: ${player.ammo}`;
    playersDisplay.innerText = `Jogadores Restantes: ${bots.length + 1}`;
}

function endGame() {
    gameRunning = false;
    gameOverDisplay.style.display = 'block';
}

function hit(b, obj) {
    return (
        b.x > obj.x - obj.size / 2 &&
        b.x < obj.x + obj.size / 2 &&
        b.y > obj.y - obj.size / 2 &&
        b.y < obj.y + obj.size / 2
    );
}

startButton.addEventListener('click', initGame);
restartButton.addEventListener('click', initGame);

window.addEventListener('keydown', e => {
    if (!gameRunning) return;
    switch (e.key) {
        case 'ArrowUp':
        case 'w': player.y -= 5; break;
        case 'ArrowDown':
        case 's': player.y += 5; break;
        case 'ArrowLeft':
        case 'a': player.x -= 5; break;
        case 'ArrowRight':
        case 'd': player.x += 5; break;
        case ' ': shoot(); break;
    }
});

function shoot() {
    if (player.ammo <= 0) return;
    const angle = Math.random() * Math.PI * 2;
    bullets.push({
        x: player.x,
        y: player.y,
        dx: Math.cos(angle) * 5,
        dy: Math.sin(angle) * 5,
        owner: player
    });
    player.ammo--;
}