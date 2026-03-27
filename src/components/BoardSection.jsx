import { forwardRef, useRef, useEffect, useCallback, useState, createRef } from 'react'
import Tile from './Tile.jsx'
import {
  GRID_COLS, GRID_ROWS, STAGGER_DELAY, TOTAL_TRANSITION,
  MESSAGE_INTERVAL, MESSAGES, ACCENT_COLORS
} from '../constants.js'

const BoardSection = forwardRef(function BoardSection({ soundEngine }, ref) {
  // Stable 2D array of createRef() objects — initialised once
  const tileRefs = useRef(
    Array.from({ length: GRID_ROWS }, () =>
      Array.from({ length: GRID_COLS }, () => createRef())
    )
  )
  const currentGridRef = useRef(
    Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(' '))
  )
  const isTransitioningRef = useRef(false)
  const accentIndexRef = useRef(0)
  const [accentColor, setAccentColor] = useState(ACCENT_COLORS[0])
  const [showShortcuts, setShowShortcuts] = useState(false)
  const currentIndexRef = useRef(-1)
  const rotatorTimerRef = useRef(null)

  // Toast
  const [toast, setToast] = useState({ text: '', visible: false })
  const toastTimerRef = useRef(null)

  const showToast = useCallback((msg) => {
    setToast({ text: msg, visible: true })
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => {
      setToast(t => ({ ...t, visible: false }))
    }, 1200)
  }, [])

  const formatToGrid = useCallback((lines) => {
    return Array.from({ length: GRID_ROWS }, (_, r) => {
      const line = (lines[r] || '').toUpperCase()
      const padTotal = GRID_COLS - line.length
      const padLeft = Math.max(0, Math.floor(padTotal / 2))
      const padded =
        ' '.repeat(padLeft) +
        line +
        ' '.repeat(Math.max(0, GRID_COLS - padLeft - line.length))
      return padded.split('')
    })
  }, [])

  // Use a ref so displayMessage has stable identity and can be called from timer
  const soundEngineRef = useRef(soundEngine)
  useEffect(() => { soundEngineRef.current = soundEngine }, [soundEngine])

  const displayMessage = useCallback((lines) => {
    if (isTransitioningRef.current) return
    isTransitioningRef.current = true

    const newGrid = formatToGrid(lines)
    let hasChanges = false

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const newChar = newGrid[r][c]
        const oldChar = currentGridRef.current[r][c]
        if (newChar !== oldChar) {
          const delay = (r * GRID_COLS + c) * STAGGER_DELAY
          tileRefs.current[r][c].current?.scrambleTo(newChar, delay)
          hasChanges = true
        }
      }
    }

    if (hasChanges && soundEngineRef.current) {
      soundEngineRef.current.playTransition()
    }

    accentIndexRef.current++
    setAccentColor(ACCENT_COLORS[accentIndexRef.current % ACCENT_COLORS.length])
    currentGridRef.current = newGrid

    setTimeout(() => {
      isTransitioningRef.current = false
    }, TOTAL_TRANSITION + 200)
  }, [formatToGrid])

  const startAutoRotation = useCallback(() => {
    if (rotatorTimerRef.current) clearInterval(rotatorTimerRef.current)
    rotatorTimerRef.current = setInterval(() => {
      if (!isTransitioningRef.current) {
        currentIndexRef.current = (currentIndexRef.current + 1) % MESSAGES.length
        displayMessage(MESSAGES[currentIndexRef.current])
      }
    }, MESSAGE_INTERVAL + TOTAL_TRANSITION)
  }, [displayMessage])

  const nextMessage = useCallback(() => {
    currentIndexRef.current = (currentIndexRef.current + 1) % MESSAGES.length
    displayMessage(MESSAGES[currentIndexRef.current])
    startAutoRotation()
  }, [displayMessage, startAutoRotation])

  const prevMessage = useCallback(() => {
    currentIndexRef.current = (currentIndexRef.current - 1 + MESSAGES.length) % MESSAGES.length
    displayMessage(MESSAGES[currentIndexRef.current])
    startAutoRotation()
  }, [displayMessage, startAutoRotation])

  // Keyboard handler
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault()
          nextMessage()
          break
        case 'ArrowRight':
          e.preventDefault()
          nextMessage()
          break
        case 'ArrowLeft':
          e.preventDefault()
          prevMessage()
          break
        case 'f':
        case 'F':
          e.preventDefault()
          if (document.fullscreenElement) {
            document.exitFullscreen()
          } else {
            document.documentElement.requestFullscreen().catch(() => {})
          }
          break
        case 'm':
        case 'M':
          e.preventDefault()
          if (soundEngineRef.current) {
            const isMuted = soundEngineRef.current.toggleMute()
            showToast(isMuted ? 'Sound off' : 'Sound on')
          }
          break
        case 'Escape':
          if (document.fullscreenElement) document.exitFullscreen()
          setShowShortcuts(false)
          break
        default:
          break
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [nextMessage, prevMessage, showToast])

  // Start rotation on mount
  useEffect(() => {
    currentIndexRef.current = 0
    displayMessage(MESSAGES[0])
    startAutoRotation()
    return () => {
      if (rotatorTimerRef.current) clearInterval(rotatorTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="board-section" ref={ref}>
      <div
        className="board"
        style={{ '--grid-cols': GRID_COLS, '--grid-rows': GRID_ROWS }}
      >
        <div className="accent-bar accent-bar-left">
          <div className="accent-segment" style={{ backgroundColor: accentColor }} />
          <div className="accent-segment" style={{ backgroundColor: accentColor }} />
        </div>

        <div className="tile-grid">
          {Array.from({ length: GRID_ROWS }, (_, r) =>
            Array.from({ length: GRID_COLS }, (_, c) => (
              <Tile
                key={`${r}-${c}`}
                ref={tileRefs.current[r][c]}
              />
            ))
          )}
        </div>

        <div className="accent-bar accent-bar-right">
          <div className="accent-segment" style={{ backgroundColor: accentColor }} />
          <div className="accent-segment" style={{ backgroundColor: accentColor }} />
        </div>

        <div
          className="keyboard-hint"
          title="Keyboard shortcuts"
          onClick={(e) => { e.stopPropagation(); setShowShortcuts(s => !s) }}
        >
          N
        </div>

        <div className={`shortcuts-overlay${showShortcuts ? ' visible' : ''}`}>
          <div><span>Next message</span><kbd>Enter</kbd></div>
          <div><span>Previous</span><kbd>&#8592;</kbd></div>
          <div><span>Fullscreen</span><kbd>F</kbd></div>
          <div><span>Mute</span><kbd>M</kbd></div>
        </div>
      </div>

      {toast.visible && (
        <div
          style={{
            position: 'fixed',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            padding: '8px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          {toast.text}
        </div>
      )}
    </section>
  )
})

export default BoardSection
