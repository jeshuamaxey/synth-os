"use client"

import { useEffect, useRef, useState } from "react";
import VibeShifter from ".";
import { Sample } from "@/types/supabase";
import styles from "./vibe-shifter-console.module.css";
import { useSamples } from '@/hooks/useSamples';

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

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

const VibeShifterTerminal = () => {
  // bootStage, typedLines, currentLine are no longer needed
  const [showCursor, setShowCursor] = useState(true);
  const [terminalActive, setTerminalActive] = useState(false);
  const [booting, setBooting] = useState(true);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const setHistoryIndex = useState<number | null>(null)[1];
  const [sample, setSample] = useState<Sample | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [bootLines, setBootLines] = useState<string[]>([]); // Store boot text lines
  const [bootTypingLines, setBootTypingLines] = useState<string[]>([]);
  const [bootTypingCurrentLine, setBootTypingCurrentLine] = useState<string>("");
  // Play boot-up sound
  const bootAudioRef = useRef<HTMLAudioElement | null>(null);
  const terminalScreenRef = useRef<HTMLDivElement>(null);

  const { refetch: refetchSamples } = useSamples();

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => setShowCursor(c => !c), 500);
    return () => clearInterval(interval);
  }, []);

  // Boot sequence
  useEffect(() => {
    (async () => {
      // Play boot-up sound
      if (!bootAudioRef.current) {
        bootAudioRef.current = new Audio("/audio/boot-up.mp3");
        bootAudioRef.current.volume = 0.7;
      }
      bootAudioRef.current.currentTime = 0;
      bootAudioRef.current.play();
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
      // setBootStage(3); // terminal
      setTerminalActive(true);
      // setTypedLines([...lines]);
      // setCurrentLine("");
      setBootLines([...lines]); // Save boot text for permanent display
      setBootTypingLines([]);
      setBootTypingCurrentLine("");
      setBooting(false); // Boot sequence done, enable interactivity
    })();
  }, []);

  // Focus input when terminal is active
  useEffect(() => {
    if (terminalActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [terminalActive]);

  // Scroll terminal to bottom when output changes
  useEffect(() => {
    if (terminalScreenRef.current) {
      terminalScreenRef.current.scrollTop = terminalScreenRef.current.scrollHeight;
    }
  }, [history, bootLines, isGenerating]);

  // Command handlers
  const handleLs = async () => {
    const { data: samples } = await refetchSamples();
    if (!samples || samples.length === 0) {
      setHistory(h => [...h, "No samples found."]);
      return;
    }
    const pad = (str: string, len: number) => str.length >= len ? str.slice(0, len) : str + ' '.repeat(len - str.length);
    const colName = 16, colPrompt = 30;
    const header = `${pad('ID', colName)} | ${pad('PROMPT', colPrompt)}`;
    const sep = `${'-'.repeat(colName)}-+-${'-'.repeat(colPrompt)}`;
    const rows = (samples as Sample[]).map((s) => {
      const name = s.id.slice(0, colName);
      const prompt = s.normalized_prompt || '';
      return `${pad(name, colName)} | ${pad(prompt, colPrompt)}`;
    });
    setHistory(h => [...h, header, sep, ...rows]);
  };

  const handleHelp = () => {
    setHistory(h => [...h, "Available commands:", "  help", "  generate <description> <duration>", "  clear", "  ls"]);
  };

  const handleClear = () => {
    setHistory([]);
    setBootLines([]);
  };

  const handleGenerate = async (args: string[]) => {
    if (args.length < 3) {
      setHistory(h => [...h, "Usage: generate <description> <duration>"]);
      return;
    }
    const description = args.slice(1, -1).join(" ");
    const duration = parseInt(args[args.length - 1], 10);
    if (isNaN(duration) || duration < 1 || duration > 10) {
      setHistory(h => [...h, "Duration must be 1-10 seconds."]);
      return;
    }
    setIsGenerating(true);
    setSample(null);
    setHistory(h => [...h, `Generating sample: '${description}' (${duration}s)...`]);
    for (let i = 0; i <= 20; i++) {
      setProgress(i / 20);
      await sleep(80 + Math.random() * 60);
    }
    try {
      const response = await fetch("/api/samples/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: description, duration })
      });
      const data = await response.json();
      setSample({
        id: data.id,
        public_url: data.public_url,
        root_midi: data.root_midi,
        trim_start: data.trim_start,
        trim_end: data.trim_end,
        normalized_prompt: description,
        created_at: null
      });
      setHistory(h => [...h, "Sample ready. Keyboard and waveform activated."]);
    } catch {
      setHistory(h => [...h, "Error generating sample."]);
    }
    setIsGenerating(false);
    setProgress(0);
  };

  const handleCommand = async (cmd: string) => {
    const args = cmd.trim().split(/\s+/);
    if (!args[0]) return;
    setHistory(h => [...h, `C:\\SYNTH> ${cmd}`]);
    setCommandHistory(h => [...h, cmd]);
    setHistoryIndex(null);
    switch (args[0]) {
      case "ls":
        await handleLs();
        break;
      case "help":
        handleHelp();
        break;
      case "clear":
        handleClear();
        break;
        case "generate":
        case "gen":
        await handleGenerate(args);
        break;
      default:
        setHistory(h => [...h, `Unknown command: ${args[0]}`]);
    }
  };

  const handleInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const cmd = input;
      setInput("");
      handleCommand(cmd);
    } else if (e.key === "ArrowUp") {
      setHistoryIndex(prev => {
        const newIndex = prev === null ? commandHistory.length - 1 : Math.max(0, prev - 1);
        if (commandHistory.length > 0 && newIndex >= 0) {
          setInput(commandHistory[newIndex]);
          return newIndex;
        }
        return prev;
      });
    } else if (e.key === "ArrowDown") {
      setHistoryIndex(prev => {
        if (prev === null) return null;
        const newIndex = prev + 1;
        if (newIndex < commandHistory.length) {
          setInput(commandHistory[newIndex]);
          return newIndex;
        } else {
          setInput("");
          return null;
        }
      });
    }
  };

  return (
    <div className={styles.consoleContainer}>
      {/* Terminal Section */}
      <div className={styles.terminalSection}>
        <div className={styles.terminalHeader}>
          <div className={styles.terminalLights}>
            <div className={`${styles.light} ${styles.lightRed}`}></div>
            <div className={`${styles.light} ${styles.lightYellow}`}></div>
            <div className={`${styles.light} ${styles.lightGreen}`}></div>
          </div>
          <div className={styles.terminalTitle}>SYNTH-OS v2.1</div>
        </div>
        <div
          className={styles.terminalScreen}
          ref={terminalScreenRef}
          onClick={() => {
            if (inputRef.current) inputRef.current.focus();
          }}
        >
          {/* Boot text stays at the top, animate in during boot character by character */}
          {booting
            ? <>
                {bootTypingLines.map((line, i) => <div key={i}>{line}</div>)}
                {bootTypingCurrentLine && <div>{bootTypingCurrentLine}<span className={styles.cursor}>_</span></div>}
              </>
            : bootLines.map((line, i) => <div key={i}>{line}</div>)}
          {/* Command history and output below boot text */}
          {history.map((line, i) => <div key={i}>{line}</div>)}
          {isGenerating && (
            <div className="text-ibm-green">
              [
              {Array.from({ length: 20 }, (_, i) => (
                <span key={i} style={{ color: i < Math.round(progress * 20) ? '#00FF41' : '#003800' }}>█</span>
              ))}
              ] {Math.round(progress * 100)}%
            </div>
          )}
          {terminalActive && !isGenerating && (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <span style={{ textShadow: '0 0 2px #00FF41, 0 0 6px #00FF41, 0 0 12px #00FF41', color: '#00FF41', fontFamily: 'Courier New, Courier, monospace', fontSize: '14px' }}>C:\SYNTH&gt; </span>
              <span style={{ display: 'inline-block', width: '0.5em' }} />
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleInput}
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
              <span className={styles.cursor} style={{ opacity: showCursor ? 1 : 0, marginLeft: 2, color: '#00FF41', textShadow: '0 0 2px #00FF41, 0 0 6px #00FF41, 0 0 12px #00FF41' }}>_</span>
            </div>
          )}
        </div>
      </div>
      {/* Instrument Section will be refactored next */}
      <div
        className="w-full flex flex-col items-center mt-8"
        style={booting ? { opacity: 0.5, pointerEvents: 'none', userSelect: 'none' } : {}}
      >
        <VibeShifter sample={sample} />
      </div>
    </div>
  );
};

export default VibeShifterTerminal; 