import { useEffect, useRef, useState, useCallback } from 'react'
import { VibeShifterAudio } from '@/lib/audio/vibe-shifter'

type VibeShiftEvent = 'trimChanged' // Extend as needed

export function useVibeShifterBinding<T>(
  engine: VibeShifterAudio | null,
  eventName: VibeShiftEvent,
  getValue: (engine: VibeShifterAudio) => T,
  setValue: (engine: VibeShifterAudio, newValue: T) => void
): [T | undefined, (val: T) => void] {
  const [state, setState] = useState<T>()
  const lastSetRef = useRef<T | undefined>(undefined)
  const hasInitializedRef = useRef(false)
  const engineRef = useRef<VibeShifterAudio | null>(null)

  // Memoize the functions to prevent infinite re-renders
  const memoizedGetValue = useCallback(getValue, [])
  const memoizedSetValue = useCallback(setValue, [])

  // Sync incoming events from engine to React
  useEffect(() => {
    if (!engine) return

    // Reset initialization flag if engine changed
    if (engineRef.current !== engine) {
      hasInitializedRef.current = false
      engineRef.current = engine
    }

    const handler = () => {
      const current = memoizedGetValue(engine)
      if (lastSetRef.current !== undefined && deepEqual(current, lastSetRef.current)) {
        // Don't update state if this value came from React just before
        // Clear the lastSetRef after a short delay to allow future updates
        setTimeout(() => {
          lastSetRef.current = undefined
        }, 100)
        return
      }
      setState(current)
    }

    engine.addEventListener(eventName, handler)
    
    // Only set initial value once when the component mounts or engine changes
    if (!hasInitializedRef.current) {
      handler() // Set initial value
      hasInitializedRef.current = true
    }

    return () => {
      engine.removeEventListener(eventName, handler)
    }
  }, [engine, eventName, memoizedGetValue])

  // Setter from React → engine
  const update = useCallback(
    (val: T) => {
      if (!engine) return
      lastSetRef.current = val
      memoizedSetValue(engine, val)
      setState(val) // Optimistically update React state
    },
    [engine, memoizedSetValue]
  )

  return [state, update]
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null || b == null) return a === b
  if (typeof a !== typeof b) return false
  
  if (typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false
    
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) return false
      }
      return true
    }
    
    const keysA = Object.keys(a as object)
    const keysB = Object.keys(b as object)
    
    if (keysA.length !== keysB.length) return false
    
    for (const key of keysA) {
      if (!keysB.includes(key)) return false
      if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) return false
    }
    
    return true
  }
  
  return a === b
}
