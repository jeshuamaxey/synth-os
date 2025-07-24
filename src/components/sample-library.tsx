"use client"

import React, { useRef, useState } from 'react';
import { useSamples } from '@/hooks/useSamples';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';

export default function SampleLibrary() {
  const { data: samples, isLoading, error } = useSamples();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [durations, setDurations] = useState<Record<string, number>>({}); // id -> duration in seconds

  const handlePlayPause = (url: string, id: string) => {
    if (playingId === id) {
      // Pause if already playing
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingId(null);
        setProgress(0);
      }
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play();
    setPlayingId(id);
    setProgress(0);
    audio.onended = () => {
      setPlayingId(null);
      setProgress(0);
    };
    audio.ontimeupdate = () => {
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration);
      }
    };
    audio.onloadedmetadata = () => {
      setDurations(d => ({ ...d, [id]: audio.duration }));
    };
  };

  const getDuration = (id: string) => {
    const duration = durations[id];
    return duration ? duration.toFixed(1) : '...';
  };

  if (isLoading) return <div className="p-4">Loading samples...</div>;
  if (error) return <div className="p-4 text-red-500">Error loading samples.</div>;
  if (!samples || samples.length === 0) return <div className="p-4">No samples found.</div>;

  return (
    <div className="max-w-xl mx-auto p-6 bg-card rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Sample Library</h2>
      <ul className="space-y-3">
        {samples.map(sample => {
          const isPlaying = playingId === sample.id;
          const itemProgress = isPlaying ? progress : 0;
          return (
            <li
              key={sample.id}
              className="relative flex flex-col gap-1 p-3 rounded-md overflow-hidden transition-all duration-100 bg-muted"
            >
              {/* Progress overlay */}
              <div
                className="absolute left-0 top-0 h-full z-0 bg-muted transition-all duration-100"
                style={{
                  width: `${itemProgress * 100}%`,
                  background: 'rgba(0,0,0,0.08)', // subtle dark overlay
                  pointerEvents: 'none',
                  transition: 'width 0.15s linear',
                }}
              />
              <div className="relative flex items-center gap-3 z-10">
                <span className="flex-1 truncate" title={sample.normalized_prompt}>{sample.normalized_prompt}</span>
                <span className="text-xs text-muted-foreground min-w-[40px] text-right tabular-nums">
                  {getDuration(sample.id)}s
                </span>
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  onClick={() => handlePlayPause(sample.public_url, sample.id)}
                >
                  {isPlaying ? <Pause /> : <Play />}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
} 