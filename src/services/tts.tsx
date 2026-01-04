import { useCallback } from 'react'

export function useTTS() {
  const play = useCallback((text: string, opts?: SpeechSynthesisUtteranceInit) => {
    if (!text) return
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text)
      if (opts?.rate) u.rate = opts.rate
      if (opts?.pitch) u.pitch = opts.pitch
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(u)
    } else {
      console.warn('TTS not available on this platform')
    }
  }, [])
  const stop = useCallback(()=> {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }, [])
  return { play, stop }
}
export default useTTS
