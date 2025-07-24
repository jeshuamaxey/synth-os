import { Sample } from "@/types/supabase"

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

type VibeShiftEvent = 'play' | 'loaded'
type VibeShiftPlayListener = (payload: { note: string; startTime: number }) => void
type VibeShiftLoadedListener = (payload: object) => void

type VibeShiftListener = VibeShiftPlayListener | VibeShiftLoadedListener

const DEFAULT_OPTIONS = {
  debug: false
}

export class VibeShifterAudio {
  public ctx: AudioContext | null = null
  public buffer: AudioBuffer | null = null
  public startTime: number | null = null
  public isPlaying = false
  public sample: Sample | undefined = undefined
  
  private inBrowser = typeof window !== 'undefined'
  private workletReady = false
  private stNode: AudioWorkletNode | null = null

  private listeners: Record<VibeShiftEvent, VibeShiftListener[]> = {
    play: [],
    loaded: []
  }

  private _trimStartMs: number | null = null
  private _trimEndMs: number | null = null

  constructor(
    sample: Sample | null = null,
    private options: typeof DEFAULT_OPTIONS = DEFAULT_OPTIONS
  ) {
    if (this.inBrowser) {
      this.ctx = new AudioContext()

      this.buffer = new AudioBuffer({
        length: 1,
        sampleRate: 44100,
        numberOfChannels: 2
      })

      this.ensureWorklet().then(() => {
        this.log('worklet ready')
        this.loadSample()
      })
      .then(() => {
        this.log('sample loaded')
      })
      .catch((err) => {
        console.error('error loading sample', err)
      })

      if(sample) {
        this.sample = sample
      }

    } else {
      this.log('cannot instantiate outside of browser')

      this._trimEndMs = 0
    }
  }

  // Event API
  addEventListener(eventName: VibeShiftEvent, fn: VibeShiftListener) {
    this.listeners[eventName].push(fn)
  }

  removeEventListener(eventName: VibeShiftEvent, fn: VibeShiftListener) {
    this.listeners[eventName] = this.listeners[eventName].filter(l => l !== fn)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private dispatch(event: VibeShiftEvent, payload: any) {
    this.listeners[event].forEach(fn => fn(payload))
  }

  /** Load the SoundTouch worklet once. Call automatically from play(). */
  private async ensureWorklet(): Promise<void> {
    if (!this.ctx) {
      console.warn('VibeShifterAudio: cannot load worklet outside of browser'); return
    }
    if (this.workletReady) return

    await this.ctx.audioWorklet.addModule('/js/soundtouch-worklet.js')

    this.stNode = new AudioWorkletNode(this.ctx, 'soundtouch-processor')

    this.workletReady = true
  }

  /** Decode the sample once after constructing. */
  async loadSample(): Promise<void> {
    if (!this.ctx) {
      console.warn('VibeShifterAudio: cannot load sample outside of browser'); return
    }
    if(!this.sample) {
      console.warn('VibeShifterAudio: no sample to load'); return
    }
    console.log('loading sample', this.sample.public_url)
    const res = await fetch(this.sample.public_url)
    const arrBuf = await res.arrayBuffer()
    this.buffer = await this.ctx.decodeAudioData(arrBuf)
    this._trimEndMs = this.buffer.duration * 1000
    this.dispatch('loaded', {})
  }

  /** Play a MIDI note (60 = C4). */
  async play(note: string): Promise<void> {
    const TIMESTAMP_start = performance.now()

    if (!this.ctx) {
      console.warn('VibeShifterAudio: cannot play note outside of browser'); return
    }
    if (!this.buffer) {
      console.warn('Sample not loaded'); return
    }
    if (!this.stNode) {
      console.warn('SoundTouch worklet not ready'); return
    }
    if(!this.workletReady) {
      console.warn('SoundTouch worklet not ready'); return
    }
    if(!this.sample) {
      console.warn('VibeShifterAudio: no sample to play'); return
    }

    const TIMESTAMP_checks = performance.now()

    const midi = noteNameToMidi(note)

    const TIMESTAMP_midiChecks = performance.now()

    // 1. Buffer source
    const src = this.ctx.createBufferSource()

    const TIMESTAMP_buffer = performance.now()
    src.buffer = this.buffer

    const diff = midi - this.sample.root_midi
    const ratio = semitonesToRatio(diff)

    const TIMESTAMP_ratio = performance.now()

    this.stNode.parameters.get('pitch')!.setValueAtTime(ratio, this.ctx.currentTime)
    this.stNode.parameters.get('tempo')!.value = 1.0  // keep original tempo
    this.stNode.parameters.get('rate')!.value = 1.0

    const TIMESTAMP_stNode = performance.now()

    // 3. Wire & start
    
    src.connect(this.stNode).connect(this.ctx.destination)
    
    const TIMESTAMP_connect = performance.now()
    
    const startOffset = (this._trimStartMs ?? 0) / 1000
    
    src.start(this.ctx.currentTime, startOffset, this.trimmedDuration)
    this.startTime = this.ctx.currentTime

    const TIMESTAMP_startTime = performance.now()

    const TIMESTAMP_end = performance.now()

    this.log("--------------------------------")
    this.log(`play took ${TIMESTAMP_end - TIMESTAMP_start}ms`)

    this.log(`checks took ${TIMESTAMP_checks - TIMESTAMP_start}ms`)
    this.log(`midi took ${TIMESTAMP_midiChecks - TIMESTAMP_checks}ms`)
    this.log(`buffer took ${TIMESTAMP_buffer - TIMESTAMP_midiChecks}ms`)
    this.log(`ratio took ${TIMESTAMP_ratio - TIMESTAMP_buffer}ms`)
    this.log(`stNode took ${TIMESTAMP_stNode - TIMESTAMP_ratio}ms`)
    this.log(`connect took ${TIMESTAMP_connect - TIMESTAMP_stNode}ms`)
    this.log(`startTime took ${TIMESTAMP_startTime - TIMESTAMP_connect}ms`)


    this.dispatch('play', { note, startTime: this.startTime + startOffset })
  }

  get trimmedDuration(): number {
    if(this.buffer) {
      return Math.max(0, (this._trimEndMs ?? 0) / 1000 - (this._trimStartMs ?? 0) / 1000)
    }
    return 0
  }

  get duration(): number {
    if(this.buffer) {
      return Math.max(0, this.buffer.duration)
    }
    return 0
  }

  get trimStartMs(): number {
    return this._trimStartMs ?? 0
  }

  get trimEndMs(): number {
    return this._trimEndMs ?? (this.buffer?.duration ?? 0) * 1000
  }

  set trimStartMs(value: number) {
    this._trimStartMs = value
  }

  set trimEndMs(value: number) {
    this._trimEndMs = value
  }

  log(message: string) {
    if(this.options.debug) {
      console.log(`VibeShifterAudio: ${message}`)
    }
  }
}
