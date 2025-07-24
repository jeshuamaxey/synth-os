"use client"

import { VibeShifterAudio } from "@/lib/audio/vibe-shifter";

const ButtonGrid = ({ vibeShifterAudio }: { vibeShifterAudio: VibeShifterAudio }) => {
  const buttons = [
    {
      label: '1',
      value: 1
    },
    {
      label: '2',
      value: 2
    },
    {
      label: '3',
      value: 3
    },
    {
      label: '4',
      value: 4
    }
  ]

  return <div className="grid grid-cols-4 gap-4">
      {buttons.map((button) => (
        <button className="border border-slate-300 p-2 rounded-sm col-span-1 aspect-square" key={button.label} >
          <span>{button.label}</span>
        </button>
      ))}
  </div>
}

export default ButtonGrid;