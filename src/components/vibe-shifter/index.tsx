"use client"

import KeyBoard from "@/components/keyboard";
import WaveformEditor from "../waveform-editor";
import { VibeShifterAudio } from "@/lib/audio/vibe-shifter";
import { Sample } from "@/types/supabase";
import styles from "./vibe-shifter-console.module.css";
import { useEffect, useRef } from "react";
import { useSampleMutation } from "@/hooks/useSamples";

const notes = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5']

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
      <div className={styles.instrumentSection}>
        <div className={styles.waveformPanel}>
          <div className={styles.panelHeader}>WAVEFORM ANALYZER</div>
          <div className={styles.waveformDisplay}>
            <div className={styles.waveformGrid}></div>
            {/* Flat line or no signal */}
            <div style={{position: 'absolute', width: '100%', top: '50%', left: 0, textAlign: 'center', color: '#333', fontSize: 18, letterSpacing: 2}}>NO SIGNAL</div>
          </div>
          <div className={styles.statusIndicators}>
            <div><span className={`${styles.statusLight} ${styles.statusLightInactive}`}></span>SAMPLE LOADED</div>
            <div><span className={`${styles.statusLight} ${styles.statusLightInactive}`}></span>READY</div>
          </div>
        </div>
        <div className={styles.keyboardPanel}>
          <div className={styles.panelHeader}>KEYBOARD CONTROLLER</div>
          <div className={styles.keyboard}>
            <KeyBoard notes={notes} onPress={() => {}} />
          </div>
          <div className={styles.statusIndicators}>
            <div>OCTAVE: 4</div>
            <div>VELOCITY: --</div>
            <div><span className={`${styles.statusLight} ${styles.statusLightInactive}`}></span>PLAYING</div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className={styles.instrumentSection}>
      <div className={styles.waveformPanel}>
        <div className={styles.panelHeader}>WAVEFORM ANALYZER</div>
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
      </div>
      <div className={styles.keyboardPanel}>
        <div className={styles.panelHeader}>KEYBOARD CONTROLLER</div>
        <div className={styles.keyboard}>
          {vibeShifterAudio && <KeyBoard notes={notes} onPress={note => vibeShifterAudio.play(note)} />}
        </div>
        <div className={styles.statusIndicators}>
          <div>OCTAVE: 4</div>
          <div>VELOCITY: 80%</div>
          <div><span className={`${styles.statusLight} ${styles.statusLightActive}`}></span>PLAYING</div>
        </div>
      </div>
    </div>
  )
}

export default VibeShifter;
