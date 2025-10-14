import { useState, useRef } from "react";


const SIGNAL = import.meta.env.VITE_SIGNALING || 'ws://localhost:8080'

export default function useSignaling() {
    const wsRef = useRef(null);

    // high level callbacks set by caller code
    const peerJoinedRef = useRef(null); // host: handler when a peer joined -> should return {setRemoteDesc, addIce}
    const offerHandlerRef = useRef(null);// receive: handle for incoming offer -> should return { addIce }

    // helpers that signalling stores (functions exposed by createPeerAsHost and createPeerAsClient)
    const setRemoteDescRef = useRef(null);
    const addIceRef = useRef(null);

    // buffers for messages that arrive before handlers are registered
    const pendingAnswerRef = useRef(null);
    const pendingIceRef = useRef([]);

    const [roomId, setRoomId] = useState(null);
    const [status, setStatus] = useState('idle');

    function connect() {
        if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) return;
        const ws = new WebSocket(SIGNAL);

        wsRef.current = ws;
        ws.onopen = () => setStatus('connected');
        ws.onclose = () => setStatus('Closed');
        ws.onerror = () => setStatus('error');

        ws.onmessage = (ev) => {
            try {
                const msg = JSON.parse(ev.data);
                handleIncoming(msg);
            } catch (e) {
                console.log("Error Occured Messages: " + e);
            }
        }
    }

    async function handleIncoming(msg) {
        console.log("Incoming msg: ", msg.type);


        // simple room creation
        if (msg.type == 'room_created') {
            console.log("My peer Id is: ", msg.peerId);
            console.log("The room I'm allocated to: ", msg.roomId);
            setRoomId(msg.roomId)
            return;
        }

        // After a peer jooins the host's room
        if (msg.type == 'peer_joined' && typeof peerJoinedRef.current === 'function') {
            console.log(`Peer Joined: ${msg.peerId}`);
            try {
                const res = await Promise.resolve(peerJoinedRef.current(msg.peerId));

                if (res && typeof res.setRemoteDesc === 'function') {
                    setRemoteDescRef.current = res.setRemoteDesc;
                    if (pendingAnswerRef.current) {
                        const answerMsg = pendingAnswerRef.current;
                        pendingAnswerRef.current = null;
                        try {
                            await setRemoteDescRef.current(answerMsg.sdp);
                        } catch (err) {
                            console.log('Error applying pending answer:', err);
                        }
                    }
                }

                if (res && typeof res.addIce === 'function') {
                    addIceRef.current = res.addIce;
                    // drain any pending ICE Candidates
                    if (pendingIceRef.current.length) {
                        const arr = pendingIceRef.current.slice();
                        pendingIceRef.current.length = 0;
                        for (const c of arr) {
                            try { await addIceRef.current(c); }
                            catch (err) {
                                console.log('Error applying pending Ice: ', err);
                            }
                        }
                    }
                }
                else {
                    console.warn('PeerJoined handler did not return {setRemoteDesc, addIce}')
                }
            } catch (error) {
                console.log("Error running peerJoined handler: ", error);
            }
            return;
        }

        if (msg.type == 'answer') {
            console.log("Got answer from the peer ", msg.from);
            if (typeof setRemoteDescRef.current === 'function') {
                try {
                    await setRemoteDescRef.current(msg.sdp);
                    console.log('Remote desc set successfully');
                } catch (err) {
                    console.error('Failed to set remote Description: ', err);
                }
            } else {
                console.warn('SetRemoteDesc not ready yet - buffering answer');
                pendingAnswerRef.current = msg;
            }
            return;
        }


        // Sanskar : My Suggestion first add the msg in the pending ice then if function is there 
        // then for all pending ice send it in the function and then finally set the pending ice to null
        if (msg.type === 'ice') {
            const candidate = msg.candidates;
            if (typeof addIceRef.current === 'function') {
                try {
                    await addIceRef.current(candidate);
                }
                catch (err) {
                    console.error('addIce Failed', err)
                }
            }
            else {
                pendingIceRef.current.push(candidate);
            }

            return;
        }

        if (msg.type === 'offer') {
            if (typeof offerHandlerRef.current === 'function') {
                try {
                    const res = await Promise.resolve(offerHandlerRef.current(msg));

                    // if client returns addIce, store and drain buffer
                    if (res && typeof res.addIce === 'function') {
                        addIceRef.current = res.addIce;
                        if (pendingIceRef.current.length) {
                            const arr = pendingIceRef.current.slice();
                            pendingIceRef.current.length = 0;
                            for (const c of arr) {
                                try {
                                    await addIceRef.current(c);
                                }
                                catch (err) {
                                    console.error('drain pending ice(client) failed', err);
                                }
                            }
                        }

                        
                    }

                }
                catch (err) {
                    console.error('Error in offer handler', err);
                }
            }
            else {
                console.warn('Offer received but no offerHandler registered')
            }

            return;
        }

        if (msg.type === 'room_joined') {
            console.log("You joined the room successfully", msg.roomId);
            console.log("Your peerId is: ", msg.peerId);
            return;
        }

        if (msg.type === 'error') {
            console.warn('signal error', msg);
            return;
        }

        console.warn('Unhandled signaling message type', msg.type);
    }




    function createRoom(onPeerJoined) {

        if (onPeerJoined) peerJoinedRef.current = onPeerJoined;

        if (!wsRef.current) connect();
        wsRef.current.addEventListener('open', () => {
            const id = Math.random().toString(36).slice(3, 9);
            wsRef.current.send(JSON.stringify({ type: 'create_room', roomId: id }))
        }, { once: true })
    }

    function joinRoom(room, onOfferHandler) {
        if(onOfferHandler) offerHandlerRef.current = onOfferHandler;
        if (!wsRef.current) connect();
        console.log("Signaling server: ", SIGNAL);
        if (wsRef.current.readyState === WebSocket.OPEN) {

            wsRef.current.send(JSON.stringify({ type: 'join_room', roomId: room }))
        } else {
            wsRef.current.addEventListener('open', () => {
                wsRef.current.send(JSON.stringify({ type: 'join_room', roomId: room }))
            }, { once: true })
        }

        // wsRef.current.onmessage = (ev) => {
        //     try {
        //         const msg = JSON.parse(ev.data);
        //         console.log("Msg Received: ", msg.type);
        //         if (msg.type == 'offer') {
        //             console.log("Got the offer: ", msg);
        //             onOfferHandler(msg);
        //         }
        //         if (msg.type == 'room_joined') {
        //             console.log("You joined the room successfully", msg.roomId);
        //             console.log("Your peerId is: ", msg.peerId);
        //         }
        //         if (msg.type == 'ice') {
        //             console.log("Got some ice from host ", msg.from);
        //         }

        //         if (msg.type == 'error') {
        //             console.log("Room not found");
        //         }    
        //     }
        //     catch (e) {
        //         console.log(e);
        //     }
        // }
    }

    function send(msg) {
        console.log("Sending message: ", msg);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(msg));
    }

    return { ws: wsRef.current, roomId, status, createRoom, joinRoom, send };
}