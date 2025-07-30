"use client"

import KeyBoard from "@/components/keyboard";
import WaveformEditor from "../waveform-editor";
import { VibeShifterAudio } from "@/lib/audio/vibe-shifter";
import { Sample } from "@/types/supabase";
import styles from "./vibe-shifter-console.module.css";
import { useEffect, useRef } from "react";
import { useSampleMutation } from "@/hooks/useSamples";
import { Panel, PanelGrid } from "@/components/panel";
import WaveformGrid from "../waveform-editor/waveform-grid";
import StatusIndicator from "../status-indicator";
import ControlButton from "../control-button";
import EllipsisSpinner from "../ellipsis-spinner";

const notes = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5']

const VibeShifter = ({ sample }: { sample: Sample | null }) => {
  const vibeShifterAudioRef = useRef<VibeShifterAudio | null>(null);

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
        <div className="bg-[#111] border-2 border-[#333] rounded relative overflow-hidden mb-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <WaveformGrid />
            <div style={{position: 'absolute', width: '100%', top: '50%', left: 0, textAlign: 'center', color: '#333', fontSize: 18, letterSpacing: 2}}>NO SIGNAL</div>
          </div>
          <div className="flex justify-between items-center mt-4 text-sm">
            <StatusIndicator status="none" label="sample loaded" />
            <StatusIndicator status="none" label="ready" />
          </div>
        </Panel>
        <Panel className="basis-1/3" header="KEYBOARD CONTROLLER">
          <div className={styles.keyboard}>
            <KeyBoard notes={notes} onPress={() => {}} />
          </div>
          <div className="flex justify-between items-center mt-4 text-sm">
            <div>OCTAVE: 4</div>
            <div>VELOCITY: --</div>
            <StatusIndicator status="none" label="playing" />
          </div>
        </Panel>
      </PanelGrid>
    )
  }
  
  return (
    <PanelGrid>
      <Panel className="basis-1/3" header="WAVEFORM ANALYZER">
        <div className="bg-[#111] border-2 border-[#333] rounded relative overflow-hidden mb-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
          <WaveformGrid />
          {vibeShifterAudio && <WaveformEditor vibeShifterAudio={vibeShifterAudio} />}
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
        <div className={styles.keyboard}>
          {vibeShifterAudio && <KeyBoard notes={notes} onPress={note => vibeShifterAudio.play(note)} />}
        </div>
        <div className="flex justify-between items-center mt-4 text-sm">
          <div>OCTAVE: 4</div>
          <div>VELOCITY: 80%</div>
          <StatusIndicator status={vibeShifterAudio.isPlaying ? 'ok' : 'none'} label="playing" />
        </div>
      </Panel>
    </PanelGrid>
  )
}

export default VibeShifter;
