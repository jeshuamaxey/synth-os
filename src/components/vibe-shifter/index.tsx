"use client"

import { VibeShifterAudio } from "@/lib/audio/vibe-shifter";
import KeyBoard from "@/components/keyboard";
import WaveformEditor from "../waveform-editor";
import { useState } from "react";

const samples = [{
  url: '/audio/gunshot.mp3',
  name: 'Gunshot',
  rootMidi: 60
}, {
  url: '/audio/ratty-bass.mp3',
  name: 'Ratty Bass',
  rootMidi: 60
}, {
  url: '/audio/space-click.mp3',
  name: 'Space Click',
  rootMidi: 60
}, {
  url: '/audio/horse.mp3',
  name: 'Horse',
  rootMidi: 60
}]

const VibeShifter = () => {
  const [sample, setSample] = useState(samples[0])
  const vibeShifterAudio = new VibeShifterAudio(sample.url, sample.rootMidi, {
    debug: false
  })

  vibeShifterAudio.loadSample()

  const notes = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5']

  return <div className="flex flex-col gap-4">
    <div className="flex gap-2">
      {samples.map((s) => (
        <button className={`border border-slate-300 p-2 rounded-sm ${s.name === sample.name ? 'bg-slate-300' : ''}`} key={s.name} onClick={() => setSample(s)}>{s.name}</button>
      ))}
    </div>
    <div className="flex border border-slate-300 p-4 rounded-sm">
      <KeyBoard notes={notes} onPress={(note) => vibeShifterAudio.play(note)} />
      <WaveformEditor vibeShifterAudio={vibeShifterAudio} />
    </div>
  </div>
};

export default VibeShifter;
