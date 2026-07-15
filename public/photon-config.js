// Photon Web SDK Configuration
const PhotonConfig = {
    AppID: '2902f049-a0b0-410b-9e8b-c488d223e870',
    WsPath: 'ws',
    AuthMode: 0,
    Version: '1.0.0'
};

// Initialize Photon
const photonPeer = new Photon.Chat.ChatPeer(
    new WebSocket,
    PhotonConfig.AppID,
    PhotonConfig.Version
);
