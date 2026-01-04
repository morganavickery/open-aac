import React, { useEffect, useState } from 'react'
import { db, Board } from '../services/db'
import { v4 as uuidv4 } from 'uuid'
import CellEditor from './CellEditor'
import BoardList from './BoardList'
import { ExportImport } from './ExportImport'

function makeEmptyCell(idx:number){ return { id: uuidv4(), label: `cell ${idx+1}`, text: '' } }

export default function BoardEditor() {
  const [board, setBoard] = useState<Board | null>(null)
  const [cols, setCols] = useState(3)

  useEffect(()=> {
    // load default or sample if no board selected
    (async ()=> {
      const first = await db.boards.orderBy('title').first()
      if (first) { setBoard(first); setCols(first.cols || 3) }
    })()
  },[])

  function newBoard() {
    const id = `board-${Date.now()}`
    const b:Board = { id, title: 'Untitled', cols: 3, cells: [makeEmptyCell(0), makeEmptyCell(1), makeEmptyCell(2)] }
    setBoard(b)
    setCols(3)
  }

  function updateCell(index:number, c:any){
    if(!board) return
    const cells = [...board.cells]
    cells[index] = {...cells[index], ...c}
    setBoard({...board, cells})
  }

  function addCell() {
    if(!board) return
    setBoard({...board, cells:[...board.cells, makeEmptyCell(board.cells.length)]})
  }

  function removeCell(index:number) {
    if(!board) return
    const cells = [...board.cells]; cells.splice(index,1)
    setBoard({...board, cells})
  }

  async function saveBoard() {
    if(!board) return
    const toSave = {...board, cols: cols || 3}
    await db.boards.put(toSave)
    alert('Saved')
  }

  function loadBoard(b:Board) {
    setBoard(b); setCols(b.cols || 3)
  }

  async function importBoard(b:Board) {
    // ensure unique id if collides
    const existing = await db.boards.get(b.id)
    if (existing) b.id = `${b.id}-${Date.now()}`
    await db.boards.put(b)
    setBoard(b)
    alert('Imported')
  }

  return (
    <div>
      <div className="flex gap-4">
        <div className="w-72">
          <BoardList onSelect={loadBoard} />
          <div className="mt-2">
            <button onClick={newBoard} className="w-full p-2 rounded border">New board</button>
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-4">
            <label className="block text-sm">Title</label>
            <input value={board?.title||''} onChange={e=>setBoard(b=> b? {...b, title: e.target.value} : null)}
              className="w-full p-2 border rounded" />
            <label className="block text-sm mt-2">Columns</label>
            <input type="number" min={1} value={cols} onChange={e=>setCols(Number(e.target.value))}
              className="w-24 p-2 border rounded" />
          </div>

          <div className="space-y-2">
            {board?.cells.map((c, i)=>(
              <CellEditor key={c.id} cell={c} onChange={(nc)=> updateCell(i, nc)} onRemove={()=> removeCell(i)} />
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <button onClick={addCell} className="px-3 py-1 rounded border">Add cell</button>
            <button onClick={saveBoard} className="px-3 py-1 rounded bg-indigo-600 text-white">Save board</button>
          </div>

          <ExportImport board={board||undefined} onImport={importBoard} />
        </div>
      </div>
    </div>
  )
}
