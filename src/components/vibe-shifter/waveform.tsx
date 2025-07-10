import { VibeShifterAudio } from "@/lib/audio/vibe-shifter";
import { useEffect, useRef, useState } from "react";

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

const Waveform = ({ vibeShifterAudio }: { vibeShifterAudio: VibeShifterAudio }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const waveformRef = useRef<number[] | null>(null)
  const [waveformReady, setWaveformReady] = useState(false)
  const [, setStartTime] = useState<number | null>(null)

  useEffect(() => {
    vibeShifterAudio.loadSample().then(() => {
      setWaveformReady(true)
    })
  }, [])

  // Extract and cache waveform data
  useEffect(() => {
    if (!vibeShifterAudio.buffer || !waveformReady) {
      return
    }

    const waveform = getWaveformData(vibeShifterAudio.buffer)

    waveformRef.current = waveform
    drawWaveform()
  }, [vibeShifterAudio.buffer, waveformReady])

  useEffect(() => {
    const handlePlay = (_event: 'play', { startTime }: { startTime: number }) => {
      setStartTime(startTime)
    }
  
    vibeShifterAudio.addEventListener(handlePlay)
    return () => {
      vibeShifterAudio.removeEventListener(handlePlay)
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
      const percent = Math.min(elapsed / (vibeShifterAudio.duration * 1000), 1)

      drawWaveform(percent)
      if (percent < 1) frameId = requestAnimationFrame(draw)
    }

    draw()

    return () => cancelAnimationFrame(frameId)
  }, [vibeShifterAudio.buffer, vibeShifterAudio.ctx, vibeShifterAudio.duration, vibeShifterAudio.startTime])

  function drawWaveform(playheadPercent: number = 0) {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const waveform = waveformRef.current

    if (!ctx || !canvas || !waveform) {
      return
    }

    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    const barWidth = width / waveform.length

    // Draw waveform
    waveform.forEach((value, i) => {
      const x = i * barWidth
      const y = value * height
      ctx.fillStyle = '#ccc'
      ctx.fillRect(x, height - y, barWidth, y)
    })

    // Draw playhead
    const playheadX = width * playheadPercent
    ctx.strokeStyle = 'red'
    ctx.beginPath()
    ctx.moveTo(playheadX, 0)
    ctx.lineTo(playheadX, height)
    ctx.stroke()
  }

  return     <canvas ref={canvasRef} width={300} height={80} className="border border-slate-300" />
    
}

export default Waveform;