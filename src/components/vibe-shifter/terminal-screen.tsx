"use client"

import { sleep } from "@/lib/utils";
import { forwardRef, useEffect, useState } from "react";

interface TerminalScreenProps {
  booting: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  history: string[];
  inputRef: React.RefObject<HTMLInputElement | null>;
  bootLines: string[];
  isGenerating: boolean;
  generatingProgress: number;
  active: boolean;
  input: string;
  setInput: (input: string) => void;
  onBootComplete: (lines: string[]) => void;
}



// Boot sequence steps
const BOOT_TEXT = [
  "SYNTH-OS v2.1 BOOTING...",
  "[████████████████████████] 100%",
  "",
  "Initializing audio drivers... OK",
  "Loading sample banks... OK",
  "Calibrating oscillators... OK",
  "Connecting modular rack... OK",
  "",
  "SYSTEM READY",
  "Type 'help' for available commands",
];

const TerminalScreen = forwardRef<HTMLDivElement, TerminalScreenProps>(({
    onChange,
    onKeyDown,
    booting,
    history,
    inputRef,
    bootLines,
    isGenerating,
    generatingProgress,
    active,
    input,
    onBootComplete
  }, ref) => {

  const terminalText = `
    font-mono
    text-[oklch(0.8_0.25_142)] text-sm leading-[1.4]
    [text-shadow:0_0_2px_oklch(0.8_0.25_142),0_0_6px_oklch(0.8_0.25_142),0_0_12px_oklch(0.8_0.25_142)]
  `

  const terminalScreenClass = `
    bg-black
    border-3 border-[#333]
    rounded-lg
    p-4
    overflow-y-auto
    box-shadow-inset-0-0-30px-rgba(0,255,65,0.1)
    relative
    h-full
    ${terminalText}
  `

  const [bootTypingLines, setBootTypingLines] = useState<string[]>([]);
  const [bootTypingCurrentLine, setBootTypingCurrentLine] = useState<string>("");

  // Boot sequence
  useEffect(() => {
    (async () => {
      // Play boot-up sound
      // if (!bootAudioRef.current) {
      //   bootAudioRef.current = new Audio("/audio/boot-up.mp3");
      //   bootAudioRef.current.volume = 0.7;
      // }
      // bootAudioRef.current.currentTime = 0;
      // bootAudioRef.current.play();
      // setBootStage(0); // black
      await sleep(1200);
      // setBootStage(1); // crt flicker
      await sleep(800);
      // setBootStage(2); // boot text
      // Type out boot text
      const lines: string[] = [];
      for (let i = 0; i < BOOT_TEXT.length; i++) {
        const line = BOOT_TEXT[i];
        let typed = "";
        for (let j = 0; j < line.length; j++) {
          typed += line[j];
          setBootTypingLines([...lines]);
          setBootTypingCurrentLine(typed);
          await sleep(18 + Math.random() * 30);
        }
        lines.push(line);
        setBootTypingLines([...lines]);
        setBootTypingCurrentLine("");
        await sleep(120 + Math.random() * 100);
      }

      setBootTypingLines([]);
      setBootTypingCurrentLine("");
      onBootComplete([...lines])
    })();
  }, [onBootComplete]);

  // Focus input when terminal is active
  useEffect(() => {
    if (active && inputRef.current) {
      inputRef.current.focus();
    }
  }, [active, inputRef]);

  // Scroll terminal to bottom when output changes
  useEffect(() => {
    if (ref && 'current' in ref && ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [history, bootLines, isGenerating, ref]);

  return (
    <div
      className={terminalScreenClass}
      ref={ref}
      onClick={() => {
        if (inputRef.current) inputRef.current.focus();
      }}
    >
      {/* Boot text stays at the top, animate in during boot character by character */}
      {booting
        ? <>
            {bootTypingLines.map((line, i) => <div key={i}>{line}</div>)}
            {bootTypingCurrentLine && <div>{bootTypingCurrentLine}<span className="animate-ping">_</span></div>}
          </>
        : bootLines.map((line, i) => <div key={i}>{line}</div>)}
      {/* Command history and output below boot text */}
      {history.map((line, i) => <div key={i}><pre className={terminalText}>{line}</pre></div>)}
      {isGenerating && (
        <div className="text-ibm-green">
          [
          {Array.from({ length: 20 }, (_, i) => (
            <span key={i} style={{ color: i < Math.round(generatingProgress * 20) ? '#00FF41' : '#003800' }}>█</span>
          ))}
          ] {Math.round(generatingProgress * 100)}%
        </div>
      )}
      {active && !isGenerating && (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <span style={{ textShadow: '0 0 2px #00FF41, 0 0 6px #00FF41, 0 0 12px #00FF41', color: '#00FF41', fontFamily: 'Courier New, Courier, monospace', fontSize: '14px' }}>C:\SYNTH&gt; </span>
          <span style={{ display: 'inline-block', width: '0.5em' }} />
          <input
            ref={inputRef}
            value={input}
            onChange={onChange}
            onKeyDown={onKeyDown}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#00FF41',
              fontFamily: 'Courier New, Courier, monospace',
              fontSize: '14px',
              width: '60%',
              caretColor: '#00FF41',
              textAlign: 'left',
              textShadow: '0 0 2px #00FF41, 0 0 6px #00FF41, 0 0 12px #00FF41'
            }}
            autoFocus
          />
        </div>
      )}
    </div>
  )
});

TerminalScreen.displayName = 'TerminalScreen';

export default TerminalScreen;