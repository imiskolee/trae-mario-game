import { TILE_SIZE, SpriteKey } from '../renderer/SpriteSheet'
import { TileType, isSolidTile } from '../levels/Level1'
import { GRAVITY } from './Mario'

export type PowerUpType = 'mushroom' | 'star'
export type PowerUpState = 'spawning' | 'moving' | 'collected'

export class PowerUp {
  x: number
  y: number
  vx: number = 0
  vy: number = 0
  width: number = 14
  height: number = 14
  type: PowerUpType
  state: PowerUpState = 'spawning'
  animFrame: number = 0
  animTimer: number = 0
  spawnOffset: number = 0
  private spawnTargetY: number
  onGround: boolean = false

  constructor(x: number, y: number, type: PowerUpType) {
    this.x = x + 1
    this.y = y
    this.type = type
    this.spawnTargetY = y - TILE_SIZE
    // 蘑菇向右移动，星星也向右
    this.vx = type === 'mushroom' ? 1.2 : 1.8
  }

  update(tiles: TileType[][], dt: number = 1) {
    if (this.state === 'spawning') {
      // 从问号块中升起
      this.spawnOffset += 0.5 * dt
      this.y = this.spawnTargetY + (TILE_SIZE - this.spawnOffset)
      if (this.spawnOffset >= TILE_SIZE) {
        this.y = this.spawnTargetY
        this.state = 'moving'
      }
      return
    }

    if (this.state === 'collected') return

    // 星星会跳跃
    if (this.type === 'star') {
      if (this.onGround) {
        this.vy = -6
        this.onGround = false
      }
    }

    this.vy += GRAVITY * dt
    if (this.vy > 10) this.vy = 10

    this.moveX(this.vx * dt, tiles)
    this.moveY(this.vy * dt, tiles)

    // 动画
    this.animTimer += dt
    if (this.animTimer > 6) {
      this.animTimer = 0
      this.animFrame = (this.animFrame + 1) % 4
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
    if (this.type === 'mushroom') {
      return 'mushroomItem'
    }
    // 星星动画4帧
    const frames: SpriteKey[] = ['star1', 'star2', 'star3', 'star4']
    return frames[this.animFrame]
  }

  collect() {
    this.state = 'collected'
  }

  isCollected(): boolean {
    return this.state === 'collected'
  }

  // 掉出屏幕
  isOffScreen(): boolean {
    return this.y > 15 * TILE_SIZE
  }
}
