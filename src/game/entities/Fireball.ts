import { TILE_SIZE, SpriteKey } from '../renderer/SpriteSheet'
import { TileType, isSolidTile } from '../levels/Level1'

export const FIREBALL_GRAVITY = 0.35
export const FIREBOUNCE_FORCE = -4
export const FIREBALL_SPEED = 4.5

export class Fireball {
  x: number
  y: number
  vx: number
  vy: number = 0
  width: number = 8
  height: number = 8
  animFrame: number = 0
  animTimer: number = 0
  dead: boolean = false
  bounces: number = 0
  maxBounces: number = 6

  constructor(x: number, y: number, direction: 'left' | 'right') {
    this.x = x
    this.y = y
    this.vx = direction === 'right' ? FIREBALL_SPEED : -FIREBALL_SPEED
  }

  update(tiles: TileType[][], dt: number = 1) {
    if (this.dead) return

    this.vy += FIREBALL_GRAVITY * dt
    if (this.vy > 8) this.vy = 8

    this.moveX(this.vx * dt, tiles)
    this.moveY(this.vy * dt, tiles)

    this.animTimer += dt
    if (this.animTimer > 3) {
      this.animTimer = 0
      this.animFrame = (this.animFrame + 1) % 4
    }

    if (this.bounces > this.maxBounces) {
      this.dead = true
    }

    if (this.y > 15 * TILE_SIZE || this.x < 0 || this.x > 228 * TILE_SIZE) {
      this.dead = true
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
            this.dead = true
            return
          }
        }
      }
    }
  }

  private moveY(dy: number, tiles: TileType[][]) {
    this.y += dy

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
              this.vy = FIREBOUNCE_FORCE
              this.bounces++
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
    const frames: SpriteKey[] = ['fireball1', 'fireball2', 'fireball3', 'fireball4']
    return frames[this.animFrame]
  }

  isDead(): boolean {
    return this.dead
  }
}
