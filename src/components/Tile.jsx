import { forwardRef, useImperativeHandle, useRef } from 'react'
import { CHARSET, SCRAMBLE_COLORS, FLIP_DURATION } from '../constants.js'

const Tile = forwardRef(function Tile(_props, ref) {
  const frontSpanRef = useRef(null)
  const backSpanRef = useRef(null)
  const frontElRef = useRef(null)
  const innerElRef = useRef(null)
  const tileElRef = useRef(null)
  const scrambleTimerRef = useRef(null)
  const currentCharRef = useRef(' ')

  useImperativeHandle(ref, () => ({
    setChar(char) {
      currentCharRef.current = char
      if (frontSpanRef.current) {
        frontSpanRef.current.textContent = char === ' ' ? '' : char
      }
      if (backSpanRef.current) backSpanRef.current.textContent = ''
      if (frontElRef.current) frontElRef.current.style.backgroundColor = ''
    },
    scrambleTo(targetChar, delay) {
      if (targetChar === currentCharRef.current) return

      if (scrambleTimerRef.current) {
        clearInterval(scrambleTimerRef.current)
        scrambleTimerRef.current = null
      }

      setTimeout(() => {
        tileElRef.current?.classList.add('scrambling')
        let scrambleCount = 0
        const maxScrambles = 10 + Math.floor(Math.random() * 4)

        scrambleTimerRef.current = setInterval(() => {
          const randChar = CHARSET[Math.floor(Math.random() * CHARSET.length)]
          if (frontSpanRef.current) {
            frontSpanRef.current.textContent = randChar === ' ' ? '' : randChar
          }
          const color = SCRAMBLE_COLORS[scrambleCount % SCRAMBLE_COLORS.length]
          if (frontElRef.current) {
            frontElRef.current.style.backgroundColor = color
            if (color === '#FFFFFF' || color === '#FFCC00') {
              frontSpanRef.current.style.color = '#111'
            } else {
              frontSpanRef.current.style.color = ''
            }
          }
          scrambleCount++

          if (scrambleCount >= maxScrambles) {
            clearInterval(scrambleTimerRef.current)
            scrambleTimerRef.current = null

            if (frontElRef.current) {
              frontElRef.current.style.backgroundColor = ''
              frontSpanRef.current.style.color = ''
            }
            if (frontSpanRef.current) {
              frontSpanRef.current.textContent = targetChar === ' ' ? '' : targetChar
            }

            const inner = innerElRef.current
            if (inner) {
              inner.style.transition = `transform ${FLIP_DURATION}ms ease-in-out`
              inner.style.transform = 'perspective(400px) rotateX(-8deg)'
              setTimeout(() => {
                inner.style.transform = ''
                setTimeout(() => {
                  inner.style.transition = ''
                  tileElRef.current?.classList.remove('scrambling')
                  currentCharRef.current = targetChar
                }, FLIP_DURATION)
              }, FLIP_DURATION / 2)
            }
          }
        }, 70)
      }, delay)
    }
  }))

  return (
    <div className="tile" ref={tileElRef}>
      <div className="tile-inner" ref={innerElRef}>
        <div className="tile-front" ref={frontElRef}>
          <span ref={frontSpanRef}></span>
        </div>
        <div className="tile-back">
          <span ref={backSpanRef}></span>
        </div>
      </div>
    </div>
  )
})

export default Tile
