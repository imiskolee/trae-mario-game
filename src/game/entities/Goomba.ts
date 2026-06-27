import { TILE_SIZE, SpriteKey } from '../renderer/SpriteSheet'
import { TileType, isSolidTile } from '../levels/Level1'
import { GRAVITY } from './Mario'

export type GoombaState = 'alive' | 'dead' | 'falling'

export class Goomba {
  x: number
  y: number
  vx: number = -0.8
  vy: number = 0
  width: number = 14
  height: number = 14
  state: GoombaState = 'alive'
  animFrame: number = 0
  animTimer: number = 0
  deadTimer: number = 0
  onGround: boolean = false

  constructor(x: number, y: number) {
    this.x = x + 1
    this.y = y + 2
  }

  update(tiles: TileType[][], dt: number = 1) {
    if (this.state === 'dead') {
      this.deadTimer += dt
      return
    }

    this.vy += GRAVITY * dt
    if (this.vy > 12) this.vy = 12

    this.moveX(this.vx * dt, tiles)
    this.moveY(this.vy * dt, tiles)

    if (this.state === 'alive') {
      this.animTimer += dt
      if (this.animTimer > 15) {
        this.animTimer = 0
        this.animFrame = (this.animFrame + 1) % 2
      }
    }
  }

  private moveX(dx: number, tiles: TileType[][]) {
    this.x += dx
    
    const tileLeft = Math.floor(this.x / TILE_SIZE)
    const tileRight = Math.floor((this.x + this.width - 1) / TILE_SIZE)
    const tileTop = Math.floor(this.y / TILE_SIZE)
    const tileBottom = Math.floor((this.y + this.height - 1) / TILE_SIZE)

    for (let ty = tileTop; ty <= tileBottom; ty++) {
      for (let tx = tileLeft; tx <= tileRight; tx++) {
        if (ty >= 0 && ty < tiles.length && tx >= 0 && tx < tiles[0].length) {
          const tile = tiles[ty][tx]
          if (isSolidTile(tile)) {
            if (dx > 0) {
              this.x = tx * TILE_SIZE - this.width
            } else if (dx < 0) {
              this.x = (tx + 1) * TILE_SIZE
            }
            this.vx = -this.vx
            return
          }
        }
      }
    }
  }

  private moveY(dy: number, tiles: TileType[][]) {
    this.y += dy
    this.onGround = false
    
    const tileLeft = Math.floor(this.x / TILE_SIZE)
    const tileRight = Math.floor((this.x + this.width - 1) / TILE_SIZE)
    const tileTop = Math.floor(this.y / TILE_SIZE)
    const tileBottom = Math.floor((this.y + this.height - 1) / TILE_SIZE)

    for (let ty = tileTop; ty <= tileBottom; ty++) {
      for (let tx = tileLeft; tx <= tileRight; tx++) {
        if (ty >= 0 && ty < tiles.length && tx >= 0 && tx < tiles[0].length) {
          const tile = tiles[ty][tx]
          if (isSolidTile(tile)) {
            if (dy > 0) {
              this.y = ty * TILE_SIZE - this.height
              this.vy = 0
              this.onGround = true
            } else if (dy < 0) {
              this.y = (ty + 1) * TILE_SIZE
              this.vy = 0
            }
            return
          }
        }
      }
    }
  }

  getSprite(): SpriteKey {
    if (this.state === 'dead') {
      return 'goombaDead'
    }
    return this.animFrame === 0 ? 'goomba1' : 'goomba2'
  }

  stomp() {
    this.state = 'dead'
    this.vy = 0
    this.vx = 0
    this.deadTimer = 0
  }

  fallOffScreen() {
    this.state = 'falling'
  }

  isDead(): boolean {
    return this.state === 'dead' && this.deadTimer > 30
  }
}
