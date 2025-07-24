const ControlButton = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => {
  return <div className={`
    bg-[#111] text-[#ccc]
    bg-gradient-to-r from-[#555] to-[#333]
    border-1 border-[#666]
    rounded relative overflow-hidden py-1.5 px-2 cursor-pointer
    shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]
    transition-all duration-200
    hover:from-[#666] hover:to-[#444] hover:shadow-[0_0_10px_rgba(0,255,65,0.3)]
    `} onClick={onClick}>
    {children}
  </div>
}

export default ControlButton