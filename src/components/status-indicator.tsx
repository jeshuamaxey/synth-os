type Status = 'none' | 'loading' | 'ok' | 'error'

const StatusIndicator = ({ status, label, onClick }: { status: Status, label: string, onClick?: () => void }) => {
  const bgs = {
    none: 'bg-[#333]',
    loading: 'bg-[#ffdd44]',
    ok: 'bg-terminal-pixel',
    error: 'bg-[#ff4444]'
  }
  const bgColor = bgs[status]
  return (
    <div
      className={`${onClick ? 'cursor-pointer select-none' : ''}`}
      onClick={onClick}>
        <span className={`inline-block w-2 h-2 rounded-full mr-1 ${bgColor}`}></span>
        <span>&nbsp;</span>
        <span className="capitalize">{label}</span>
      </div>
  )
}

export default StatusIndicator;