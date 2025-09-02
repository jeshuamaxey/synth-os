"use client"

import KeyBoard from "@/components/keyboard";
import WaveformEditor from "../waveform-editor";
import { useSampleMutation } from "@/hooks/useSamples";
import { Panel, PanelGrid } from "@/components/panel";
import WaveformGrid from "../waveform-editor/waveform-grid";
import StatusIndicator from "../status-indicator";
import ControlButton from "../control-button";
import EllipsisSpinner from "../ellipsis-spinner";
import { useVibeShifter } from "@/providers/vibe-shifter-provider";
import { useIsPlaying } from "@/hooks/useVibeShifterState";

const notes = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5']

type VibeShifterProps = {
  booting: boolean
  keyboardControlsEnabled: boolean
  setKeyboardControlsEnabled: (enabled: boolean) => void
}

const VibeShifter = ({ booting, keyboardControlsEnabled, setKeyboardControlsEnabled }: VibeShifterProps) => {
  const { engine: vibeShifterAudio } = useVibeShifter();
  const isPlaying = useIsPlaying();
  const waveformHeight = 100

  const sampleMutation = useSampleMutation({});

  const update = () => {
    if (!vibeShifterAudio || !vibeShifterAudio.sample) return;

    sampleMutation.mutate({
      id: vibeShifterAudio.sample.id,
      trimStart: vibeShifterAudio.trimStartMs,
      trimEnd: vibeShifterAudio.trimEndMs,
    });
  }
  
  return (
    <PanelGrid>
      <Panel className="basis-1/3" header="WAVEFORM ANALYZER">
        <div className="flex justify-between my-4 h-32 bg-[#111] border-3 rounded-lg border-[#333] relative overflow-hidden mb-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
          <WaveformGrid />
          <WaveformEditor vibeShifterAudio={vibeShifterAudio} waveformHeight={waveformHeight} />
        </div>
        <div className="flex justify-between items-center mt-4 text-sm">
          <StatusIndicator status={vibeShifterAudio?.sample?.id ? 'ok' : 'none'} label={vibeShifterAudio?.sample?.id ? 'sample loaded' : 'no sample'} />
          
          {vibeShifterAudio?.sample?.id && (
            <div className="flex gap-2 items-center justify-end">  
              <ControlButton onClick={() => vibeShifterAudio.play('C4')}>PREVIEW</ControlButton>
              <ControlButton onClick={() => update()}>
                {sampleMutation.isPending ? <EllipsisSpinner /> : 'SAVE'}
              </ControlButton>
            </div>
          )}
        </div>
      </Panel>
      <Panel className="basis-1/3" header="KEYBOARD CONTROLLER">
      <div className="flex justify-between my-4 h-32 bg-[#111] border-3 rounded-lg border-[#333] relative overflow-hidden mb-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
          <WaveformGrid />
          <KeyBoard
            notes={notes}
            onPress={note => vibeShifterAudio?.play(note)}
            enabled={!booting && !!vibeShifterAudio?.sample?.id}
            keyPressEnabled={!booting && keyboardControlsEnabled} />
        </div>
        <div className="flex justify-between items-center mt-4 text-sm">
          <StatusIndicator onClick={() => setKeyboardControlsEnabled(!keyboardControlsEnabled)} status={!booting && keyboardControlsEnabled ? 'ok' : 'error'} label={!booting && keyboardControlsEnabled ? 'keys enabled' : 'keys disabled'} />
          <StatusIndicator status={isPlaying ? 'ok' : 'none'} label="playing" />
        </div>
      </Panel>
    </PanelGrid>
  )
}

export default VibeShifter;
