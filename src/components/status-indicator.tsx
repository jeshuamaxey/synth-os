type Status = 'none' | 'loading' | 'ok' | 'error'

const StatusIndicator = ({ status, label }: { status: Status, label: string }) => {
  const bgs = {
    none: 'bg-[#333]',
    loading: 'bg-[#ffdd44]',
    ok: 'bg-[#00ff41]',
    error: 'bg-[#ff4444]'
  }
  const bgColor = bgs[status]
  return (
    <div><span className={`inline-block w-2 h-2 rounded-full mr-1 ${bgColor}`}></span> <span className="capitalize">{label}</span></div>
  )
}

export default StatusIndicator;