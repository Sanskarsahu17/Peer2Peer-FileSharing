import {WebSocketServer} from 'ws'
import {handleMessage} from '../utils/messageHandler.js'

export function createWebSocketServer(port){
    const wss = new WebSocketServer({port});

    wss.on("connection",(ws)=>{
        console.log("New client connected");
        ws.on("message", (data)=>{
            try {
                const msg = JSON.parse(data.toString());
                handleMessage(wss,ws,msg);
            } catch (error) {
                
                console.log("Invalid message: ",error);
            }
        });
        ws.on("close", ()=>{
            console.log("Client disconnected");
        });
    });

    return wss;
}