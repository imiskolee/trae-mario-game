import { TILE_SIZE, SpriteKey } from '../renderer/SpriteSheet'
import { InputManager } from '../engine/InputManager'
import { TileType, isSolidTile, isQuestionBlock, isBrick } from '../levels/Level1'

export const GRAVITY = 0.45
export const JUMP_FORCE = -7.5
export const MOVE_ACCEL = 0.35
export const MAX_SPEED = 2.5
export const FRICTION = 0.25
export const SMALL_MARIO_WIDTH = 12
export const SMALL_MARIO_HEIGHT = 15
export const BIG_MARIO_WIDTH = 14
export const BIG_MARIO_HEIGHT = 22

export type MarioState = 'idle' | 'walking' | 'jumping' | 'falling' | 'dead' | 'crouch'
export type MarioSize = 'small' | 'big' | 'fire'

export interface HeadBump {
  type: 'question' | 'brick'
  x: number
  y: number
}

export interface MarioUpdateResult {
  shooting: boolean
  headBump: HeadBump | null
  jumped: boolean  // 本帧是否触发了跳跃
}

export class Mario {
  x: number
  y: number
  vx: number = 0
  vy: number = 0
  width: number = SMALL_MARIO_WIDTH
  height: number = SMALL_MARIO_HEIGHT
  facing: 'left' | 'right' = 'right'
  state: MarioState = 'idle'
  size: MarioSize = 'small'
  animFrame: number = 0
  animTimer: number = 0
  onGround: boolean = false
  jumpHeld: boolean = false
  jumpTime: number = 0
  maxJumpTime: number = 18
  invincible: boolean = false
  invincibleTimer: number = 0
  // 星星无敌（吐火球）
  starPowered: boolean = false
  starTimer: number = 0

  // 跳跃缓冲和土狼时间
  private coyoteTime: number = 0
  private coyoteMax: number = 6
  private jumpBuffer: number = 0
  private jumpBufferMax: number = 8
  // 火球发射冷却
  private fireCooldown: number = 0
  private fireCooldownMax: number = 12
  // 受伤后短暂无敌
  private hurtInvincible: boolean = false
  private hurtInvincibleTimer: number = 0

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  get canShoot(): boolean {
    return this.size === 'fire' && this.fireCooldown <= 0
  }

