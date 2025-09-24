import React from 'react'
export default function ProgressBar({ value = 0 }) {
    return (
        <div className="w-full bg-slate-700 rounded h-4 overflow-hidden mt-2">
            <div style={{ width: Math.min(100, Math.max(0, value)) + '%' }} className="h-4 rounded bg-gradient-to-r from-green-400 to-emerald-400" />
        </div>
    )
}