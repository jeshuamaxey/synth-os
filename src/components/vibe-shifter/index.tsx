"use client"

import KeyBoard from "@/components/keyboard";
import WaveformEditor from "../waveform-editor";
import { VibeShifterAudio } from "@/lib/audio/vibe-shifter";
import { Sample } from "@/types/supabase";
import { useEffect, useRef, useState } from "react";
import { useSampleMutation } from "@/hooks/useSamples";
import { Panel, PanelGrid } from "@/components/panel";
import WaveformGrid from "../waveform-editor/waveform-grid";
import StatusIndicator from "../status-indicator";
import ControlButton from "../control-button";
import EllipsisSpinner from "../ellipsis-spinner";

const notes = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5']

type VibeShifterProps = {
  sample: Sample | null
  keyboardControlsEnabled: boolean
  setKeyboardControlsEnabled: (enabled: boolean) => void
}

const VibeShifter = ({ sample, keyboardControlsEnabled, setKeyboardControlsEnabled }: VibeShifterProps) => {
  const vibeShifterAudioRef = useRef<VibeShifterAudio | null>(null);

  const waveformHeight = 100

  const [, setVibeShifterState] = useState<{
    nowPlayingNotes: string[]
  }>({
    nowPlayingNotes: []
  })

  const sampleMutation = useSampleMutation({});

  const update = () => {
    if (!vibeShifterAudio || !vibeShifterAudio.sample) return;

    sampleMutation.mutate({
      id: vibeShifterAudio.sample.id,
      trimStart: vibeShifterAudio.trimStartMs,
      trimEnd: vibeShifterAudio.trimEndMs,
    });
  }

  useEffect(() => {
    if (sample) {
      vibeShifterAudioRef.current = new VibeShifterAudio(sample, { debug: false });
      vibeShifterAudioRef.current.loadSample();

      vibeShifterAudioRef.current.addEventListener('notesChanged', (payload: {notes: string[]}) => {
        setVibeShifterState(prev => ({
          ...prev,
          nowPlayingNotes: payload.notes
        }))
      })
    } else {
      vibeShifterAudioRef.current = null;
    }
  }, [sample]);

  
  const vibeShifterAudio = vibeShifterAudioRef.current;
  
  // Inactive state
  if (!vibeShifterAudio || !vibeShifterAudio.sample) {
    return (
      <PanelGrid>
        <Panel className="basis-1/3" header="WAVEFORM ANALYZER">
        <div style={{height: waveformHeight}} className="flex justify-between my-4 h-32 bg-[#111] rounded-lg border-3 border-[#333] relative overflow-hidden mb-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <WaveformGrid />
            <div style={{position: 'absolute', width: '100%', top: '40%', left: 0, textAlign: 'center', color: '#333', fontSize: 18, letterSpacing: 2}}>NO SIGNAL</div>
          </div>
          <div className="flex justify-between items-center mt-4 text-sm">
            <StatusIndicator status="none" label="no sample" />
          </div>
        </Panel>
        <Panel className="basis-1/3" header="KEYBOARD CONTROLLER">
          <div className="flex justify-between my-4 h-32">
            <KeyBoard notes={notes} onPress={() => {}} enabled={false} />
          </div>
          <div className="flex justify-between items-center mt-4 text-sm">
            <StatusIndicator status="none" label="enabled" />
            <StatusIndicator status="none" label="playing" />
          </div>
        </Panel>
      </PanelGrid>
    )
  }
  
  return (
    <PanelGrid>
      <Panel className="basis-1/3" header="WAVEFORM ANALYZER">
        <div className="flex justify-between my-4 h-32 bg-[#111] border-3 rounded-lg border-[#333] relative overflow-hidden mb-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
          <WaveformGrid />
          {vibeShifterAudio && <WaveformEditor vibeShifterAudio={vibeShifterAudio} waveformHeight={waveformHeight} />}
        </div>
        <div className="flex justify-between items-center mt-4 text-sm">
          <StatusIndicator status="ok" label="sample loaded" />
          <div className="flex gap-2 items-center justify-end">  
            <ControlButton onClick={() => vibeShifterAudio.play('C4')}>PREVIEW</ControlButton>
            <ControlButton onClick={() => update()}>
              {sampleMutation.isPending ? <EllipsisSpinner /> : 'SAVE'}
            </ControlButton>
          </div>
        </div>
      </Panel>
      <Panel className="basis-1/3" header="KEYBOARD CONTROLLER">
        <div className="flex justify-between my-4 h-32">
          {vibeShifterAudio && <KeyBoard notes={notes} onPress={note => vibeShifterAudio.play(note)} enabled={keyboardControlsEnabled} />}
        </div>
        <div className="flex justify-between items-center mt-4 text-sm">
          <StatusIndicator onClick={() => setKeyboardControlsEnabled(!keyboardControlsEnabled)} status={keyboardControlsEnabled ? 'ok' : 'error'} label={keyboardControlsEnabled ? 'keys enabled' : 'keys disabled'} />
          <StatusIndicator status={vibeShifterAudio.isPlaying ? 'ok' : 'none'} label="playing" />
        </div>
      </Panel>
    </PanelGrid>
  )
}

export default VibeShifter;
