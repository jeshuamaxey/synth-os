"use client"

import { useCallback, useEffect, useRef, useState } from "react";
import VibeShifter from ".";
import { Sample } from "@/types/supabase";
import { useSamples } from '@/hooks/useSamples';
import { Panel } from "../panel";
import TerminalScreen from "./terminal-screen";
import { sleep } from "@/lib/utils";
// import { CLIProgressLoader } from "@/lib/CLIProgressLoader";
import { useSampleLoadingProgress } from "@/hooks/useVibeShifterState";
import { useVibeShifterEvent } from "@/hooks/useVibeShifterEvent";
import { useVibeShifter } from "@/providers/vibe-shifter-provider";
import { supabase } from "@/lib/supabase";

// Persist boot state across remounts within the same session
let TERMINAL_BOOTED = false;
let TERMINAL_BOOT_LINES: string[] = [];

const VibeShifterTerminal = () => {
  const { engine, setSample } = useVibeShifter();
  const engineProgress = useSampleLoadingProgress();
  const loadedSampleId = useVibeShifterEvent<string>(engine, 'loaded', (p: unknown) => (p as { sampleId: string }).sampleId);
  // bootStage, typedLines, currentLine are no longer needed
  const [booting, setBooting] = useState<boolean>(() => !TERMINAL_BOOTED);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const setHistoryIndex = useState<number | null>(null)[1];
  const [bootLines, setBootLines] = useState<string[]>(() => TERMINAL_BOOT_LINES); // Store boot text lines
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingIndeterminate, setLoadingIndeterminate] = useState(false);
  const [awaitingSampleId, setAwaitingSampleId] = useState<string | null>(null);
  const [lastLoginEmail, setLastLoginEmail] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalScreenRef = useRef<HTMLDivElement>(null);

  const { refetch: refetchSamples } = useSamples();

  const [keyboardControlsEnabled, setKeyboardControlsEnabled] = useState(false);

  // Skip boot when returning from email link
  useEffect(() => {
    if (!TERMINAL_BOOTED) {
      try {
        if (window.sessionStorage.getItem("skipBootOnce") === "1") {
          TERMINAL_BOOTED = true;
          TERMINAL_BOOT_LINES = ["SYSTEM READY", "Type 'help' for available commands"];
          setBooting(false);
          setBootLines(TERMINAL_BOOT_LINES);
          window.sessionStorage.removeItem("skipBootOnce");
        }
      } catch {}
    }
  }, []);

  // Generic wrapper to run a command with loading UI
  const withLoading = useCallback(async <T,>(fn: () => Promise<T>, options?: { indeterminate?: boolean }): Promise<T> => {
    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingIndeterminate(options?.indeterminate ?? true);
    try {
      const result = await fn();
      return result;
    } finally {
      // Do not reset here if caller wants to keep loading until an external event resolves.
    }
  }, []);

  // Core routine to start loading a selected sample and switch to determinate progress
  const beginEngineLoadForSample = useCallback((sample: Sample) => {
    setLoadingIndeterminate(false);
    setLoadingProgress(0);
    setAwaitingSampleId(sample.id);
    setSample(sample);
  }, [setSample]);

  // When engine emits progress, reflect it during determinate phase
  useEffect(() => {
    if (isLoading && !loadingIndeterminate) {
      setLoadingProgress(engineProgress ?? 0);
    }
  }, [engineProgress, isLoading, loadingIndeterminate]);

  // When engine reports loaded for the sample we're waiting on, finalize
  useEffect(() => {
    if (isLoading && !loadingIndeterminate && loadedSampleId && awaitingSampleId && loadedSampleId === awaitingSampleId) {
      setIsLoading(false);
      setLoadingProgress(0);
      setLoadingIndeterminate(false);
      setAwaitingSampleId(null);
      setHistory(h => [...h, "Sample ready. Keyboard and waveform activated."]);
    }
  }, [loadedSampleId, awaitingSampleId, isLoading, loadingIndeterminate]);

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
      "  load <id>      Load a sample by ID. Partial IDs are supported. Use 'ls' to list IDs",
      "  load           Load an example sample",
      "  whoami         Show current user and session type",
      "  quota          Show usage and limit",
      "  login email <address>   Send a magic link to upgrade session",
      "  verify <otp>   Verify the 6-digit code from email to complete login",
      "  logout         Sign out",
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

    setHistory(h => [...h, `Generating sample: '${description}' (${duration}s)...`] );

    // Phase 1: Indeterminate while the API generates audio and we await response
    await withLoading(async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const response = await fetch("/api/samples/generate", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: JSON.stringify({ prompt: description, duration }),
        });

        if (!response.ok) {
          const text = await response.text();
          if (response.status === 401) {
            setHistory(h => [...h, text || "Not signed in yet. Please wait a moment or run 'login'."]);
          } else if (response.status === 429) {
            setHistory(h => [...h, text || "Limit reached. Run 'login' to upgrade to 10."]);
          } else {
            setHistory(h => [...h, text || "Error generating sample."]);
          }
          setIsLoading(false);
          setLoadingProgress(0);
          setLoadingIndeterminate(false);
          setAwaitingSampleId(null);
          return;
        }

        await sleep(200); // tiny UX pause
        const data = await response.json();

        // Phase 2: Switch to engine-bound progress once we have a sample to load
        setLoadingIndeterminate(false);
        setLoadingProgress(0);

        // Install sample; hook effects will watch progress and completion
        setAwaitingSampleId(data.id);
        setSample({
          ...data,
          is_example: false,
          created_at: null,
        });
      } catch {
        setHistory(h => [...h, "Error generating sample."]);
        setIsLoading(false);
        setLoadingProgress(0);
        setLoadingIndeterminate(false);
        setAwaitingSampleId(null);
      }
    }, { indeterminate: true });
  };

  const handleWhoAmI = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user as unknown as { id: string; is_anonymous?: boolean } | null;
    if (!user) {
      setHistory(h => [...h, "No user session."]);
      return;
    }
    setHistory(h => [...h, `User: ${user.id} (${user.is_anonymous ? 'Anonymous' : 'Authenticated'})`]);
  };

  const handleQuota = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user as unknown as { id: string; is_anonymous?: boolean } | null;
    if (!user) {
      setHistory(h => [...h, "No user session."]);
      return;
    }
    const { count } = await supabase
      .from('sample_generations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    const used = count ?? 0;
    const limit = user.is_anonymous ? 3 : 10;
    setHistory(h => [...h, `Quota: ${used}/${limit} generation(s) used`]);
  };

  const handleLogin = async (args: string[]) => {
    // Usage: login email you@example.com
    if (args.length !== 3 || args[1].toLowerCase() !== 'email') {
      setHistory(h => [...h, "Usage: login email <address>"]);
      return;
    }
    const email = args[2];
    setLastLoginEmail(email);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: origin, shouldCreateUser: true }
      });
      if (error) {
        setHistory(h => [...h, `Login error: ${error.message}`]);
      } else {
        setHistory(h => [...h, `Magic link sent to ${email}. Check your email or enter the 6-digit code with 'verify <otp>'.`]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setHistory(h => [...h, `Failed to initiate login: ${msg}`]);
    }
  };

  const handleVerifyOtp = async (args: string[]) => {
    if (args.length !== 2) {
      setHistory(h => [...h, "Usage: verify <otp>"]);
      return;
    }
    if (!lastLoginEmail) {
      setHistory(h => [...h, "No pending email. Run 'login email <address>' first."]);
      return;
    }
    const otp = args[1];
    try {
      // Verify email OTP. If identity linking is supported, Supabase will complete it; otherwise, signs in.
      const { error } = await supabase.auth.verifyOtp({
        email: lastLoginEmail,
        token: otp,
        type: 'email'
      });
      if (error) throw error;
      setHistory(h => [...h, `Login successful.`]);
      await handleWhoAmI();
      await handleQuota();
    } catch {
      setHistory(h => [...h, "Invalid or expired code. Please try 'login email <address>' again."]);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setHistory(h => [...h, "Signed out."]);
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
      case "whoami":
        await handleWhoAmI();
        break;
      case "quota":
        await handleQuota();
        break;
      case "login":
        await handleLogin(args);
        break;
      case "verify":
        await handleVerifyOtp(args);
        break;
      case "logout":
        await handleLogout();
        break;
      case "why":
        setHistory(h => [...h, "Because it was fun. Made by Jeshua Maxey"]);
        break;
      default:
        setHistory(h => [...h, `Unknown command: ${args[0]}`]);
    }
  };

  const handleInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isLoading) return; // lock input while loading
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
    setHistory(h => [...h, "Loading example sample..."]);
    await withLoading(async () => {
      const { data: samples } = await refetchSamples();
      if (!samples || samples.length === 0) {
        setHistory(h => [...h, "Sample not found."]);
        setIsLoading(false);
        setLoadingProgress(0);
        setLoadingIndeterminate(false);
        setAwaitingSampleId(null);
        return;
      }
      const sample = (samples as Sample[]).find(s => s.is_example);
      if (!sample) {
        setHistory(h => [...h, "Sample not found."]);
        setIsLoading(false);
        setLoadingProgress(0);
        setLoadingIndeterminate(false);
        setAwaitingSampleId(null);
        return;
      }

      beginEngineLoadForSample(sample);
    }, { indeterminate: true });
  }

  const handleLoadSample = async (id: string) => {
    if(id === 'example') {
      await handleLoadExample();
      return;
    }

    setHistory(h => [...h, `Loading sample '${id}'...`]);
    await withLoading(async () => {
      const { data: samples } = await refetchSamples();
      if (!samples || samples.length === 0) {
        setHistory(h => [...h, "Sample not found."]);
        setIsLoading(false);
        setLoadingProgress(0);
        setLoadingIndeterminate(false);
        setAwaitingSampleId(null);
        return;
      }
      const sample = (samples as Sample[]).find(s => s.id.startsWith(id));
      if (!sample) {
        setHistory(h => [...h, "Sample not found."]);
        setIsLoading(false);
        setLoadingProgress(0);
        setLoadingIndeterminate(false);
        setAwaitingSampleId(null);
        return;
      }

      beginEngineLoadForSample(sample);
    }, { indeterminate: true });
  }

  const focusInput = () => {
    if (inputRef.current) inputRef.current.focus();

    setKeyboardControlsEnabled(false);
  }

  const handleBootComplete = useCallback((lines: string[]) => {
    TERMINAL_BOOTED = true;
    TERMINAL_BOOT_LINES = lines;
    setBooting(false);
    setBootLines(lines);
  }, [])

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
            onBootComplete={handleBootComplete}
            bootLines={bootLines}
            isLoading={isLoading}
            loadingProgress={loadingProgress}
            loadingIndeterminate={loadingIndeterminate}
          />
        </Panel>
      </div>
      <div
        className="flex-1 basis-1/2 min-h-0 max-h-1/2 overflow-y-auto flex flex-col items-center mt-8"
        style={booting ? { opacity: 0.5, pointerEvents: 'none', userSelect: 'none' } : {}}
      >
        <VibeShifter keyboardControlsEnabled={keyboardControlsEnabled} setKeyboardControlsEnabled={setKeyboardControlsEnabled} />
      </div>
    </div>
  );
};

export default VibeShifterTerminal; 