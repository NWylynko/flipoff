import { useRef, useCallback, useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import BoardSection from './components/BoardSection.jsx'
import { SoundEngine } from './SoundEngine.js'

export default function App() {
  const soundEngineRef = useRef(new SoundEngine())
  const [muted, setMuted] = useState(false)
  const audioInitializedRef = useRef(false)
  const boardSectionRef = useRef(null)

  const initAudio = useCallback(async () => {
    if (audioInitializedRef.current) return
    audioInitializedRef.current = true
    await soundEngineRef.current.init()
    soundEngineRef.current.resume()
  }, [])

  useEffect(() => {
    document.addEventListener('click', initAudio)
    document.addEventListener('keydown', initAudio)
    return () => {
      document.removeEventListener('click', initAudio)
      document.removeEventListener('keydown', initAudio)
    }
  }, [initAudio])

  const handleToggleMute = useCallback(() => {
    initAudio()
    const isMuted = soundEngineRef.current.toggleMute()
    setMuted(isMuted)
  }, [initAudio])

  const handleCTA = useCallback((e) => {
    e.preventDefault()
    initAudio()
    boardSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
    setTimeout(() => {
      document.documentElement.requestFullscreen().catch(() => {})
    }, 400)
  }, [initAudio])

  return (
    <div className="page-frame">
      <Header muted={muted} onToggleMute={handleToggleMute} />
      <Hero onCTA={handleCTA} />
      <BoardSection ref={boardSectionRef} soundEngine={soundEngineRef.current} />
    </div>
  )
}
