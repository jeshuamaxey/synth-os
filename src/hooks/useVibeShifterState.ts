// import { useCallback } from 'react'
import { useCallback } from 'react'
import { useVibeShifterEvent } from './useVibeShifterEvent'
import { useVibeShifter } from '@/providers/vibe-shifter-provider'
import { useVibeShifterBinding } from './useVibeShifterBinding'
import { VibeShifterAudio } from '@/lib/audio/vibe-shifter'

export function useNowPlayingNotes() {
  const { engine } = useVibeShifter()
  const transform = useCallback((payload: unknown) => {
    const typedPayload = payload as {notes: string[]}
    return typedPayload.notes
  }, [])
  return useVibeShifterEvent(engine, 'notesChanged', transform) ?? []
}

export type TrimState = {
  trimStartMs: number
  trimEndMs: number
}

export function useTrimState(): [TrimState | undefined, (trimState: TrimState) => void] {
  const { engine } = useVibeShifter()

  const getValue = useCallback((engine: VibeShifterAudio) => ({
    trimStartMs: engine.trimStartMs,
    trimEndMs: engine.trimEndMs
  }), [])

  const setValue = useCallback((engine: VibeShifterAudio, value: TrimState) => {
    // Set both values atomically to avoid intermediate events that can revert UI
    engine.setTrimMs(value.trimStartMs, value.trimEndMs)
  }, [])

  const [trimState, setTrimState] = useVibeShifterBinding(
    engine,
    'trimChanged',
    getValue,
    setValue
  )

  return [trimState, setTrimState]
}

export function useIsLoaded() {
  const { engine } = useVibeShifter()
  const transform = useCallback(() => true, [])
  const loadedEvent = useVibeShifterEvent(engine, 'loaded', transform)
  return loadedEvent ?? false
}

export function useIsPlaying() {
  const nowPlayingNotes = useNowPlayingNotes()
  return nowPlayingNotes.length > 0
}

export function useDuration() {
  const { engine } = useVibeShifter()
  const isLoaded = useIsLoaded()
  
  if (!engine || !isLoaded) return 0
  // Prefer actual decoded buffer duration (ms); fall back to sample.duration if available
  if (engine.buffer) return Math.round(engine.buffer.duration * 1000)
  return engine.sample?.duration ?? 0
}

export function useTrimmedDuration() {
  const { engine } = useVibeShifter()
  const isLoaded = useIsLoaded()
  
  if (!engine || !isLoaded) return 0
  return engine.trimmedDuration
}

export function useSampleLoadingProgress() {
  const { engine } = useVibeShifter()
  const transform = useCallback((payload: unknown) => {
    const typedPayload = payload as {progress: number}
    return typedPayload.progress
  }, [])
  return useVibeShifterEvent(engine, 'sampleLoadingProgress', transform) ?? 0
}