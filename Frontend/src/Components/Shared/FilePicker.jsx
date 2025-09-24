import React, { useRef } from 'react'
export default function FilePicker({ onPick }) {
    const ref = useRef()
    function onChange(e) { if (e.target.files[0]) onPick(e.target.files[0]) }
    function onDrop(e) { e.preventDefault(); if (e.dataTransfer.files[0]) onPick(e.dataTransfer.files[0]) }
    return (
        <div onDrop={onDrop} onDragOver={(e) => e.preventDefault()} onClick={() => ref.current.click()} className="border-2 border-dashed border-slate-700 rounded p-4 cursor-pointer">
            <div className="text-slate-300">Drag & drop or click to select</div>
            <input ref={ref} type="file" className="hidden" onChange={onChange} />
        </div>
    )
}