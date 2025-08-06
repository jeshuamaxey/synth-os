'use client'

import { createContext, useContext, useRef, useEffect, ReactNode, useState } from 'react'
import { VibeShifterAudio } from '@/lib/audio/vibe-shifter'
import { Sample } from '@/types/supabase'

interface VibeShifterContextType {
  engine: VibeShifterAudio | null
}

const VibeShifterContext = createContext<VibeShifterContextType | null>(null)

interface VibeShifterProviderProps {
  children: ReactNode
  sample: Sample | null
}

export function VibeShifterProvider({ children, sample }: VibeShifterProviderProps) {
  const engineRef = useRef<VibeShifterAudio | null>(null)
  const [engine, setEngine] = useState<VibeShifterAudio | null>(null)

  useEffect(() => {
    if (sample) {
      const newEngine = new VibeShifterAudio(sample, { debug: false })
      engineRef.current = newEngine
      setEngine(newEngine)
      newEngine.loadSample()
    } else {
      engineRef.current = null
      setEngine(null)
    }
  }, [sample])

  return (
    <VibeShifterContext.Provider value={{ engine }}>
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