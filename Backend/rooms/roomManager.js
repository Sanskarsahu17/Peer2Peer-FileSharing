import {v4 as uuidv4} from 'uuid';

const rooms = new Map();

export function createRoom(ws){
    const roomId = uuidv4().slice(0,6);
    console.log("roomId created: ", roomId);
    rooms.set(roomId, new Set([ws]));
    return roomId;
}

export function joinRoom(ws, roomId){
    console.log("join room hitted");
    if(!rooms.has(roomId)) return false;
    rooms.get(roomId).add(ws);
    return true;
}

export function broadcastToRoom(wss, roomId, sender, message){
    const peers = rooms.get(roomId);
    if(!peers) return;

    for(const p of peers){
        if(p !== sender && p.readyState === 1){
            client.send(JSON.stringify(message));
        }
    }
}