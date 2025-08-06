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
    engine.trimStartMs = value.trimStartMs
    engine.trimEndMs = value.trimEndMs
  }, [])

  const [trimState, setTrimState] = useVibeShifterBinding(
    engine,
    'trimChanged',
    getValue,
    setValue
  )

  return [trimState, setTrimState]
  
  // const trimState = useVibeShifterEvent(engine, 'trimChanged', (payload: unknown) => {
  //   const typedPayload = payload as TrimState
  //   return {
  //     trimStartMs: typedPayload.trimStartMs,
  //     trimEndMs: typedPayload.trimEndMs
  //   }
  // })

  // const setTrimState = useCallback((trimState: TrimState) => {
  //   console.log('setting trim state', trimState)
  //   if (engine) {
  //     engine.trimStartMs = trimState.trimStartMs
  //     engine.trimEndMs = trimState.trimEndMs
  //   }
  // }, [engine])

  // // Return initial state if no event has been fired yet
  // if (!trimState && engine) {
  //   return [
  //     {
  //       trimStartMs: engine.trimStartMs,
  //       trimEndMs: engine.trimEndMs
  //     },
  //     setTrimState
  //   ]
  // }

  // return [trimState ?? { trimStartMs: 0, trimEndMs: 0 }, setTrimState]
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
  return engine.duration
}

export function useTrimmedDuration() {
  const { engine } = useVibeShifter()
  const isLoaded = useIsLoaded()
  
  if (!engine || !isLoaded) return 0
  return engine.trimmedDuration
} 