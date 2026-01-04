import React from 'react'

export default function CellEditor({cell, onChange, onRemove}:{cell:any, onChange:(c:any)=>void, onRemove?:()=>void}) {
  return (
    <div className="p-2 bg-white rounded shadow-sm flex gap-2 items-start">
      <div className="flex-1">
        <label className="block text-xs text-slate-600">Label</label>
        <input value={cell.label||''} onChange={e=>onChange({...cell, label: e.target.value})}
          className="w-full p-1 border rounded" />
        <label className="block text-xs text-slate-600 mt-1">Text (for TTS)</label>
        <input value={cell.text||''} onChange={e=>onChange({...cell, text: e.target.value})}
          className="w-full p-1 border rounded" />
      </div>
      {onRemove && (
        <div>
          <button onClick={onRemove} className="text-sm text-red-600 px-2 py-1 rounded border">Remove</button>
        </div>
      )}
    </div>
  )
}
