"use client"

import { useState } from "react"

export const PanelLight = ({ color, onClick }: { color: 'red' | 'yellow' | 'green', onClick: () => void }) => {
  const panelLightClass = `
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
    <div className={`${panelLightClass} ${lightClass[color]}`} onClick={onClick}></div>
  )
}

// Panel component with header, lights, and collapse/expand logic
export const Panel = ({ header, className, children }: { header: string, className?: string, children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      <div
        className={`
          flex items-center justify-between cursor-pointer
          border-b border-[#222] shadow
          font-bold
          bg-gradient-to-r from-[#444] via-[#666] to-[#444] text-[#ccc] px-4 py-2
          sticky top-0 z-10
        `}
        style={{ minHeight: '44px' }}
      >
        <div className="flex gap-2">
          <PanelLight color="red" onClick={() => {}} />
          <PanelLight color="yellow" onClick={() => setCollapsed(true)} />
          <PanelLight color="green" onClick={() => setCollapsed(false)} />
        </div>
        <div className="flex-1 text-right font-bold font-mono text-[#ccc] drop-shadow-lg tracking-wide">{header}</div>
      </div>
      {!collapsed && (
        <div className="flex-1 min-h-0 overflow-y-auto font-mono p-3 border-3 border-t-0 border-[#333] bg-gradient-to-br from-[#2a2a2a] to-[#1e1e1e]">
          {children}
        </div>
      )}
    </div>
  );
};

export const PanelGrid = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col gap-2 md:flex-row w-full relative max-w-none">
      {children}
    </div>
  )
}

