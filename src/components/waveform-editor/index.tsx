'use client'

import { useState, useEffect, useRef } from 'react'
import { VibeShifterAudio } from "@/lib/audio/vibe-shifter"
import Waveform from "./waveform"
import { TrimControls } from "./trim-controls"
import { useTrimState } from '@/hooks/useVibeShifterState'

const WaveformEditor = ({ vibeShifterAudio, waveformHeight = 100 }: { vibeShifterAudio: VibeShifterAudio, waveformHeight?: number }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const [trimState, setTrimState] = useTrimState()
  const [duration, setDuration] = useState(0)
  const [trimmedDuration, setTrimmedDuration] = useState(0)
  const [width, setWidth] = useState(300)

  useEffect(() => {
    setWidth(containerRef.current?.clientWidth ?? 300)
  }, [])

  useEffect(() => {
    vibeShifterAudio.addEventListener('loaded', () => {
      setDuration(vibeShifterAudio.duration ?? 0)
    })
  }, [vibeShifterAudio])

  useEffect(() => {
    setTrimmedDuration(vibeShifterAudio.trimmedDuration)
  }, [vibeShifterAudio.trimmedDuration])

  const effectiveStartMs = trimState?.trimStartMs ?? 0
  const effectiveEndMs = trimState?.trimEndMs ?? (Math.round((vibeShifterAudio.duration ?? 0) * 1000))

  return <div>
    <div className="px-2" ref={containerRef}>
      <div className="relative">
        <Waveform vibeShifterAudio={vibeShifterAudio} width={width} height={waveformHeight} />
        <div className="flex flex-col items-end absolute top-0 left-0 w-full p-1">
          {trimmedDuration !== 0 && <div className="text-xs text-slate-500">Trimmed Duration: {trimmedDuration.toFixed(2)}s</div>}
          {duration !== 0 && <div className="text-xs text-slate-500">Duration: {duration.toFixed(2)}s</div>}
          {trimmedDuration !== 0 && duration !== 0 && <div className="text-xs text-slate-500">Trimmed Duration: {((trimmedDuration / duration) * 100).toFixed(2)}%</div>}
        </div>
      </div>
    </div>
    <TrimControls
      duration={duration}
      startMs={effectiveStartMs}
      endMs={effectiveEndMs}
      setTrim={trimState => setTrimState(trimState)}
      width={width}
      />
  </div>
}

export default WaveformEditor
