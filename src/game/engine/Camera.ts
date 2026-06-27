import { SCREEN_WIDTH, TILE_SIZE } from '../renderer/SpriteSheet'
import { LEVEL_WIDTH } from '../levels/Level1'

export class Camera {
  x: number = 0
  y: number = 0
  targetX: number = 0
  targetY: number = 0

  private levelWidth: number
  private levelHeight: number

  constructor(levelWidth: number, levelHeight: number) {
    this.levelWidth = levelWidth * TILE_SIZE
    this.levelHeight = levelHeight * TILE_SIZE
  }

  follow(targetX: number, targetY: number) {
    const screenLeftBound = SCREEN_WIDTH * 0.35
    const screenRightBound = SCREEN_WIDTH * 0.65
    
    let newX = this.x
    
    if (targetX - this.x > screenRightBound) {
      newX = targetX - screenRightBound
    } else if (targetX - this.x < screenLeftBound && this.x > 0) {
      newX = targetX - screenLeftBound
    }
    
    newX = Math.max(0, Math.min(newX, this.levelWidth - SCREEN_WIDTH))
    
    this.x = newX
    this.y = 0
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: Math.floor(worldX - this.x),
      y: Math.floor(worldY - this.y),
    }
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX + this.x,
      y: screenY + this.y,
    }
  }

  reset() {
    this.x = 0
    this.y = 0
  }
}
