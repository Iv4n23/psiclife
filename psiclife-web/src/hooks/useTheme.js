// src/hooks/useTheme.js
import { useState, useEffect } from 'react'

export function useTheme() {
  const [tema, setTema] = useState(() => {
    return localStorage.getItem('psiclife_tema') ?? 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema === 'dark' ? 'dark' : '')
    localStorage.setItem('psiclife_tema', tema)
  }, [tema])

  const toggleTema = () => setTema(t => t === 'dark' ? 'light' : 'dark')

  return { tema, toggleTema }
}
