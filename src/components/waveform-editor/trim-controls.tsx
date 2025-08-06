'use client'

import RangeSlider from 'react-range-slider-input';
import 'react-range-slider-input/dist/style.css';
import './trim-controls.css';

type Props = {
  duration: number
  startMs: number
  endMs: number
  setTrim: ({trimStartMs, trimEndMs}: {trimStartMs: number, trimEndMs: number}) => void
  width: number
}

export function TrimControls({ duration, startMs, endMs, setTrim, width }: Props) {

  return (
    <div className="h-6" style={{ width: `${width}px` }}>
      <RangeSlider
        id="range-slider"
        min={0}
        max={duration * 1000}
        step={1}
        value={[startMs, endMs]}
        onInput={([start, end]) => {
          setTrim({trimStartMs: start, trimEndMs: end})
        }}
        className="w-full"
      />
    </div>
  )
}
