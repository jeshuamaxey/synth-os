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

  const activeClasses = ["scale-95"]

  const baseClass = `
    p-2 rounded-b-md border border-black transition-all duration-100 text-xs
    ${activeClasses.map(c => `active:${c}`).join(" ")}
    ${isActive ? activeClasses.join(" ") : ""}
  `
  const whiteKeyClass = "bg-white h-24"
  const blackKeyClass = "bg-blue-800 h-16 relative -left-4 text-white"

  return <button
    className={`${baseClass} ${blackKey ? blackKeyClass : whiteKeyClass}`}
    onClick={onPress}
    style={style}
  >
    <div className="flex flex-col h-full items-center justify-end">
      <span className="text-xs">{keyboardKey}</span>
    </div>
  </button>
}

const KeyBoard = ({ notes, onPress }: { notes: string[], onPress: (note: string) => void }) => {
  const downKeys = useKeyboardToNote(onPress)

  const WHITE_WIDTH = 40
  const BLACK_WIDTH = 24
  const CENTER_OFFSET = 0

  const whiteKeys = notes.filter(note => !note.includes('#'))
  const blackKeys = notes.filter(note => note.includes('#'))
 

  const depressedNotes = [...downKeys].map(key => KEY_TO_NOTE[key])

  return <div className="relative">
    <div className="flex">
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
    <div className="absolute top-0 left-0 w-full">
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

