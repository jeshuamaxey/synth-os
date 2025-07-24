"use client"

import KeyBoard from "@/components/keyboard";
import WaveformEditor from "../waveform-editor";
import { VibeShifterAudio } from "@/lib/audio/vibe-shifter";
import { Sample } from "@/types/supabase";
import styles from "./vibe-shifter-console.module.css";
import { useEffect, useRef, useState } from "react";
import { useSampleMutation } from "@/hooks/useSamples";

const notes = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5']

const PanelLight = ({ color, onClick }: { color: 'red' | 'yellow' | 'green', onClick: () => void }) => {
  const panelClass = `
    rounded-full w-[10px] h-[10px] shadow-[0_0_5px_#000000A0]
  `

  const panelLightRed = `
    bg-[#ff4444] shadow-[0_0_8px_#ff4444]
  `
  const panelLightYellow = `
    bg-[#ffdd44] shadow-[0_0_8px_#ffdd44]
  `
  const panelLightGreen = `
    bg-[#44ff44] shadow-[0_0_8px_#44ff44]
  `

  const lightClass = {
    red: panelLightRed,
    yellow: panelLightYellow,
    green: panelLightGreen
  }

  return (
    <div className={`${panelClass} ${lightClass[color]}`} onClick={onClick}></div>
  )
}

// Panel component with header, lights, and collapse/expand logic
const Panel = ({ header, children }: { header: string, children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex-1 max-w-none w-full h-full md:flex-none md:h-1/2 md:w-1/2">
      <div style={{ height: collapsed ? 'auto' : '100%', width: '100%' }}>
        <div className={`
          flex items-center justify-between cursor-pointer
          border-b border-[#222] shadow
          font-bold
          bg-gradient-to-r from-[#333] to-[#555] text-[#ccc] px-4 py-2
          `}>
          <div className="flex gap-2">
            <PanelLight color="red" onClick={() => {console.log('expanding'); setCollapsed(false)}} />
            <PanelLight color="yellow" onClick={() => {console.log('expanding'); setCollapsed(false)}} />
            <PanelLight color="green" onClick={() => {console.log('collapsing'); setCollapsed(true)}} />
          </div>
          <div className="flex-1 text-right font-bold text-[#ccc] drop-shadow-lg tracking-wide">{header}</div>
        </div>
        {!collapsed && <div className="p-3 border-3 border-t-0 border-[#333]">{children}</div>}
      </div>
    </div>
  );
};

const PanelGrid = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col md:flex-row w-full relative max-w-none bg-gradient-to-br from-[#2a2a2a] to-[#1e1e1e]">
      {children}
    </div>
  )
}

const VibeShifter = ({ sample }: { sample: Sample | null }) => {
  const vibeShifterAudioRef = useRef<VibeShifterAudio | null>(null);

  const { mutate: updateSample } = useSampleMutation();

  const update = () => {
    if (!vibeShifterAudio || !vibeShifterAudio.sample) return;
    console.log('saving sample', vibeShifterAudio.sample)
    updateSample({ id: vibeShifterAudio.sample.id, trimStart: vibeShifterAudio.trimStartMs, trimEnd: vibeShifterAudio.trimEndMs });
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
        <Panel header="WAVEFORM ANALYZER">
          <div className={styles.waveformDisplay}>
            <div className={styles.waveformGrid}></div>
            {/* Flat line or no signal */}
            <div style={{position: 'absolute', width: '100%', top: '50%', left: 0, textAlign: 'center', color: '#333', fontSize: 18, letterSpacing: 2}}>NO SIGNAL</div>
          </div>
          <div className={styles.statusIndicators}>
            <div><span className={`${styles.statusLight} ${styles.statusLightInactive}`}></span>SAMPLE LOADED</div>
            <div><span className={`${styles.statusLight} ${styles.statusLightInactive}`}></span>READY</div>
          </div>
        </Panel>
        <Panel header="KEYBOARD CONTROLLER">
          <div className={styles.keyboard}>
            <KeyBoard notes={notes} onPress={() => {}} />
          </div>
          <div className={styles.statusIndicators}>
            <div>OCTAVE: 4</div>
            <div>VELOCITY: --</div>
            <div><span className={`${styles.statusLight} ${styles.statusLightInactive}`}></span>PLAYING</div>
          </div>
        </Panel>
      </PanelGrid>
    )
  }
  
  return (
    <PanelGrid>
      <Panel header="WAVEFORM ANALYZER">
        <div className={styles.waveformDisplay}>
          <div className={styles.waveformGrid}></div>
          {/* WaveformEditor renders the waveform */}
          {vibeShifterAudio && <WaveformEditor vibeShifterAudio={vibeShifterAudio} />}
        </div>
        <div className={styles.statusIndicators}>
          <div><span className={`${styles.statusLight} ${styles.statusLightActive}`}></span>SAMPLE LOADED</div>
          <div className={styles.controlButton} onClick={() => vibeShifterAudio.play('C4')}>PREVIEW</div>
          <div className={styles.controlButton} onClick={() => update()}>SAVE</div>
        </div>
      </Panel>
      <Panel header="KEYBOARD CONTROLLER">
        <div className={styles.keyboard}>
          {vibeShifterAudio && <KeyBoard notes={notes} onPress={note => vibeShifterAudio.play(note)} />}
        </div>
        <div className={styles.statusIndicators}>
          <div>OCTAVE: 4</div>
          <div>VELOCITY: 80%</div>
          <div><span className={`${styles.statusLight} ${styles.statusLightActive}`}></span>PLAYING</div>
        </div>
      </Panel>
    </PanelGrid>
  )
}

export default VibeShifter;