  update(input: InputManager, tiles: TileType[][], dt: number = 1): MarioUpdateResult {
    if (this.state === 'dead') {
      this.vy += GRAVITY
      this.y += this.vy
      return { shooting: false, headBump: null, jumped: false }
    }

    const movingLeft = input.isPressed('left')
    const movingRight = input.isPressed('right')
    const jumping = input.isPressed('jump')
    // run键仅用于发射火球，不再影响移动速度
    const shooting = input.wasJustPressed('run')
    const crouching = input.isPressed('down') && this.onGround && this.size !== 'small'
    const maxSpeed = MAX_SPEED

    if (crouching) {
      this.state = 'crouch'
      this.vx = 0
    } else {
      if (movingLeft && !movingRight) {
        this.vx -= MOVE_ACCEL * dt
        this.facing = 'left'
      } else if (movingRight && !movingLeft) {
        this.vx += MOVE_ACCEL * dt
        this.facing = 'right'
      } else {
        if (this.vx > 0) {
          this.vx = Math.max(0, this.vx - FRICTION * dt)
        } else if (this.vx < 0) {
          this.vx = Math.min(0, this.vx + FRICTION * dt)
        }
      }

      this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx))
    }

    // 跳跃缓冲：记录按键按下
    if (input.wasJustPressed('jump')) {
      this.jumpBuffer = this.jumpBufferMax
    }
    if (this.jumpBuffer > 0) {
      this.jumpBuffer -= dt
    }

    // 土狼时间：离开地面后仍有几帧可以跳
    if (this.onGround) {
      this.coyoteTime = this.coyoteMax
    } else if (this.coyoteTime > 0) {
      this.coyoteTime -= dt
    }

    // 执行跳跃：缓冲期内 + 土狼时间内都可以跳
    let jumped = false
    if (this.jumpBuffer > 0 && this.coyoteTime > 0 && !crouching) {
      // 大马里奥跳得略高一点
      const jumpForce = this.size === 'small' ? JUMP_FORCE : JUMP_FORCE - 0.5
      this.vy = jumpForce
      this.onGround = false
      this.jumpHeld = true
      this.jumpTime = 0
      this.state = 'jumping'
      this.jumpBuffer = 0
      this.coyoteTime = 0
      jumped = true
    }

    // 可变跳跃高度：松开按键后减速上升
    if (jumping && this.jumpHeld && this.jumpTime < this.maxJumpTime && this.vy < 0) {
      this.vy -= 0.22 * dt
      this.jumpTime += dt
    } else {
      this.jumpHeld = false
    }

    // 重力
    this.vy += GRAVITY * dt
    if (this.vy > 11) this.vy = 11

    this.moveX(this.vx * dt, tiles)
    const bump = this.moveY(this.vy * dt, tiles)

    if (this.fireCooldown > 0) this.fireCooldown -= dt

    if (this.onGround) {
      if (crouching) {
        this.state = 'crouch'
      } else if (Math.abs(this.vx) > 0.3) {
        this.state = 'walking'
        this.animTimer += Math.abs(this.vx) * dt
        if (this.animTimer > 5) {
          this.animTimer = 0
          this.animFrame = (this.animFrame + 1) % 3
        }
      } else {
        this.state = 'idle'
        this.animFrame = 0
      }
    } else {
      if (this.vy < 0) {
        this.state = 'jumping'
      } else {
        this.state = 'falling'
      }
    }

    if (this.invincible) {
      this.invincibleTimer -= dt
      if (this.invincibleTimer <= 0) {
        this.invincible = false
      }
    }
    if (this.hurtInvincible) {
      this.hurtInvincibleTimer -= dt
      if (this.hurtInvincibleTimer <= 0) {
        this.hurtInvincible = false
      }
    }
    if (this.starPowered) {
      this.starTimer -= dt
      if (this.starTimer <= 0) {
        this.starPowered = false
      }
    }

    return { shooting, headBump: bump, jumped }
  }

  // 发射火球
  shoot(): { x: number; y: number; direction: 'left' | 'right' } | null {
    if (!this.canShoot) return null
    this.fireCooldown = this.fireCooldownMax
    const y = this.y + this.height / 2
    const x = this.facing === 'right' ? this.x + this.width : this.x - 8
    return { x, y, direction: this.facing }
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
            this.vx = 0
            return
          }
        }
      }
    }
  }

  private moveY(dy: number, tiles: TileType[][]): HeadBump | null {
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
              // 顶到问号块或砖块
              if (isQuestionBlock(tile)) {
                // 立即变为已使用状态，保持固体可站立
                tiles[ty][tx] = 10 // TILE.QUESTION_USED
                return { type: 'question', x: tx, y: ty }
              } else if (isBrick(tile)) {
                return { type: 'brick', x: tx, y: ty }
              }
            }
            return null
          }
        }
      }
    }
    return null
  }

  // 从外部调用：检测头顶上方方块（用于破砖块等额外处理）
  checkHeadBump(tiles: TileType[][]): HeadBump | null {
    const tileLeft = Math.floor(this.x / TILE_SIZE)
    const tileRight = Math.floor((this.x + this.width - 1) / TILE_SIZE)
    const headY = Math.floor((this.y - 1) / TILE_SIZE)
    for (let tx = tileLeft; tx <= tileRight; tx++) {
      if (headY >= 0 && headY < tiles.length && tx >= 0 && tx < tiles[0].length) {
        const tile = tiles[headY][tx]
        if (isQuestionBlock(tile)) {
          tiles[headY][tx] = -3
          return { type: 'question', x: tx, y: headY }
        } else if (isBrick(tile)) {
          return { type: 'brick', x: tx, y: headY }
        }
      }
    }
    return null
  }

  getSprite(): SpriteKey {
    const facing = this.facing === 'right' ? 'R' : 'L'
    const sizePrefix = this.size === 'small' ? 'small' : 'big'
    const firePrefix = this.size === 'fire' ? 'fire' : ''

    if (this.state === 'jumping' || this.state === 'falling') {
      const key = this.size === 'fire'
        ? `fireMarioJump${facing}`
        : `${sizePrefix}MarioJump${facing}`
      return key as SpriteKey
    }

    if (this.state === 'crouch') {
      const key = this.size === 'fire'
        ? `fireMarioCrouch${facing}`
        : `bigMarioCrouch${facing}`
      return key as SpriteKey
    }

    if (this.state === 'walking') {
      const frames = ['Walk1', 'Walk2', 'Walk3']
      const key = this.size === 'fire'
        ? `fireMario${frames[this.animFrame]}${facing}`
        : `${sizePrefix}Mario${frames[this.animFrame]}${facing}`
      return key as SpriteKey
    }

    const key = this.size === 'fire'
      ? `fireMarioIdle${facing}`
      : `${sizePrefix}MarioIdle${facing}`
    return key as SpriteKey
  }

  // 吃蘑菇长大
  grow() {
    if (this.size === 'small') {
      this.size = 'big'
      this.width = BIG_MARIO_WIDTH
      this.height = BIG_MARIO_HEIGHT
      // 调整y位置防止嵌入地面
      this.y -= (BIG_MARIO_HEIGHT - SMALL_MARIO_HEIGHT)
      this.invincible = true
      this.invincibleTimer = 30
    }
  }

  // 吃星星获得火球能力 + 无敌
  powerStar() {
    // 如果是小马里奥，先长大
    if (this.size === 'small') {
      this.y -= (BIG_MARIO_HEIGHT - SMALL_MARIO_HEIGHT)
      this.width = BIG_MARIO_WIDTH
      this.height = BIG_MARIO_HEIGHT
    }
    this.size = 'fire'
    this.starPowered = true
    this.starTimer = 600 // 10秒无敌
    this.invincible = true
    this.invincibleTimer = 600
  }

  // 受伤：大马里奥变小，小马里奥死亡
  takeDamage(): boolean {
    if (this.invincible || this.state === 'dead' || this.starPowered) return false
    if (this.size === 'small') {
      this.die()
      return true
    } else {
      // 大/火球马里奥变小
      this.size = 'small'
      this.y += (BIG_MARIO_HEIGHT - SMALL_MARIO_HEIGHT)
      this.width = SMALL_MARIO_WIDTH
      this.height = SMALL_MARIO_HEIGHT
      this.hurtInvincible = true
      this.hurtInvincibleTimer = 120
      this.invincible = true
      this.invincibleTimer = 120
      return false
    }
  }

  die() {
    if (this.invincible || this.state === 'dead') return
    this.state = 'dead'
    this.vy = -6
    this.vx = 0
  }

  reset(x: number, y: number) {
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
    this.state = 'idle'
    this.facing = 'right'
    this.onGround = false
    this.invincible = false
    this.invincibleTimer = 0
    this.starPowered = false
    this.starTimer = 0
    this.hurtInvincible = false
    this.hurtInvincibleTimer = 0
    this.size = 'small'
    this.width = SMALL_MARIO_WIDTH
    this.height = SMALL_MARIO_HEIGHT
    this.animFrame = 0
    this.animTimer = 0
    this.coyoteTime = 0
    this.jumpBuffer = 0
    this.jumpHeld = false
    this.fireCooldown = 0
  }

  // 渲染时是否闪烁（受伤无敌期间）
  isFlashing(): boolean {
    if (this.starPowered) {
      return Math.floor(this.starTimer / 4) % 2 === 0
    }
    if (this.hurtInvincible) {
      return Math.floor(this.hurtInvincibleTimer / 5) % 2 === 0
    }
    return false
  }
}
