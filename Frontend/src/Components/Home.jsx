import React from 'react'
import { Link } from 'react-router-dom'


export default function Home(){
return (
<div className="bg-slate-800/40 rounded-2xl p-8 shadow-lg backdrop-blur-sm">
<h2 className="text-3xl font-semibold mb-4">Share files directly — peer to peer</h2>
<p className="text-slate-300 mb-6">Create a secure P2P link and transfer files directly between browsers. Files never touch the server.</p>


<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div className="p-6 rounded-xl bg-gradient-to-r from-indigo-700 to-indigo-600 shadow-md">
<h3 className="text-xl font-semibold">Send a File</h3>
<p className="text-slate-200 mt-2 mb-4">Create a share link and send it to your friend. They join and receive the file directly.</p>
<Link to="/share" className="mt-2 inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-4 py-2 rounded-lg">Create Share Link</Link>
</div>


<div className="p-6 rounded-xl bg-gradient-to-r from-purple-700 to-purple-600 shadow-md">
<h3 className="text-xl font-semibold">Receive a File</h3>
<p className="text-slate-200 mt-2 mb-4">Open a received link or enter the room code to accept files from a friend.</p>
<Link to="/receive" className="mt-2 inline-flex items-center gap-2 bg-white text-purple-700 font-semibold px-4 py-2 rounded-lg">Enter Room</Link>
</div>
</div>


<div className="mt-8 text-slate-300">Tip: For best connectivity, use laptops or networks without strict symmetric NAT. Use a TURN server for reliability if required.</div>
</div>
)
}