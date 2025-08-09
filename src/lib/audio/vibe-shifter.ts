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

export type VibeShiftEvent = 'play' | 'loaded' | 'notesChanged' | 'trimChanged' | 'sampleLoadingProgress'
type VibeShiftPlayListener = (payload: { note: string; startTime: number }) => void
type VibeShiftLoadedListener = (payload: {
  sampleId: string;
  bufferDuration: number;
  bufferLength: number;
  sampleRate: number;
  numberOfChannels: number;
}) => void
type VibeShiftNotesChangedListener = (payload: {notes: string[]}) => void
type VibeShiftTrimChangedListener = (payload: {trimStartMs: number, trimEndMs: number}) => void
type VibeShiftSampleLoadingProgressListener = (payload: {progress: number}) => void

type VibeShiftListener = VibeShiftPlayListener | VibeShiftLoadedListener | VibeShiftNotesChangedListener | VibeShiftTrimChangedListener | VibeShiftSampleLoadingProgressListener

const DEFAULT_OPTIONS = {
  debug: false
}

export class VibeShifterAudio {
  public ctx: AudioContext | null = null
  public buffer: AudioBuffer | null = null
  public startTime: number | null = null
  public sample: Sample | undefined = undefined
  
  private inBrowser = typeof window !== 'undefined'
  private workletReady = false
  private stNode: AudioWorkletNode | null = null

  private listeners: Record<VibeShiftEvent, VibeShiftListener[]> = {
    play: [],
    loaded: [],
    notesChanged: [],
    trimChanged: [],
    sampleLoadingProgress: []
  }

  private _currentlyLoadingSampleId: string | null = null
  private _trimStartMs: number | null = null
  private _trimEndMs: number | null = null
  public nowPlayingNotes:string[] = []

  constructor(
    sample: Sample | null = null,
    private options: typeof DEFAULT_OPTIONS = DEFAULT_OPTIONS
  ) {
    if (this.inBrowser) {
      this.log('constructor() :: initializing')
      this.ctx = new AudioContext()
      
      this.buffer = new AudioBuffer({
        length: 1,
        sampleRate: 44100,
        numberOfChannels: 2
      })
      
      // Set the sample first if provided
      if(sample) {
        this.log('constructor() :: has sample')
        this.sample = sample
        this._trimStartMs = sample.trim_start ?? null
        this._trimEndMs = sample.trim_end ?? null
        this.log('constructor() :: sample', this.sample)
      }
      
      // Then load the worklet and sample
      this.ensureWorklet().then(() => {
        this.log('worklet ready')
        return this.loadSample()
      })
      .then(() => {
        this.log('sample loaded')
      })
      .catch((err) => {
        console.error('error loading sample', err)
      })

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
    this.log(`dispatching ${event} with payload ${JSON.stringify(payload)}`)
    this.listeners[event].forEach(fn => fn(payload))
  }

  /** Load the SoundTouch worklet once. Call automatically from play(). */
  private async ensureWorklet(): Promise<void> {
    if (!this.ctx) {
      console.warn('ensureWorklet() :: cannot load worklet outside of browser'); return
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
    if(this._currentlyLoadingSampleId === this.sample.id) return

    this._currentlyLoadingSampleId = this.sample.id

    try {
      this.log('loadSample() :: loading sample', this.sample.public_url)

      this.dispatch('sampleLoadingProgress', {progress: 0})

      const res = await fetch(this.sample.public_url)
      // get byte length from res headers
      const byteLength = parseInt(res.headers.get('content-length') ?? '0', 10)
      const arrBuf = new Uint8Array(byteLength)
      const reader = res.body?.getReader();
      let offset = 0

      while (true) {
        const {value, done} = await reader?.read() ?? {value: null, done: false};
        if(value) {
          arrBuf.set(value, offset)
          offset += value.length
          this.dispatch('sampleLoadingProgress', {progress: offset / byteLength})
        }

        if (done) break;
      }
      
      if (!res.ok) {
        throw new Error(`Failed to fetch sample: ${res.status} ${res.statusText}`)
      }
      
      this.buffer = await this.ctx.decodeAudioData(arrBuf.buffer)
      
      // Validate that the buffer was created successfully
      if (!this.buffer || this.buffer.length === 0) {
        throw new Error('Failed to decode audio data - buffer is empty or null')
      }
      
      this.log(`loadSample() :: Sample loaded successfully. Buffer duration: ${this.buffer.duration}s, length: ${this.buffer.length} samples`)

      // Ensure trim bounds and duration are initialized even if server did not provide duration
      const fallbackDurationMs = Math.round(this.buffer.duration * 1000)
      const startMs = this.sample.trim_start ?? 0
      const endMs = this.sample.trim_end ?? (this.sample.duration ?? fallbackDurationMs)

      this._trimStartMs = startMs
      this._trimEndMs = endMs

      // Update in-memory sample duration for downstream consumers
      this.sample = { ...this.sample, duration: (this.sample.duration ?? fallbackDurationMs) } as Sample

      this._currentlyLoadingSampleId = null

      // Notify trim listeners with initialized values so UI reflects correct region
      this.dispatch('trimChanged', { trimStartMs: this.trimStartMs, trimEndMs: this.trimEndMs })

      this.dispatch('loaded', {
        sampleId: this.sample.id,
        bufferDuration: this.buffer.duration,
        bufferLength: this.buffer.length,
        sampleRate: this.buffer.sampleRate,
        numberOfChannels: this.buffer.numberOfChannels
      })
    } catch (error) {
      console.error('Error loading sample:', error)
      this.buffer = null
      this._currentlyLoadingSampleId = null
      throw error
    }
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

    this.nowPlayingNotes.push(note)
    this.dispatch('notesChanged', {notes: this.nowPlayingNotes})

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

    src.addEventListener('ended', () => {
      this.nowPlayingNotes = this.nowPlayingNotes.filter(n => n !== note)
      this.dispatch('notesChanged', {notes: this.nowPlayingNotes})
    })
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
    return this._trimEndMs ?? this.sample?.duration ?? 0
  }

  set trimStartMs(value: number) {
    this._trimStartMs = value
    this.dispatch('trimChanged', { trimStartMs: this.trimStartMs, trimEndMs: this.trimEndMs })
  }

  set trimEndMs(value: number) {
    this._trimEndMs = value
    this.dispatch('trimChanged', { trimStartMs: this.trimStartMs, trimEndMs: this.trimEndMs })
  }

  /** Atomically set both trim start and end (ms) and dispatch a single event. */
  setTrimMs(startMs: number, endMs: number) {
    this._trimStartMs = startMs
    this._trimEndMs = endMs
    this.dispatch('trimChanged', { trimStartMs: this.trimStartMs, trimEndMs: this.trimEndMs })
  }

  get isPlaying(): boolean {
    return this.nowPlayingNotes.length > 0
  }

  get bufferInfo(): { duration: number; length: number; sampleRate: number; numberOfChannels: number } | null {
    if (!this.buffer) return null
    
    return {
      duration: this.buffer.duration,
      length: this.buffer.length,
      sampleRate: this.buffer.sampleRate,
      numberOfChannels: this.buffer.numberOfChannels
    }
  }

  log(...args: unknown[]) {
    if(this.options.debug) {
      console.log(`VibeShifterAudio :: `, ...args)
    }
  }
}
