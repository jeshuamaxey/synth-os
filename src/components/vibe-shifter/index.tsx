"use client"

import { VibeShifterAudio } from "@/lib/audio/vibe-shifter";
import KeyBoard from "@/components/keyboard";
import Waveform from "./waveform";

const VibeShifter = () => {
  const vibeShifterAudio = new VibeShifterAudio('/audio/space-click.mp3')

  vibeShifterAudio.loadSample()

  const notes = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5']

  return <div className="flex border border-slate-300 p-4 rounded-sm">
    <KeyBoard notes={notes} onPress={(note) => vibeShifterAudio.play(note)} />
    <Waveform vibeShifterAudio={vibeShifterAudio} />
  </div>
};

export default VibeShifter;
