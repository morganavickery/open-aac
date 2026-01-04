import React from 'react'

export default function BoardRenderer({board, onPlay}:{board:any, onPlay:(text:string)=>void}) {
  const cols = board.cols || 3
  const cells = board.cells || []
  return (
    <div>
      <h2 className="text-lg font-medium mb-2">{board.title}</h2>
      <div className="grid gap-2" style={{gridTemplateColumns:`repeat(${cols}, minmax(0,1fr))`}}>
        {cells.map((c:any)=>(
          <button
            key={c.id}
            onClick={()=> onPlay(c.text || c.label || '')}
            className="p-4 bg-white rounded-lg shadow-sm text-left focus:outline focus:outline-2 focus:outline-indigo-500"
            style={{minHeight:80}}
            aria-label={c.label || c.text || 'board-cell'}
          >
            <div className="text-base font-semibold">{c.label || c.text}</div>
            {c.hint && <div className="text-sm text-slate-500">{c.hint}</div>}
          </button>
        ))}
      </div>
    </div>
  )
}
