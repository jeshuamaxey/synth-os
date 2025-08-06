import { useEffect, useState, useCallback } from 'react'
import { VibeShifterAudio } from '@/lib/audio/vibe-shifter'

type VibeShiftEvent = 'play' | 'loaded' | 'notesChanged' | 'trimChanged'

export function useVibeShifterEvent<T>(
  engine: VibeShifterAudio | null,
  eventName: VibeShiftEvent,
  transform: (payload: unknown) => T
): T | undefined {
  const [value, setValue] = useState<T>()

  // Memoize the transform function to prevent infinite re-renders
  const memoizedTransform = useCallback(transform, [])

  useEffect(() => {
    if (!engine) return

    const handler = (payload: unknown) => {
      setValue(memoizedTransform(payload))
    }

    engine.addEventListener(eventName, handler)
    return () => {
      engine.removeEventListener(eventName, handler)
    }
  }, [engine, eventName, memoizedTransform])

  return value
} 