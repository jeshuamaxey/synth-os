'use client'

import { useState, useEffect } from 'react'
import { VibeShifterAudio } from "@/lib/audio/vibe-shifter"
import Waveform from "./waveform"
import { TrimControls } from "./trim-controls"

const WaveformEditor = ({ vibeShifterAudio }: { vibeShifterAudio: VibeShifterAudio }) => {
  const [startMs, setStartMs] = useState(vibeShifterAudio.trimStartMs)
  const [endMs, setEndMs] = useState(vibeShifterAudio.trimEndMs)
  const [duration, setDuration] = useState(0)
  const [trimmedDuration, setTrimmedDuration] = useState(0)

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

  return <div className="p-2">
    <Waveform vibeShifterAudio={vibeShifterAudio} />

    <div className="flex flex-row justify-between">
      {trimmedDuration !== 0 && <div className="text-xs text-slate-500">Trimmed Duration: {trimmedDuration.toFixed(2)}s</div>}
      {duration !== 0 && <div className="text-xs text-slate-500">Duration: {duration.toFixed(2)}s</div>}
    </div>
    <TrimControls duration={duration} startMs={startMs} endMs={endMs} setStartMs={setStartMs} setEndMs={setEndMs} />
  </div>
}

export default WaveformEditor