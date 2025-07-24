'use client'

import RangeSlider from 'react-range-slider-input';
import 'react-range-slider-input/dist/style.css';
import './trim-controls.css';

type Props = {
  duration: number
  startMs: number
  endMs: number
  setStartMs: (startMs: number) => void
  setEndMs: (endMs: number) => void
  width: number
}

export function TrimControls({ duration, startMs, endMs, setStartMs, setEndMs, width }: Props) {

  return (
    <div className="h-6" style={{ width: `${width}px` }}>
      <RangeSlider
        id="range-slider"
        min={0}
        max={duration * 1000}
        step={1}
        value={[startMs, endMs]}
        onInput={([start, end]) => {
          setStartMs(start)
          setEndMs(end)
        }}
        className="w-full"
      />
    </div>
  )
}
