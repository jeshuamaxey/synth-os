"use client"

import { useEffect, useState } from "react"

export function useDebug() {
  // get debug from url hash
  const [debug, setDebug] = useState(false)
  useEffect(() => {
    const hash = window.location.hash
    setDebug(hash === '#debug')
  }, [])

  return debug
}