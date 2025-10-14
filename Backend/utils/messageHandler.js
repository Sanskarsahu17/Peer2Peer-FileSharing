import {createRoom, joinRoom, broadcastToRoom, passOffer, passAnswer, passIce} from '../rooms/roomManager.js'

export function handleMessage(wss, ws, msg){
    switch(msg.type){
        case "create_room": {
            const {roomId, peerId} = createRoom(ws);
            ws.send(JSON.stringify({type: "room_created", roomId, peerId}));
            break;
        }

        case "join_room":{
            const success = joinRoom(ws,msg.roomId);
            if(success){
                console.log("cleint join the room succesfully");
                ws.send(JSON.stringify({type:"room_joined", roomId: msg.roomId, peerId : ws.peerId}));
                broadcastToRoom(wss, msg.roomId, ws, {type: "peer_joined", peerId: ws.peerId})
            }
            else{
                ws.send(JSON.stringify({ type: "error", error: "Room not found" }));
            }
            break;
        }

        case "offer":{
            const offerRelay = passOffer(ws, msg);
            if(offerRelay){
                console.log("Offer relayed successfully");
            }
            else{
                console.log("Cannot relay the message!");
            }
            break;
        }
        case "answer":{
            const answerRelay = passAnswer(ws, msg);
            if(answerRelay){
                console.log("Answer Relayed successfully");
            }
            else{
                console.log("Cannot relay the message");
            }
        }
        case "ice": {
            const relayIce = passIce(ws,msg);
            if(relayIce){
                console.log("Answer Relayed successfully");
            }
            else{
                console.log("cannot Relay message");
            }
        break;
        }
        default:
        ws.send(JSON.stringify({ type: "error", error: "Unknown message type" }));
    }
}