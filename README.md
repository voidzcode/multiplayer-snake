# Multiplayer Snake Game 🐍

A real-time multiplayer snake game built with Node.js, Socket.IO, and HTML5 Canvas.

## Features

- 🎮 **Real-time Multiplayer** - Play with up to 4 players simultaneously
- 🎨 **Colorful Design** - Each player gets a unique color
- 📱 **Mobile Friendly** - Works on desktop and mobile devices
- ⌨️ **Multiple Controls** - Arrow keys, WASD, or touch controls
- 🏆 **Live Scoring** - See all players' scores in real-time
- 🌐 **Web-based** - No installation needed, just open in a browser

## Quick Start

### Local Development

1. **Clone this repo**
   ```bash
   git clone https://github.com/voidzcode/multiplayer-snake.git
   cd multiplayer-snake
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Deploy to Replit (Free & Easy)

1. Go to [Replit.com](https://replit.com)
2. Click **Create** → **Import from GitHub**
3. Paste: `https://github.com/voidzcode/multiplayer-snake.git`
4. Click **Import**
5. Replit will detect it's a Node.js project and set up automatically
6. Click **Run** to start the server
7. Click the **Web** button to open the game in a new tab
8. Share the link with friends!

### Deploy to Railway (Alternative)

1. Go to [Railway.app](https://railway.app)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select this repository
4. Railway will auto-detect and configure
5. Your game will be live at a Railway URL

## How to Play

1. **Enter your name** and game ID
2. **Click Join** to enter the game
3. **Use controls to move your snake**:
   - ⬆️ Arrow Keys or WASD
   - 📱 Swipe on mobile
   - 🖱️ Click arrow buttons
4. **Eat the food** 🟡 to grow and earn points
5. **Avoid other snakes** and walls
6. **Last snake alive wins!**

## Game Rules

- Each food eaten = +10 points
- Colliding with another snake's body = you die
- Colliding with walls = you wrap to the other side
- When you die, you become a ghost (gray) but stay in the game
- The game continues until everyone decides to leave

## Customization

### Change Grid Size
Edit `server.js`:
```javascript
const GRID_WIDTH = 20;  // Change this
const GRID_HEIGHT = 20; // And this
```

### Change Game Speed
```javascript
const TICK_RATE = 100; // Lower = faster (milliseconds)
```

### Add More Players
```javascript
class Game {
  constructor(gameId, maxPlayers = 4) { // Change 4 to higher number
```

## Tech Stack

- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: HTML5 Canvas + Vanilla JavaScript
- **Networking**: WebSockets (Socket.IO)

## Project Structure

```
multiplayer-snake/
├── server.js           # Node.js backend with game logic
├── package.json        # Dependencies
├── public/
│   ├── index.html     # Main game page
│   ├── game.js        # Client-side game logic
│   └── style.css      # Styling
└── README.md          # This file
```

## License

MIT
