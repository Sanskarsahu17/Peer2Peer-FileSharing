import { useState, useRef } from "react";

const SIGNAL = import.meta.env.VITE_SIGNALING || 'ws://localhost:8080'

export default function useSignaling(){
    const wsRef = useRef(null);
    const [roomId, setRoomId] = useState(null);
    const [status, setStatus] = useState('idle');

    function connect(){
        const ws = new WebSocket(SIGNAL);
        wsRef.current = ws;
        ws.onopen = () => setStatus('connected');
        ws.onclose = () => setStatus('Closed');
        ws.onerror = () => setStatus('error');
        ws.onmessage = (ev)=>{
            try {
                const msg = JSON.parse(ev.data);
                handleIncoming(msg);
            } catch (e) {
                console.log("Error Occured Messages: "+e);
            }
        }
    }

    function handleIncoming(msg){
        if(msg.type == 'room_created'){
            setRoomId(msg.roomId);
        }
    }

    function createRoom(){
        if(!wsRef.current) connect();
        wsRef.current.addEventListener('open', ()=>{
            const id = Math.random().toString(36).slice(3,9);
            wsRef.current.send(JSON.stringify({type: 'create_room', roomID: id}))
        }, {once: true})
    }

    function joinRoom(room, onOfferHandler){
        if(!wsRef.current()) connect();
        wsRef.current.addEventListener('open',()=>{
            wsRef.current.send(JSON.stringify({type:'join_room', roomId: room}))
        }, {once: true});

        wsRef.current.onmessage = (ev)=>{
            try{
                const msg = JSON.parse(ev.data);
                if(msg.type == 'offer') onOfferHandler(msg);
            }
            catch(e){
                console.log(e);
            }
        }
    }

    function send(msg){
        if(wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(msg));
    }

    return {ws: wsRef.current, roomId, status, createRoom, joinRoom, send};
}