import React from 'react'
import BoardRenderer from './components/BoardRenderer'
import sampleBoard from './data/sample-board.json'
import { useTTS } from './services/tts'

export default function App() {
  const tts = useTTS()
  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">AAC Starter (PWA)</h1>
        <p className="text-sm text-slate-600">Age-neutral, open-source starter for AAC boards.</p>
      </header>

      <main>
        <BoardRenderer board={sampleBoard} onPlay={(text)=> tts.play(text)} />
      </main>
    </div>
  )
}
