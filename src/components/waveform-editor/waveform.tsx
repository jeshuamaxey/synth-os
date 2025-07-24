'use client'

import { VibeShifterAudio } from "@/lib/audio/vibe-shifter";
import { useCallback, useEffect, useRef, useState } from "react";

function getWaveformData(buffer: AudioBuffer, samples = 300): number[] {
  const raw = buffer.getChannelData(0) // mono for now
  const blockSize = Math.floor(raw.length / samples)
  const waveform = []

  for (let i = 0; i < samples; i++) {
    let sum = 0
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(raw[i * blockSize + j])
    }
    waveform.push(sum / blockSize)
  }

  return waveform
}

const Waveform = ({ vibeShifterAudio, width = 300, height = 80 }: { vibeShifterAudio: VibeShifterAudio, width?: number, height?: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const waveformRef = useRef<number[] | null>(null)
  const [waveformReady, setWaveformReady] = useState(false)
  const [, setStartTime] = useState<number | null>(null)

  useEffect(() => {
    vibeShifterAudio.loadSample().then(() => {
      setWaveformReady(true)
    })
  }, [vibeShifterAudio])

  const drawWaveform = useCallback((playheadPercent: number = 0) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const waveform = waveformRef.current

    
    if (!ctx || !canvas || !waveform) {
      return
    }
    const waveformMax = Math.max(...waveform) * 1.2
    const normalisedWaveform = waveform.map(v => v / waveformMax)

    ctx.clearRect(0, 0, width, height)

    // --- Trim maths --------------------------------------------
    const bufDurS    = vibeShifterAudio.duration
    const trimStartS = (vibeShifterAudio.trimStartMs ?? 0) / 1000
    const trimEndS   = (vibeShifterAudio.trimEndMs   ?? bufDurS * 1000) / 1000

    const keepStartRatio = trimStartS / bufDurS                // left offset
    const keepWidthRatio = (trimEndS - trimStartS) / bufDurS    // width of kept region
    //-------------------------------------------------------------


    const barWidth = width / waveform.length

    // Draw waveform
    normalisedWaveform.forEach((value, i) => {
      const x = i * barWidth
      const y = value * height

      // Compute time of this bar (0‑1)
      const barTime = (i / waveform.length) * bufDurS            // seconds of this bar
      const inTrimGap = barTime < trimStartS || barTime > trimEndS

      if (inTrimGap) {
        ctx.fillStyle = '#222';
        ctx.fillRect(x, height - y, barWidth, y);
      } else {
        ctx.save();
        ctx.shadowColor = '#00ff41';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#00ff41';
        ctx.fillRect(x, height - y, barWidth, y);
        ctx.restore();
      }
    })

    // Draw playhead
    const playheadX = width * (keepStartRatio + playheadPercent * keepWidthRatio)

    ctx.strokeStyle = '#ff4444'
    ctx.beginPath()
    ctx.moveTo(playheadX, 0)
    ctx.lineTo(playheadX, height)
    ctx.stroke()
  }, [width, height, vibeShifterAudio.duration, vibeShifterAudio.trimStartMs, vibeShifterAudio.trimEndMs])

  // Extract and cache waveform data
  useEffect(() => {
    if (!vibeShifterAudio.buffer || !waveformReady) {
      return
    }

    const waveform = getWaveformData(vibeShifterAudio.buffer)

    waveformRef.current = waveform
    drawWaveform()
  }, [drawWaveform, vibeShifterAudio.buffer, waveformReady])

  useEffect(() => {
    const handlePlay = ({ startTime }: { startTime: number }) => {
      setStartTime(startTime)
    }
  
    vibeShifterAudio.addEventListener('play', handlePlay)
    return () => {
      vibeShifterAudio.removeEventListener('play', handlePlay)
    }
  }, [vibeShifterAudio])

  // Animate playhead
  useEffect(() => {
    if (!vibeShifterAudio.startTime || !vibeShifterAudio.buffer) return

    const ctx = canvasRef.current?.getContext('2d')
    const waveform = waveformRef.current
    if (!ctx || !waveform) return

    let frameId: number

    const draw = () => {
      if (!vibeShifterAudio.buffer ||  !vibeShifterAudio.ctx || !vibeShifterAudio.startTime || !vibeShifterAudio.duration) return

      // const now = vibeShifterAudio.buffer.sampleRate ? vibeShifterAudio.buffer.sampleRate * (performance.now() / 1000) : 0
      const elapsed = (vibeShifterAudio.ctx.currentTime - vibeShifterAudio.startTime) * 1000
      const percent = Math.min(elapsed / (vibeShifterAudio.trimmedDuration * 1000), 1)

      drawWaveform(percent)
      if (percent < 1) frameId = requestAnimationFrame(draw)
    }

    draw()

    return () => cancelAnimationFrame(frameId)
  }, [vibeShifterAudio.buffer, vibeShifterAudio.ctx, vibeShifterAudio.duration, vibeShifterAudio.startTime, vibeShifterAudio.trimStartMs, vibeShifterAudio.trimEndMs, drawWaveform, vibeShifterAudio.trimmedDuration])

  return <canvas ref={canvasRef} width={width} height={height} className="" />
}

export default Waveform;