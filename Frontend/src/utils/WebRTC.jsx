const STUN = [{urls: 'stun:stun.l.google.com:19302'}];

export async function createPeerAsHost(peerId, sendSignal){
    const pc = new RTCPeerConnection({iceServers: STUN});
    const dc = pc.createDataChannel('file-channel',{ordered : true})
    dc.binaryType = 'arraybuffer'

    pc.onicecandidate = (e)=>{
        if(e.candidate) sendSignal({type: 'ice', to: peerId, candidate: e.candidate});
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    sendSignal({type: 'offer', to: peerId, sdp: pc.localDescription})

    return {pc, dc};
}

export async function createPeerAsClient(offerSDP, fromPeerID, sendSignal){
    const pc = new RTCPeerConnection({iceServers: STUN});
    let onDataChannelCb = null;

    pc.onicecandidate = (e)=>{ if(e.candidate) sendSignal({ type:'ice', to: fromPeerID, candidate: e.candidate }) }

    pc.ondatachannel = (ev)=>{ if(onDataChannelCb) onDataChannelCb(ev.channel)}

    await pc.setRemoteDescription(offerSDP);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    sendSignal({type:'answer', to: fromPeerID, sdp: pc.localDescription})

    return {pc, onDataChannel: (cb)=>{onDataChannelCb = cb}}

}

export async function sendFileOverDataChannel(dc, file, onProgress){
    const chunkSize = 16*1024; // each piece : 16 kb
    const threshold = 1_000_000; // 1 MB max buffer before pausing
    const total = file.size; //  file size in bytes
    const reader = file.stream().getReader(); // get stream reader for file
    let sent = 0;

    // compute sha256 - small optimization: compute by streaming
    async function hashArrayBuffer(buffer){
        const digest = await crypto.subtle.digest('SHA-256', buffer);
        return [...new Uint8Array(digest)]
        .map(b=> b.toString(16).padStart(2,'0'))
        .join('')
    }

    // compute full file checksum (read once into memory if small, or stream - here simple read)
    const fullBuff = await file.arrayBuffer();
    const sha = await hashArrayBuffer(fullBuff);


    // sending the metadata
    dc.send(JSON.stringify({type:'start', fileName: file.name, fileSize: total, fileId: sha, chunkSize}))

    // stream send using stream Reader
    let res = await reader.read();

    while(!res.done){
        const chunk = res.value;
        while(dc.bufferedAmount > threshold){await new Promise(r=>setTimeout(r,50))}

        dc.send(chunk.value)
        sent += chunk.byteLength;

        if(onProgress) onProgress((sent/total)*100);
        res = await reader.read();
    }
    dc.send(JSON.stringify({ type:'end', fileId: sha }));
}