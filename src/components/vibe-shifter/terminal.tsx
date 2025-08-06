"use client"

import { useRef, useState } from "react";
import VibeShifter from ".";
import { Sample } from "@/types/supabase";
import { useSamples } from '@/hooks/useSamples';
import { Panel } from "../panel";
import TerminalScreen from "./terminal-screen";
import { sleep } from "@/lib/utils";


const VibeShifterTerminal = () => {
  // bootStage, typedLines, currentLine are no longer needed
  const [booting, setBooting] = useState(true);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const setHistoryIndex = useState<number | null>(null)[1];
  const [sample, setSample] = useState<Sample | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bootLines, setBootLines] = useState<string[]>([]); // Store boot text lines
  const [progress, setProgress] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalScreenRef = useRef<HTMLDivElement>(null);

  const { refetch: refetchSamples } = useSamples();

  const [keyboardControlsEnabled, setKeyboardControlsEnabled] = useState(false);

  // Command handlers
  const handleLs = async () => {
    const { data: samples } = await refetchSamples();
    if (!samples || samples.length === 0) {
      setHistory(h => [...h, "No samples found."]);
      return;
    }
    // Column widths
    const colIdx = 2, colId = 16, colPrompt = 30, colTrim = 5;
    const pad = (str: string, len: number) => str.length >= len ? str.slice(0, len) : str + ' '.repeat(len - str.length);
    // Header and separator
    const header = `${pad('#', colIdx)} | ${pad('ID', colId)} | ${pad('PROMPT', colPrompt)} | ${pad('START', colTrim)} | ${pad('END', colTrim)}`;
    const sep = `${'-'.repeat(colIdx)} | ${'-'.repeat(colId)} | ${'-'.repeat(colPrompt)} | ${'-'.repeat(colTrim)} | ${'-'.repeat(colTrim)}`;
    const rows = (samples as Sample[]).map((s, i) => {
      const idx = pad(i.toString(), colIdx);
      const name = s.id.slice(0, colId);
      const prompt = s.normalized_prompt || '';
      const trimStart = s.trim_start !== null && s.trim_start !== undefined ? s.trim_start.toString() : '';
      const trimEnd = s.trim_end !== null && s.trim_end !== undefined ? s.trim_end.toString() : '';
      return `${pad(idx, colIdx)} | ${pad(name, colId)} | ${pad(prompt, colPrompt)} | ${pad(trimStart, colTrim)} | ${pad(trimEnd, colTrim)}`;
    });
    setHistory(h => [...h, header, sep, ...rows]);
  };

  const handleHelp = () => {
    setHistory(h => [
      ...h,
      "Available commands:",
      "  help           Show this help message",
      "  generate <description> <duration> Generate a sample",
      "  clear          Clear the terminal",
      "  ls             List all samples",
      "  load <id>      Load a sample by ID (use 'ls' to list IDs)",
      "  load           Load an example sample",
      "  why            Why does this exist?"
    ]);
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
    const progressSteps = 20;
    for (let i = 0; i <= progressSteps; i++) {
      setProgress(i / (progressSteps+2));
      await sleep(80 + Math.random() * 60);
    }
    try {
      const response = await fetch("/api/samples/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: description, duration })
      });
      setProgress(1);
      await sleep(500);
      const data = await response.json();
      setSample({
        id: data.id,
        public_url: data.public_url,
        root_midi: data.root_midi,
        trim_start: data.trim_start,
        trim_end: data.trim_end,
        normalized_prompt: description,
        is_example: false,
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
      case "load":
        await handleLoadSample(args[1] || 'example');
        break;
      case "why":
        setHistory(h => [...h, "Because it was fun. Made by Jeshua Maxey"]);
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

  const handleLoadExample = async () => {
    const { data: samples } = await refetchSamples();
    if (!samples || samples.length === 0) {
      setHistory(h => [...h, "Sample not found."]);
      return;
    }
    const sample = samples.find(s => s.is_example);
    if (!sample) {
      setHistory(h => [...h, "Sample not found."]);
      return;
    }
    setSample(sample);
    setHistory(h => [...h, `Example sample '${sample?.normalized_prompt}' loaded. Keyboard and waveform activated.`]);
  }

  const handleLoadSample = async (id: string) => {
    if(id === 'example') {
      await handleLoadExample();
      return;
    }

    const { data: samples } = await refetchSamples();
    if (!samples || samples.length === 0) {
      setHistory(h => [...h, "Sample not found."]);
      return;
    }
    const sample = samples.find(s => s.id.startsWith(id));
    if (!sample) {
      setHistory(h => [...h, "Sample not found."]);
      return;
    }
    setSample(sample);
    setHistory(h => [...h, `Sample ${sample.id} loaded. Keyboard and waveform activated.`]);
  }

  const focusInput = () => {
    if (inputRef.current) inputRef.current.focus();

    console.log('focusInput');
    setKeyboardControlsEnabled(false);
  }

  return (
    <div className="h-screen flex flex-col bg-[#1a1a1a] text-terminal-pixel">
      <div className="flex-1 basis-1/2 min-h-0 max-h-1/2 overflow-y-hidden">
        <Panel header="SYNTH-OS v2.1" className="h-full w-full max-w-none flex flex-col">
          <TerminalScreen
            ref={terminalScreenRef}
            inputRef={inputRef}
            focusInput={focusInput}
            input={input}
            setInput={setInput}
            onKeyDown={handleInput}
            onChange={e => {
              let i = e.target.value
              // make first letter of i lowercase
              i = i.charAt(0).toLowerCase() + i.slice(1)
              setInput(i)
            }}
            booting={booting}
            history={history}
            onBootComplete={(lines) => {
              console.log('onBootComplete')
              setBooting(false);
              setBootLines(lines);
            }}
            bootLines={bootLines}
            isGenerating={isGenerating}
            generatingProgress={progress}
          />
        </Panel>
      </div>
      <div
        className="flex-1 basis-1/2 min-h-0 max-h-1/2 overflow-y-auto flex flex-col items-center mt-8"
        style={booting ? { opacity: 0.5, pointerEvents: 'none', userSelect: 'none' } : {}}
      >
        <VibeShifter sample={sample} keyboardControlsEnabled={keyboardControlsEnabled} setKeyboardControlsEnabled={setKeyboardControlsEnabled} />
      </div>
    </div>
  );
};

export default VibeShifterTerminal; 