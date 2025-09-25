import React, { useEffect, useState, useRef } from 'react'
import ProgressBar from './Shared/ProgressBar'
import useSignaling from '../utils/Signalling'
import { createPeerAsClient } from '../utils/WebRTC'

export default function Receive() {
  const { ws, joinRoom, status: sigStatus, send } = useSignaling();
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const incomingBuffer = useRef([]);
  const meta = useRef(null);
  const [input, setInput] = useState('');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [download, setDownload] = useState(null);

  useEffect(() => {
    if (ws) ws.close()
  }, [ws])

  function log(m) {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${m}`].slice(-200))
  }

  async function handleOffer(msg) {
    log('Received Offer');
    const { pc, onDataChannel } = await createPeerAsClient(msg.sdp, msg.from, (signal) => send(signal));
    pcRef.current = pc;
    onDataChannel((dc) => {
      dcRef.current = dc;
      dc.onopen = () => log('Data Channel open');
      dc.onmessage = async (e) => {
        if (typeof e.data === 'string') {

          try {
            const m = JSON.parse(e.data);
            // setting up the meta data
            if (m.type === 'start') {
              meta.current = m;
              incomingBuffer.current = [];
              setProgress(0);
              log('incoming: ' + m.fileName);
            }

            if (m.type === 'end') {
              const blob = new Blob(incomingBuffer.current);
              const url = URL.createObjectURL(blob);
              setDownload({ url, name: meta.current.fileName })
              log('file ready');
            }
          } catch (error) {
            log('Error Occured: '+ error);
          }

        }
        else {
          incomingBuffer.current.push(e.data);
          const received = incomingBuffer.current.reduce((s, b) => s + b.byteLength, 0);
          setProgress((received / meta.current.fileSize) * 100);
        }
      }
    })

  }

  function handleJoin() {
    if (!input) return alert('Enter room id or full link');
    try {
      const url = new URL(input);
      const rid = url.searchParams.get('room');
      if (rid) {
        setInput(rid);
      }
    } catch (error) {
      log('Error: '+error);
    }

    joinRoom(input, handleOffer);
  }

  return (
    <div className="bg-slate-800/30 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Receive a file</h2>
        <div className="text-sm text-slate-300">Signaling: <span className="font-mono">{sigStatus}</span></div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 rounded-lg bg-slate-900/40">
          <label className="block text-sm text-slate-300 mb-2">Enter room id or paste share link</label>
          <input value={input} onChange={(e) => setInput(e.target.value)} className="w-full rounded px-3 py-2 bg-slate-800 text-slate-200" placeholder="room id or link" />
          <div className="mt-3 flex gap-2">
            <button onClick={handleJoin} className="px-4 py-2 rounded bg-indigo-500 font-semibold">Join Room</button>
          </div>


          <div className="mt-4"><ProgressBar value={progress} /></div>
          {download && <a className="mt-3 inline-block px-4 py-2 bg-green-600 rounded" href={download.url} download={download.name}>Download {download.name}</a>}
        </div>


        <div className="p-4 rounded-lg bg-slate-900/20">
          <h4 className="font-medium mb-2">Activity Log</h4>
          <div className="h-64 overflow-auto bg-black/20 rounded p-2 text-xs font-mono">{logs.length === 0 ? <div className="text-slate-400">No logs yet</div> : logs.map((l, i) => (<div key={i}>{l}</div>))}</div>
        </div>
      </div>
    </div>
  )
}


