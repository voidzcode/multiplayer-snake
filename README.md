# Multiplayer Snake - Photon Web SDK Edition

## Overview

This is a web-based multiplayer snake game that uses **Photon Web SDK** for real-time networking and multiplayer synchronization.

**Note:** The original Socket.IO backend has been replaced with Photon Cloud for simplified deployment and better scalability.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Photon Configuration

The game is configured to use your Photon App ID:

```
App ID: 2902f049-a0b0-410b-9e8b-c488d223e870
```

This is already set in `public/photon-config.js` and `public/game.js`.

### 3. Run the Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## How It Works

### Architecture Changes

- **Before:** Socket.IO backend + custom game server
- **After:** Photon Web SDK for all networking

### Key Features

- **Real-time Multiplayer:** Up to 4 players per room using Photon Cloud
- **Rooms:** Join existing rooms or create new ones
- **Persistent Game State:** Synchronized across all players
- **WebSocket:** Secure WSS connection to Photon Cloud
- **No Backend Game Logic:** Clients handle game updates (for this simple game)

## Game Controls

- **Arrow Keys or WASD:** Move your snake
- **On-screen Buttons:** Alternative controls for touch devices

## File Structure

```
.
├── server.js                 # Express server (serves static files)
├── package.json             # Dependencies
└── public/
    ├── index.html           # Main HTML
    ├── game.js              # Game logic with Photon integration
    ├── photon-config.js     # Photon configuration
    ├── style.css            # Styling
```

## Photon Web SDK

The Photon Web SDK is loaded from CDN:
```html
<script src="https://cdn.jsdelivr.net/npm/photon-javascript-sdk@1.2.5/lib/photon-javascript_sdk.min.js"></script>
```

## Deployment

Deploy this app to any Node.js hosting platform:
- Heroku
- Railway
- Render
- Vercel (with serverless backend)
- AWS
- etc.

All networking goes through Photon Cloud, so no game server logic needs to be deployed.

## Troubleshooting

### Connection Issues

1. Check that your Photon App ID is valid
2. Ensure WebSocket is not blocked by firewall/proxy
3. Check browser console for error messages

### Game Sync Issues

- The game uses client-side game logic, so all players must run the same game rules
- For production, consider moving game validation to Photon plugins or a custom backend

## Future Improvements

- [ ] Move game logic to server-side validation (Photon plugins)
- [ ] Add authentication
- [ ] Add persistence/leaderboards
- [ ] Add more game modes
- [ ] Optimize networking for lower latency
