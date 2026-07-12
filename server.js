const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

const GRID_WIDTH = 20;
const GRID_HEIGHT = 20;
const TICK_RATE = 100; // ms between updates

// Game state
let games = {};
let players = {};

class Snake {
  constructor(id, startX, startY) {
    this.id = id;
    this.body = [{x: startX, y: startY}];
    this.direction = {x: 1, y: 0};
    this.nextDirection = {x: 1, y: 0};
    this.score = 0;
    this.alive = true;
  }

  move() {
    if (!this.alive) return;
    
    this.direction = this.nextDirection;
    const head = this.body[0];
    const newHead = {
      x: (head.x + this.direction.x + GRID_WIDTH) % GRID_WIDTH,
      y: (head.y + this.direction.y + GRID_HEIGHT) % GRID_HEIGHT
    };

    // Check self collision
    for (let segment of this.body) {
      if (newHead.x === segment.x && newHead.y === segment.y) {
        this.alive = false;
        return;
      }
    }

    this.body.unshift(newHead);
  }

  eat() {
    this.score += 10;
  }

  shrink() {
    if (this.body.length > 1) {
      this.body.pop();
    }
  }
}

class Game {
  constructor(gameId, maxPlayers = 4) {
    this.id = gameId;
    this.snakes = {};
    this.food = this.spawnFood();
    this.maxPlayers = maxPlayers;
    this.started = false;
  }

  spawnFood() {
    let food;
    let validSpawn = false;
    while (!validSpawn) {
      food = {
        x: Math.floor(Math.random() * GRID_WIDTH),
        y: Math.floor(Math.random() * GRID_HEIGHT)
      };
      validSpawn = true;
      // Check if food spawns on a snake
      for (let snakeId in this.snakes) {
        for (let segment of this.snakes[snakeId].body) {
          if (food.x === segment.x && food.y === segment.y) {
            validSpawn = false;
            break;
          }
        }
        if (!validSpawn) break;
      }
    }
    return food;
  }

  update() {
    // Move all snakes
    for (let snakeId in this.snakes) {
      this.snakes[snakeId].move();
    }

    // Check food collision
    for (let snakeId in this.snakes) {
      const snake = this.snakes[snakeId];
      const head = snake.body[0];
      if (head.x === this.food.x && head.y === this.food.y) {
        snake.eat();
        this.food = this.spawnFood();
      }
    }

    // Check snake collisions
    for (let snakeId1 in this.snakes) {
      const snake1 = this.snakes[snakeId1];
      if (!snake1.alive) continue;
      const head1 = snake1.body[0];

      for (let snakeId2 in this.snakes) {
        if (snakeId1 === snakeId2) continue;
        const snake2 = this.snakes[snakeId2];
        
        for (let segment of snake2.body) {
          if (head1.x === segment.x && head1.y === segment.y) {
            snake1.alive = false;
          }
        }
      }
    }
  }

  getState() {
    const snakesState = {};
    for (let snakeId in this.snakes) {
      const snake = this.snakes[snakeId];
      snakesState[snakeId] = {
        body: snake.body,
        score: snake.score,
        alive: snake.alive,
        color: players[snakeId]?.color
      };
    }
    return {
      snakes: snakesState,
      food: this.food
    };
  }
}

// Socket.IO events
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('join-game', (data) => {
    const gameId = data.gameId || 'default';
    
    if (!games[gameId]) {
      games[gameId] = new Game(gameId);
    }

    const game = games[gameId];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
    const playerCount = Object.keys(game.snakes).length;

    // Start position for this player
    const startX = Math.floor(Math.random() * (GRID_WIDTH - 5)) + 2;
    const startY = Math.floor(Math.random() * (GRID_HEIGHT - 5)) + 2;

    const snake = new Snake(socket.id, startX, startY);
    game.snakes[socket.id] = snake;
    
    players[socket.id] = {
      gameId,
      color: colors[playerCount % colors.length],
      name: data.name || `Player ${playerCount + 1}`
    };

    socket.join(gameId);
    socket.emit('game-state', game.getState());
    io.to(gameId).emit('player-joined', {
      playerId: socket.id,
      playerName: players[socket.id].name,
      playerCount: Object.keys(game.snakes).length
    });
  });

  socket.on('direction', (data) => {
    const player = players[socket.id];
    if (!player) return;

    const game = games[player.gameId];
    const snake = game.snakes[socket.id];
    
    if (snake) {
      // Prevent reversing into itself
      if (data.x !== -snake.direction.x || data.y !== -snake.direction.y) {
        snake.nextDirection = {x: data.x, y: data.y};
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    const player = players[socket.id];
    
    if (player && games[player.gameId]) {
      delete games[player.gameId].snakes[socket.id];
      io.to(player.gameId).emit('player-left', {
        playerId: socket.id,
        playerCount: Object.keys(games[player.gameId].snakes).length
      });
    }
    
    delete players[socket.id];
  });
});

// Game loop
setInterval(() => {
  for (let gameId in games) {
    const game = games[gameId];
    game.update();
    io.to(gameId).emit('game-state', game.getState());
  }
}, TICK_RATE);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
