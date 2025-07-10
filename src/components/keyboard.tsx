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

const Key = ({ note, onPress, style }: { note: string, onPress: () => void, style?: React.CSSProperties }) => {
  const blackKey = note.includes('#')

  const baseClass = "p-2 rounded-b-md border border-black active:scale-95 transition-all duration-100"
  const whiteKeyClass = "bg-white h-24"
  const blackKeyClass = "bg-blue-800 h-16 relative -left-4"

  return <button
    className={`${baseClass} ${blackKey ? blackKeyClass : whiteKeyClass}`}
    onClick={onPress}
    style={style}
  />
}

const KeyBoard = ({ notes, onPress }: { notes: string[], onPress: (note: string) => void }) => {
  const WHITE_WIDTH = 40
  const BLACK_WIDTH = 24
  const CENTER_OFFSET = 0

  const whiteKeys = notes.filter(note => !note.includes('#'))
  const blackKeys = notes.filter(note => note.includes('#'))

  return <div className="relative">
    <div className="flex">
      {whiteKeys.map(note => <Key key={note} note={note} onPress={() => onPress(note)} style={{ width: WHITE_WIDTH }} />)}
    </div>
    <div className="absolute top-0 left-0 w-full">
      {blackKeys.map((note, i) => {
        const offset = getBlackKeyOffset(note)
        const left = offset * WHITE_WIDTH + CENTER_OFFSET - (BLACK_WIDTH / 2) - (i * BLACK_WIDTH)

        return <Key key={note} note={note} onPress={() => onPress(note)} style={{ width: BLACK_WIDTH, left: `${left}px` }} />
      })}
    </div>
  </div>
}

export default KeyBoard;

