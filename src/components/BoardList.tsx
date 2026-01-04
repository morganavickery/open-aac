import React, { useEffect, useState } from 'react'
import { db, Board } from '../services/db'

export default function BoardList({ onSelect }:{onSelect:(b:Board)=>void}) {
  const [boards, setBoards] = useState<Board[]>([])

  useEffect(()=> {
    let mounted = true
    db.boards.toArray().then(arr => { if(mounted) setBoards(arr) })
    return ()=> { mounted = false }
  },[])

  async function del(id:string) {
    if (!confirm('Delete this board?')) return
    await db.boards.delete(id)
    setBoards(await db.boards.toArray())
  }

  return (
    <div className="mb-4">
      <h3 className="text-lg font-medium mb-2">Boards</h3>
      <div className="space-y-2">
        {boards.length === 0 && <div className="text-sm text-slate-500">No saved boards yet</div>}
        {boards.map(b => (
          <div key={b.id} className="flex items-center gap-2">
            <button className="flex-1 text-left p-2 bg-white rounded shadow" onClick={()=> onSelect(b)} aria-label={`Open board ${b.title}`}>
              <div className="font-semibold">{b.title}</div>
              <div className="text-xs text-slate-500">{b.cells.length} cells • {b.cols} cols</div>
            </button>
            <button onClick={()=> del(b.id)} className="p-2 text-sm rounded border">Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}
