import React, { useEffect, useState, useRef } from 'react'
import FilePicker from './Shared/FilePicker'
import ProgressBar from './Shared/ProgressBar'
import useSignaling from '../utils/Signalling'
import { createPeerAsHost, sendFileOverDataChannel } from '../utils/WebRTC'

function Share() {
  const { ws, roomId, status: sigStatus, createRoom, send } = useSignaling();
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const fileRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [logs, setlogs] = useState([]);

  useEffect(() => {
    createRoom();
    return () => { if (ws) ws.close() }
  }, [])

  function log(msg) {
    setlogs(s => [...s, `[${new Date().toLocaleTimeString}] ${msg}`].slice(-200)
    )
  }

  async function handlePeerJoined(peerId) {
    log('Peer JOined: ' + peerId);
    const { pc, dc } = await createPeerAsHost(peerId, (msg) => send(msg));
    pcRef.current = pc;
    dcRef.current = dc;
    pc.onconnectionstatechange = () => log('PC state: ' + pc.connectionState);
    dc.onopen = () => log('DataChannel Open');
    dc.onclose = () => log('DataChannel Closed');
    dc.onmessage = (e) => log('msg from peer: ' + (typeof e.data === 'string' ? e.data : `[binary ${e.data.byteLength}]`));

  }

  async function onFilePicked(file) {
    fileRef.current = file;
  }

  async function onSend() {
    if (!dcRef.current || dcRef.current.readyState !== 'open') {
      return alert('Wait for peer to connect')
    }
    if (!fileRef.current) return alert('Pick a file')
    setProgress(0);
    await sendFileOverDataChannel(dcRef.current, fileRef.current, (p) => setProgress(p));
    log('send complete')
  }

  return (
    <div className="bg-slate-800/30 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Create a share room</h2>
        <div className="text-sm text-slate-300">Signaling: <span className="font-mono">{sigStatus}</span></div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 rounded-lg bg-slate-900/40">
          <label className="block text-sm text-slate-300 mb-2">Select file to send</label>
          <FilePicker onPick={onFilePicked} />
          <div className="mt-4 flex gap-2">
            <button onClick={onSend} className="px-4 py-2 rounded bg-indigo-500 font-semibold">Send File</button>
            <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/receive?room=${roomId}`)} className="px-4 py-2 rounded bg-slate-700">Copy Link</button>
          </div>
          <div className="mt-3 text-slate-300 text-sm">Room ID: <span className="font-mono">{roomId || '...'}</span></div>
          <div className="mt-3"><ProgressBar value={progress} /></div>
        </div>


        <div className="p-4 rounded-lg bg-slate-900/20">
          <h4 className="font-medium mb-2">Activity Log</h4>
          <div className="h-64 overflow-auto bg-black/20 rounded p-2 text-xs font-mono">
            {logs.length === 0 && <div className="text-slate-400">No logs yet</div>}
            {logs.map((l, i) => (<div key={i} className="text-slate-200">{l}</div>))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Share
