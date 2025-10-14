import {v4 as uuidv4} from 'uuid';

const rooms = new Map();
let peerCounter = 0;

export function createRoom(ws){
    const roomId = uuidv4().slice(0,6);
    console.log("roomId created: ", roomId);
    rooms.set(roomId, new Set([ws]));
    ws.peerId = `peerId-${++peerCounter}`;
    ws.roomId = roomId;
    return {roomId, peerId: ws.peerId};
}

export function joinRoom(ws, roomId){
    console.log("join room hitted", ws);
    if(!rooms.has(roomId)) return false;
    rooms.get(roomId).add(ws);
    ws.peerId = `peerId-${++peerCounter}`;
    ws.roomId = roomId;
    return true;
}

export function passOffer(ws,msg){
    const peers = rooms.get(ws.roomId);
    console.log("Offer is passinf from ", ws.peerId," to ",msg.to);
    msg.from = ws.peerId;
    if(!peers) return;
    for(const p of peers){
        if(p.peerId === msg.to){
            p.send(JSON.stringify(msg));
        }
    }
    return true;
}

export function passAnswer(ws, msg){
    const peers = rooms.get(ws.roomId);
    console.log("Answer msg passing from ", ws.peerId," to ",ws.to);
    msg.from = ws.peerId;
    if(!peers) return;
    for(const p of peers){
        if(p.peerId === msg.to){
            p.send(JSON.stringify(msg));
        }
    }
    return true;
}

export function passIce(ws, msg){
    const peers = rooms.get(ws.roomId);
    console.log("Ice msg passing from ", ws.peerId," to ", ws.to);
    msg.from = ws.peerId;
    if(!peers) return false;
    for(const p of peers){
        if(p.peerId === msg.to){
            p.send(JSON.stringify(msg));
        }
    }
    return true;
}

export function broadcastToRoom(wss, roomId, sender, message){
    const peers = rooms.get(roomId);
    if(!peers) return;
    console.log("broadcasting: from: ",sender.peerId," msg: ",message.type )
    for(const p of peers){
        if(p !== sender && p.readyState === 1){
            console.log("Sending broadcast to ",p.peerId," from ", sender.peerId);
            p.send(JSON.stringify(message));
        }
    }
}