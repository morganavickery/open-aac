import React, { useRef } from 'react'
import { Board } from '../services/db'

export function ExportImport({ board, onImport }:{board?:Board, onImport:(b:Board)=>void}) {
  const inputRef = useRef<HTMLInputElement|null>(null)

  function exportBoard() {
    if (!board) return alert('Select a board first')
    const blob = new Blob([JSON.stringify(board, null, 2)], {type:'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${board.id || 'board'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function triggerImport() {
    inputRef.current?.click()
  }

  function handleFile(e:React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if(!f) return
    const reader = new FileReader()
    reader.onload = ()=> {
      try {
        const parsed = JSON.parse(String(reader.result))
        // basic validation
        if (!parsed || !parsed.id || !Array.isArray(parsed.cells)) throw new Error('Invalid board JSON')
        onImport(parsed)
      } catch (err:any) {
        alert('Failed to import: ' + (err.message||err))
      }
    }
    reader.readAsText(f)
    e.currentTarget.value = ''
  }

  return (
    <div className="mt-4 flex gap-2">
      <button onClick={exportBoard} className="px-3 py-1 rounded border">Export board</button>
      <button onClick={triggerImport} className="px-3 py-1 rounded border">Import board</button>
      <input ref={inputRef} type="file" accept=".json,application/json" onChange={handleFile} style={{display:'none'}} />
    </div>
  )
}
