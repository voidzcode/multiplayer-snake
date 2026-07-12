const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const socket = io();

const GRID_SIZE = 20; // Grid width/height in cells
const CELL_SIZE = canvas.width / GRID_SIZE;

let gameState = {
    snakes: {},
    food: null
};

let myId = null;
let gameId = 'default';

// Status indicator
function updateStatus(status, type = 'connecting') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = status;
    statusEl.className = `connection-status ${type}`;
}

// Socket events
socket.on('connect', () => {
    updateStatus('Connected', 'connected');
    console.log('Connected to server');
});

socket.on('disconnect', () => {
    updateStatus('Disconnected', 'disconnected');
});

socket.on('game-state', (state) => {
    gameState = state;
    render();
});

socket.on('player-joined', (data) => {
    console.log(`${data.playerName} joined! (${data.playerCount} players)`);
    updatePlayersList();
});

socket.on('player-left', (data) => {
    console.log(`Player left (${data.playerCount} players remaining)`);
    updatePlayersList();
});

function joinGame() {
    const nameInput = document.getElementById('playerName');
    const gameIdInput = document.getElementById('gameId');
    const name = nameInput.value.trim() || `Player ${Math.random().toString(36).substr(2, 5)}`;
    gameId = gameIdInput.value.trim() || 'default';

    socket.emit('join-game', {
        name: name,
        gameId: gameId
    });

    myId = socket.id;
    document.getElementById('joinSection').style.display = 'none';
    document.getElementById('gameInfo').style.display = 'block';
    updateStatus('In Game', 'connected');
}

function sendDirection(x, y) {
    socket.emit('direction', {x: x, y: y});
}

function updatePlayersList() {
    const list = document.getElementById('playersList');
    const scoresList = document.getElementById('scoresList');
    list.innerHTML = '';
    scoresList.innerHTML = '';

    for (let playerId in gameState.snakes) {
        const snake = gameState.snakes[playerId];
        const isYou = playerId === myId;
        const label = isYou ? ' (You)' : '';
        
        // Players list
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';
        playerDiv.innerHTML = `
            <div>
                <span class="player-color" style="background: ${snake.color}"></span>
                Player ${playerId === myId ? '(You)' : playerId.substr(0, 5)}
            </div>
            <span>${snake.alive ? '🔴 Alive' : '💀 Dead'}</span>
        `;
        list.appendChild(playerDiv);

        // Scores list
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'score-item';
        scoreDiv.innerHTML = `
            <span style="color: ${snake.color}; font-weight: bold;">●</span>
            <span>Player ${playerId === myId ? '(You)' : playerId.substr(0, 5)}</span>
            <span>${snake.score}</span>
        `;
        scoresList.appendChild(scoreDiv);
    }
}

function render() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid (optional)
    ctx.strokeStyle = '#2a2a4e';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
        const pos = i * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(canvas.width, pos);
        ctx.stroke();
    }

    // Draw food
    if (gameState.food) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(
            gameState.food.x * CELL_SIZE + CELL_SIZE / 2,
            gameState.food.y * CELL_SIZE + CELL_SIZE / 2,
            CELL_SIZE / 2.5,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    // Draw snakes
    for (let playerId in gameState.snakes) {
        const snake = gameState.snakes[playerId];
        const isYou = playerId === myId;

        // Draw snake body
        snake.body.forEach((segment, index) => {
            if (index === 0) {
                // Head
                ctx.fillStyle = snake.color;
                ctx.fillRect(
                    segment.x * CELL_SIZE,
                    segment.y * CELL_SIZE,
                    CELL_SIZE,
                    CELL_SIZE
                );
                // Eye
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(
                    segment.x * CELL_SIZE + CELL_SIZE * 0.7,
                    segment.y * CELL_SIZE + CELL_SIZE * 0.3,
                    CELL_SIZE * 0.15,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            } else {
                // Body
                ctx.fillStyle = snake.color;
                ctx.globalAlpha = 0.7 - (index / snake.body.length) * 0.3;
                ctx.fillRect(
                    segment.x * CELL_SIZE,
                    segment.y * CELL_SIZE,
                    CELL_SIZE,
                    CELL_SIZE
                );
                ctx.globalAlpha = 1;
            }
        });

        // Draw score above snake head if not dead
        if (snake.body.length > 0 && snake.alive) {
            const head = snake.body[0];
            ctx.fillStyle = snake.color;
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                snake.score,
                head.x * CELL_SIZE + CELL_SIZE / 2,
                head.y * CELL_SIZE - 5
            );
        }
    }

    updatePlayersList();
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    switch(e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
            e.preventDefault();
            sendDirection(0, -1);
            break;
        case 'arrowdown':
        case 's':
            e.preventDefault();
            sendDirection(0, 1);
            break;
        case 'arrowleft':
        case 'a':
            e.preventDefault();
            sendDirection(-1, 0);
            break;
        case 'arrowright':
        case 'd':
            e.preventDefault();
            sendDirection(1, 0);
            break;
    }
});

// Mobile touch controls
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 20) {
        if (Math.abs(dx) > Math.abs(dy)) {
            sendDirection(dx > 0 ? 1 : -1, 0);
        } else {
            sendDirection(0, dy > 0 ? 1 : -1);
        }
    }
});

// Initial render
render();
