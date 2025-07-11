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
}

export function TrimControls({ duration, startMs, endMs, setStartMs, setEndMs }: Props) {

  return (
    <div className="space-y-4">
        <div className="flex flex-row justify-between">
          <label className="block text-xs font-medium mb-1">
            Trim Start: {startMs.toFixed(0)}ms
          </label>

          <label className="block text-xs font-medium mb-1">
            Trim End: {endMs.toFixed(0)}ms
          </label>
        </div>

        <RangeSlider
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
