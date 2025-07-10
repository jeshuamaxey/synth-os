// lib/vibeShifterAudio.ts
type Note = number // MIDI number; 60 == C4

const semitonesToRatio = (n: number) => Math.pow(2, n / 12)

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1,
  D: 2, 'D#': 3, Eb: 3,
  E: 4,
  F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8,
  A: 9, 'A#': 10, Bb: 10,
  B: 11
}

function noteNameToMidi(note: string): number {
  const match = note.match(/^([A-Ga-g][#b]?)(-?\d)$/)
  if (!match) throw new Error(`Invalid note format: ${note}`)

  const [, name, octaveStr] = match
  const semitone = NOTE_TO_SEMITONE[name.toUpperCase()]
  const octave = parseInt(octaveStr, 10)

  return 12 * (octave + 1) + semitone
}

type VibeShifterEvent = 'play'
type VibeShifterListener = (event: 'play', payload: { note: string; startTime: number }) => void

export class VibeShifterAudio {
  private inBrowser = typeof window !== 'undefined'
  public ctx: AudioContext | null = null
  public buffer: AudioBuffer | null = null
  private workletReady = false
  public startTime: number | null = null
  public duration: number | null = null

  private listeners: VibeShifterListener[] = []

  constructor(
    private sampleUrl: string,
    private rootMidi: Note = 60 // sample recorded at C4 by default
  ) {
    if (this.inBrowser) {
      this.ctx = new AudioContext()
      this.buffer = new AudioBuffer({
        length: 1,
        sampleRate: 44100,
        numberOfChannels: 2
      })
    } else {
      console.warn('VibeShifterAudio: cannot instantiate outside of browser')
    }
  }

  // Event API
  addEventListener(fn: VibeShifterListener) {
    this.listeners.push(fn)
  }

  removeEventListener(fn: VibeShifterListener) {
    this.listeners = this.listeners.filter(l => l !== fn)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private dispatch(event: VibeShifterEvent, payload: any) {
    this.listeners.forEach(fn => fn(event, payload))
  }

  /** Load the SoundTouch worklet once. Call automatically from play(). */
  private async ensureWorklet(): Promise<void> {
    if (!this.ctx) {
      console.warn('VibeShifterAudio: cannot load worklet outside of browser'); return
    }
    if (this.workletReady) return

    await this.ctx.audioWorklet.addModule('/js/soundtouch-worklet.js')

    this.workletReady = true
  }

  /** Decode the sample once after constructing. */
  async loadSample(): Promise<void> {
    if (!this.ctx) {
      console.warn('VibeShifterAudio: cannot load sample outside of browser'); return
    }
    const res = await fetch(this.sampleUrl)
    const arrBuf = await res.arrayBuffer()
    this.buffer = await this.ctx.decodeAudioData(arrBuf)
  }

  /** Play a MIDI note (60 = C4). */
  async play(note: string): Promise<void> {
    if (!this.ctx) {
      console.warn('VibeShifterAudio: cannot play note outside of browser'); return
    }
    if (!this.buffer) {
      console.warn('Sample not loaded'); return
    }
    await this.ensureWorklet()

    const midi = noteNameToMidi(note)

    // 1. Buffer source
    const src = this.ctx.createBufferSource()
    src.buffer = this.buffer

    // 2. Pitch‑shifter node
    const stNode = new AudioWorkletNode(this.ctx, 'soundtouch-processor')
    const diff = midi - this.rootMidi
    const ratio = semitonesToRatio(diff)
    stNode.parameters.get('pitch')!.setValueAtTime(ratio, this.ctx.currentTime)
    stNode.parameters.get('tempo')!.value = 1.0  // keep original tempo
    stNode.parameters.get('rate')!.value = 1.0

    // 3. Wire & start
    this.startTime = this.ctx.currentTime
    this.duration = this.buffer.duration

    src.connect(stNode).connect(this.ctx.destination)
    src.start()
    this.dispatch('play', { note, startTime: this.startTime })
  }
  
}
