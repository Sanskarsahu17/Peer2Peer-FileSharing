import {createRoom, joinRoom, broadcastToRoom} from '../rooms/roomManager.js'

export function handleMessage(wss, ws, msg){
    switch(msg.type){
        case "create_room": {
            const roomId = createRoom(ws);
            ws.send(JSON.stringify({type: "room_created", roomId}));
            break;
        }

        case "join_room":{
            const success = joinRoom(ws,msg.roomId);
            if(success){
                ws.send(JSON.stringify({type:"room_joined", roomId: msg.rooId}));
            }
            else{
                ws.send(JSON.stringify({ type: "error", error: "Room not found" }));
            }
            break;
        }

        case "offer":
        case "answer":
        case "ice_candidate": {
        // Forward signaling messages to other peers in the room
        console.log("Got offer from", ws);
        broadcastToRoom(wss, msg.roomId, ws, msg);
        break;
        }
        default:
        ws.send(JSON.stringify({ type: "error", error: "Unknown message type" }));
    }
}