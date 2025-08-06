'use client'

import { useState, useEffect, useRef } from 'react'
import { VibeShifterAudio } from "@/lib/audio/vibe-shifter"
import Waveform from "./waveform"
import { TrimControls } from "./trim-controls"

const WaveformEditor = ({ vibeShifterAudio, waveformHeight = 100 }: { vibeShifterAudio: VibeShifterAudio, waveformHeight?: number }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const [startMs, setStartMs] = useState(vibeShifterAudio.trimStartMs)
  const [endMs, setEndMs] = useState(vibeShifterAudio.trimEndMs)
  const [duration, setDuration] = useState(0)
  const [trimmedDuration, setTrimmedDuration] = useState(0)
  const [width, setWidth] = useState(300)

  useEffect(() => {
    setWidth(containerRef.current?.clientWidth ?? 300)
  }, [])

  // Sync local state to the vibe instance
  useEffect(() => {
    vibeShifterAudio.trimStartMs = startMs
  }, [startMs, vibeShifterAudio])

  useEffect(() => {
    vibeShifterAudio.trimEndMs = endMs
  }, [endMs, vibeShifterAudio])

  useEffect(() => {
    vibeShifterAudio.addEventListener('loaded', () => {
      setStartMs(vibeShifterAudio.trimStartMs)
      setEndMs(vibeShifterAudio.trimEndMs)
      setDuration(vibeShifterAudio.duration ?? 0)
    })
  }, [vibeShifterAudio])

  useEffect(() => {
    setTrimmedDuration(vibeShifterAudio.trimmedDuration)
  }, [vibeShifterAudio.trimmedDuration])

  return <div>
    <div className="px-2" ref={containerRef}>
      <div className="relative">
        <Waveform vibeShifterAudio={vibeShifterAudio} width={width} height={waveformHeight} />
        <div className="flex flex-col items-end absolute top-0 left-0 w-full p-1">
          {trimmedDuration !== 0 && <div className="text-xs text-slate-500">Trimmed Duration: {trimmedDuration.toFixed(2)}s</div>}
          {duration !== 0 && <div className="text-xs text-slate-500">Duration: {duration.toFixed(2)}s</div>}
          {trimmedDuration !== 0 && <div className="text-xs text-slate-500">Trimmed Duration: {((trimmedDuration / duration) * 100).toFixed(2)}%</div>}
        </div>
      </div>
    </div>
    <TrimControls duration={duration} startMs={startMs} endMs={endMs} setStartMs={setStartMs} setEndMs={setEndMs} width={width} />
  </div>
}

export default WaveformEditor