'use client'

import { createContext, useContext, useRef, ReactNode, useState } from 'react'
import { VibeShifterAudio } from '@/lib/audio/vibe-shifter'
import { Sample } from '@/types/supabase'
import { useDebug } from '@/hooks/useDebug'

interface VibeShifterContextType {
  engine: VibeShifterAudio | null
  setSample: (sample: Sample | null) => VibeShifterAudio
}

const VibeShifterContext = createContext<VibeShifterContextType | null>(null)

interface VibeShifterProviderProps {
  children: ReactNode
}

export function VibeShifterProvider({ children }: VibeShifterProviderProps) {
  const engineRef = useRef<VibeShifterAudio | null>(null)
  const [, _setSample] = useState<Sample | null>(null)
  const [engine, setEngine] = useState<VibeShifterAudio | null>(null)
  const debug = useDebug()

  const setSample = (sample: Sample | null): VibeShifterAudio => {
    _setSample(sample)

    const newEngine = new VibeShifterAudio(sample, { debug })

    engineRef.current = newEngine
    setEngine(newEngine)

    if(sample) newEngine.loadSample()

    return newEngine
  }

  return (
    <VibeShifterContext.Provider value={{ engine, setSample }}>
      {children}
    </VibeShifterContext.Provider>
  )
}

export function useVibeShifter() {
  const context = useContext(VibeShifterContext)
  if (!context) {
    throw new Error('useVibeShifter must be used within a VibeShifterProvider')
  }
  return context
} 