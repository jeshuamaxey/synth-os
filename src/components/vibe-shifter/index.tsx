"use client"

import { VibeShifterAudio } from "@/lib/audio/vibe-shifter";
import KeyBoard from "@/components/keyboard";
import WaveformEditor from "../waveform-editor";
import { useState } from "react";
import ButtonGrid from "../button-grid";
import SampleGenerator from "../sample-generator";
import { Sample } from "@/types";

const samples: Sample[] = [{
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
  const [sample, setSample] = useState<Sample>(samples[0])
  const vibeShifterAudio = new VibeShifterAudio(sample.url, sample.rootMidi, {
    debug: false
  })

  vibeShifterAudio.loadSample()

  const notes = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5']

  return <div className="flex flex-col gap-4 w-full">
    <div className="flex gap-2">
      {samples.map((s) => (
        <button className={`border border-slate-300 p-2 rounded-sm ${s.name === sample.name ? 'bg-slate-300' : ''}`} key={s.name} onClick={() => setSample(s)}>{s.name}</button>
      ))}
    </div>
    <div className="flex border border-slate-100 p-4 rounded-sm gap-4">
      <div className="flex flex-col gap-4">
        <ButtonGrid vibeShifterAudio={vibeShifterAudio} />
        <KeyBoard notes={notes} onPress={(note) => vibeShifterAudio.play(note)} />
      </div>

      <div className="p-1 bg-slate-100">
        <SampleGenerator onSampleChange={setSample} />
        <WaveformEditor vibeShifterAudio={vibeShifterAudio} />
      </div>
    </div>
  </div>
};

export default VibeShifter;
