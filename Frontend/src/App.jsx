import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Home from './Components/Home'
import Share from './Components/Share'
import Receive from './Components/Receive'


export default function App(){
return (
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-slate-100">
<header className="max-w-5xl mx-auto p-6 flex justify-between items-center">
<Link to="/" className="text-2xl font-bold">Peer2Peer · FileShare</Link>
<nav className="space-x-4 text-sm text-slate-300">
<Link to="/share" className="hover:underline">Send</Link>
<Link to="/receive" className="hover:underline">Receive</Link>
</nav>
</header>


<main className="max-w-5xl mx-auto p-6">
<Routes>
<Route path="/" element={<Home/>} />
<Route path="/share" element={<Share/>} />
<Route path="/receive" element={<Receive/>} />
</Routes>
</main>


<footer className="max-w-5xl mx-auto p-6 text-center text-xs text-slate-400">
Built with WebRTC + React • Signaling server: <span className="font-mono">{import.meta.env.VITE_SIGNALING || 'ws://localhost:8080'}</span>
</footer>
</div>
)
}