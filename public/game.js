const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRID_SIZE = 20;
const CELL_SIZE = canvas.width / GRID_SIZE;
const GRID_WIDTH = 20;
const GRID_HEIGHT = 20;
const TICK_RATE = 100; // ms between updates

let gameState = {
    snakes: {},
    food: null
};

let myId = null;
let roomName = 'default';
let myPlayer = null;
let isConnected = false;

// Photon Client
const photonClient = new Photon.LoadBalancing.LoadBalancingClient(
    Photon.ConnectionProtocol.Wss,
    '2902f049-a0b0-410b-9e8b-c488d223e870',
    '1.0.0'
);

// Photon Event Codes
const EventCodes = {
    GAME_STATE: 1,
    PLAYER_DIRECTION: 2,
    PLAYER_JOINED: 3
};

// Status indicator
function updateStatus(status, type = 'connecting') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = status;
    statusEl.className = `connection-status ${type}`;
}

// Photon Event Handlers
photonClient.onStateChange = (state) => {
    console.log('Photon State:', state);
    
    switch(state) {
        case Photon.LoadBalancing.LoadBalancingClient.State.Connected:
            updateStatus('Connected to Photon', 'connected');
            isConnected = true;
            break;
        case Photon.LoadBalancing.LoadBalancingClient.State.Joined:
            updateStatus('Joined Room', 'connected');
            break;
        case Photon.LoadBalancing.LoadBalancingClient.State.Disconnected:
            updateStatus('Disconnected', 'disconnected');
            isConnected = false;
            break;
    }
};

photonClient.onEvent = (code, content, actorNr) => {
    switch(code) {
        case EventCodes.GAME_STATE:
            gameState = content;
            render();
            break;
        case EventCodes.PLAYER_JOINED:
            console.log(`Player joined: ${content.playerName}`);
            updatePlayersList();
            break;
    }
};

photonClient.onError = (errorCode, errorMsg) => {
    console.error('Photon Error:', errorCode, errorMsg);
    updateStatus(`Error: ${errorMsg}`, 'error');
};

// Initialize Photon connection
function initializePhoton() {
    console.log('Initializing Photon...');
    photonClient.connect();
}

// Join a room
function joinRoom() {
    const nameInput = document.getElementById('playerName');
    const roomInput = document.getElementById('roomName');
    const name = nameInput.value.trim() || `Player ${Math.random().toString(36).substr(2, 5)}`;
    roomName = roomInput.value.trim() || 'default';

    if (!isConnected) {
        updateStatus('Connecting to Photon...', 'connecting');
        // Connection will trigger room join when ready
        myPlayer = { name, roomName };
        return;
    }

    const roomOptions = new Photon.LoadBalancing.RoomOptions();
    roomOptions.maxPlayers = 4;
    roomOptions.isVisible = true;
    roomOptions.isOpen = true;

    const joinRoomOptions = new Photon.LoadBalancing.JoinRoomOptions();
    joinRoomOptions.clientProperties = {
        name: name,
        color: getPlayerColor(),
        score: 0,
        alive: true
    };

    photonClient.opJoinOrCreateRoom(
        roomName,
        joinRoomOptions,
        roomOptions
    );

    myId = photonClient.myActor().actorNr;
    document.getElementById('joinSection').style.display = 'none';
    document.getElementById('gameInfo').style.display = 'block';
    updateStatus('In Game', 'connected');
}

// Send direction input
function sendDirection(x, y) {
    if (!isConnected || !myId) return;

    const directionData = { x, y, playerId: myId };
    photonClient.raiseEvent(
        EventCodes.PLAYER_DIRECTION,
        directionData,
        { receivers: Photon.LoadBalancing.ReceiverGroup.All }
    );
}

// Get player color
function getPlayerColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Update players list
function updatePlayersList() {
    const list = document.getElementById('playersList');
    const scoresList = document.getElementById('scoresList');
    list.innerHTML = '';
    scoresList.innerHTML = '';

    for (let playerId in gameState.snakes) {
        const snake = gameState.snakes[playerId];
        const isYou = playerId === myId?.toString();

        // Players list
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';
        playerDiv.innerHTML = `
            <div>
                <span class="player-color" style="background: ${snake.color}"></span>
                Player ${isYou ? '(You)' : playerId.substr(0, 5)}
            </div>
            <span>${snake.alive ? '🔴 Alive' : '💀 Dead'}</span>
        `;
        list.appendChild(playerDiv);

        // Scores list
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'score-item';
        scoreDiv.innerHTML = `
            <span style="color: ${snake.color}; font-weight: bold;">●</span>
            <span>Player ${isYou ? '(You)' : playerId.substr(0, 5)}</span>
            <span>${snake.score}</span>
        `;
        scoresList.appendChild(scoreDiv);
    }
}

// Render game
function render() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
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
        const isYou = playerId === myId?.toString();

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

        // Draw score above snake head
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

// Initialize
updateStatus('Connecting to Photon...', 'connecting');
initializePhoton();
render();
