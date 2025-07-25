"use client"

import { useEffect, useState } from "react"

const placeholder = '_'
const initialDots = [placeholder, placeholder, placeholder]

const EllipsisSpinner = () => {
  const [dots, setDots] = useState(initialDots)
  useEffect(() => {
    const interval = setInterval(() => {
      const spaceIndex = dots.indexOf(placeholder)
      if(spaceIndex === -1) {
        setDots(initialDots)
      } else {
        setDots(dots => dots.map((dot, i) => i === spaceIndex ? '.' : dot))
      }
    }, 500)
    return () => clearInterval(interval)
  }, [dots])
  return <div className="inline-block">{dots.join('')}</div>
}

export default EllipsisSpinner