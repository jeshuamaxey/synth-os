import { useEffect, useState } from 'react'

export const KEY_TO_NOTE: Record<string, string> = {
  a: 'C4',
  w: 'C#4',
  s: 'D4',
  e: 'D#4',
  d: 'E4',
  f: 'F4',
  t: 'F#4',
  g: 'G4',
  y: 'G#4',
  h: 'A4',
  u: 'A#4',
  j: 'B4',
  k: 'C5'
}

export function useKeyboardToNote(onNote: (note: string) => void, enabled: boolean = true): Set<string> {
  const [downKeys, setDownKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!enabled) return

      const note = KEY_TO_NOTE[e.key]
      if (!note) return
      if (downKeys.has(e.key)) return // prevent retrigger on hold
      
      setDownKeys(prev => new Set(prev).add(e.key))
      onNote(note)
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!enabled) return

      setDownKeys(prev => {
        const next = new Set(prev)
        next.delete(e.key)
        return next
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [onNote, downKeys, enabled])

  return downKeys
}

export function getKeyFromNote(note: string): string {
  return Object.keys(KEY_TO_NOTE).find(key => KEY_TO_NOTE[key] === note) ?? ''
}