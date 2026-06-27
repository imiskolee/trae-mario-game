import { useEffect, useRef } from 'react'
import { GameEngine } from '../game/engine/GameEngine'
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../game/renderer/SpriteSheet'

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = SCREEN_WIDTH * 3
    canvas.height = SCREEN_HEIGHT * 3

    engineRef.current = new GameEngine(canvas)
    engineRef.current.start()

    return () => {
      if (engineRef.current) {
        engineRef.current.stop()
      }
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className="flex items-center justify-center w-full h-full bg-black"
    >
      <canvas
        ref={canvasRef}
        className="border-4 border-gray-700 shadow-2xl"
        style={{
          imageRendering: 'pixelated',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      />
    </div>
  )
}
