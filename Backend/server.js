import {createWebSocketServer} from "./config/wsConfig.js";

const PORT = process.env.PORT || 8080;
const wss = createWebSocketServer(PORT);

console.log(`Signaling server running on ws://localhost:${PORT}`);
