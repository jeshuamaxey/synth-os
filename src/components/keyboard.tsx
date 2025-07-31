import { useKeyboardToNote, getKeyFromNote, KEY_TO_NOTE } from "@/hooks/useKeyboardToNote"

// // 🧠 Maps black notes to white key positions
function getBlackKeyOffset(note: string): number {
  const map: Record<string, number> = {
    'C#': 1,
    'D#': 2,
    'F#': 4,
    'G#': 5,
    'A#': 6
  }
  return map[note.slice(0, 2)] ?? 0
}

const Key = ({ note, onPress, isActive, style }: { note: string, onPress: () => void, isActive?: boolean, style?: React.CSSProperties }) => {
  const blackKey = note.includes('#')
  const keyboardKey = getKeyFromNote(note)

  
  const baseClass = `
  p-2 border transition-all duration-100 text-xs
  border border-terminal-pixel outline-none focus:outline-none active:outline-none
  font-mono font-bold
  ${blackKey ? "h-16 relative -left-4" : "h-24"}
  `
  
  const blackKeyActiveClasses = ["bg-black", "text-terminal-pixel"]
  const whiteKeyActiveClasses = ["bg-terminal-pixel", "text-black"]

  const activeClasses = ["scale-95"].concat(blackKey ? blackKeyActiveClasses : whiteKeyActiveClasses)

  const activeClass = `
    ${isActive ? activeClasses.join(" ") : ""}
  `

  const inactiveWhiteKeyClass = "bg-transparent text-terminal-pixel"
  const inactiveBlackKeyClass = "bg-terminal-pixel text-black"

  const keyClass = isActive ? activeClass : blackKey ? inactiveBlackKeyClass: inactiveWhiteKeyClass

  return <button
    className={`${baseClass} ${activeClasses.map(c => `active:${c}`).join(" ")} ${keyClass}`}
    onClick={onPress}
    style={style}
  >
    <div className="flex flex-col h-full items-center justify-end">
      <span className="text-xs">{keyboardKey}</span>
    </div>
  </button>
}

type KeyBoardProps = {
  notes: string[]
  onPress: (note: string) => void
  enabled: boolean
}

const KeyBoard = ({ notes, onPress, enabled }: KeyBoardProps) => {
  const downKeys = useKeyboardToNote(onPress, enabled)

  const WHITE_WIDTH = 40
  const BLACK_WIDTH = 24
  const CENTER_OFFSET = 0

  const whiteKeys = notes.filter(note => !note.includes('#'))
  const blackKeys = notes.filter(note => note.includes('#'))
 

  const depressedNotes = [...downKeys].map(key => KEY_TO_NOTE[key])

  return <div className="relative bg-black p-4 rounded-lg border-3 border-[#333]">    
    <div className="flex relative z-10">
      {whiteKeys.map(note =>{
        const isDepressed = depressedNotes.includes(note)
        
        return <Key
          key={note}
          note={note}
          onPress={() => onPress(note)}
          isActive={isDepressed}
          style={{ width: WHITE_WIDTH }}
        />
      })}
    </div>
    <div className="absolute top-4 left-4 w-full z-20">
      {blackKeys.map((note, i) => {
        const offset = getBlackKeyOffset(note)
        const left = offset * WHITE_WIDTH + CENTER_OFFSET - (BLACK_WIDTH / 2) - (i * BLACK_WIDTH)
        const isDepressed = depressedNotes.includes(note)

        return <Key
          key={note}
          note={note}
          onPress={() => onPress(note)}
          isActive={isDepressed}
          style={{ width: BLACK_WIDTH, left: `${left}px`}}
        />
      })}
    </div>
  </div>
}

export default KeyBoard;

