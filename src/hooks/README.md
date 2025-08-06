# VibeShifter Hooks

This directory contains React hooks for integrating with the VibeShifterAudio class.

## Core Hook

### `useVibeShifterEvent<T>`

A generic hook that subscribes to VibeShifterAudio events and updates React state when events are emitted.

```typescript
function useVibeShifterEvent<T>(
  engine: VibeShifterAudio | null,
  eventName: VibeShiftEvent,
  transform: (payload: unknown) => T
): T | undefined
```

**Parameters:**
- `engine`: The VibeShifterAudio instance (can be null)
- `eventName`: The event to subscribe to ('play' | 'loaded' | 'notesChanged' | 'trimChanged')
- `transform`: Function to transform the event payload into the desired type

**Returns:** The transformed event data or undefined if no event has been fired yet

## Convenience Hooks

### `useNowPlayingNotes()`
Returns the array of currently playing note names.

### `useTrimState()`
Returns an object with `trimStartMs` and `trimEndMs` values.

### `useIsLoaded()`
Returns a boolean indicating if the sample has finished loading.

### `useIsPlaying()`
Returns a boolean indicating if any notes are currently playing.

### `useDuration()`
Returns the duration of the loaded sample in seconds.

### `useTrimmedDuration()`
Returns the duration of the trimmed sample in seconds.

## Usage Example

```typescript
import { useVibeShifter } from '@/providers/vibe-shifter-provider'
import { useNowPlayingNotes, useIsPlaying } from '@/hooks/useVibeShifterState'

function MyComponent() {
  const { engine } = useVibeShifter()
  const nowPlayingNotes = useNowPlayingNotes()
  const isPlaying = useIsPlaying()

  return (
    <div>
      <p>Playing: {nowPlayingNotes.join(', ')}</p>
      <p>Status: {isPlaying ? 'Playing' : 'Stopped'}</p>
      <button onClick={() => engine?.play('C4')}>Play C4</button>
    </div>
  )
}
```

## Provider Setup

Wrap your app with the VibeShifterProvider:

```typescript
import { VibeShifterProvider } from '@/providers/vibe-shifter-provider'

function App() {
  const [sample, setSample] = useState<Sample | null>(null)
  
  return (
    <VibeShifterProvider sample={sample}>
      <YourComponents />
    </VibeShifterProvider>
  )
}
``` 