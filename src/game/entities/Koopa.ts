import { TILE_SIZE, SpriteKey } from '../renderer/SpriteSheet'
import { TileType, isSolidTile } from '../levels/Level1'
import { GRAVITY } from './Mario'

// 乌龟状态：行走 / 静止壳 / 滑动壳 / 死亡（被火球或滑动壳撞）
export type KoopaState = 'walking' | 'shellIdle' | 'shellMoving' | 'dead'

export class Koopa {
  x: number
  y: number
  vx: number = -0.7
  vy: number = 0
  width: number = 14
  height: number = 22   // 行走状态高度（与大马里奥相近）
  state: KoopaState = 'walking'
  facing: 'left' | 'right' = 'left'
  animFrame: number = 0
  animTimer: number = 0
  deadTimer: number = 0
  onGround: boolean = false
  // 壳静止时被踩后短暂防止立即再次触发
  private shellCooldown: number = 0

  constructor(x: number, y: number) {
    this.x = x + 1
    this.y = y - 6  // 乌龟比蘑菇怪高，需要往上偏移
  }

  update(tiles: TileType[][], dt: number = 1) {
    if (this.state === 'dead') {
      this.deadTimer += dt
      this.vy += GRAVITY * dt
      this.y += this.vy * dt
      return
    }

    if (this.shellCooldown > 0) this.shellCooldown -= dt

    // 壳静止时不移动，只应用重力
    if (this.state === 'shellIdle') {
      this.vy += GRAVITY * dt
      if (this.vy > 12) this.vy = 12
      this.moveY(this.vy * dt, tiles)
      return
    }

    // 行走或滑动壳
    this.vy += GRAVITY * dt
    if (this.vy > 12) this.vy = 12

    if (this.vx > 0) this.facing = 'right'
    else if (this.vx < 0) this.facing = 'left'

    this.moveX(this.vx * dt, tiles)
    this.moveY(this.vy * dt, tiles)

    if (this.state === 'walking') {
      this.animTimer += dt
      if (this.animTimer > 12) {
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

    // 边缘检测：行走状态下前方无地面则转向（防止掉下平台）
    if (this.state === 'walking' && this.onGround) {
      const aheadX = this.vx > 0 ? this.x + this.width + 1 : this.x - 1
      const footY = this.y + this.height + 1
      const tx = Math.floor(aheadX / TILE_SIZE)
      const ty = Math.floor(footY / TILE_SIZE)
      if (ty >= 0 && ty < tiles.length && tx >= 0 && tx < tiles[0].length) {
        if (!isSolidTile(tiles[ty][tx])) {
          this.vx = -this.vx
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
      return 'koopaShell'  // 死亡用壳精灵（翻转或淡出）
    }
    if (this.state === 'shellIdle' || this.state === 'shellMoving') {
      return 'koopaShell'
    }
    // 行走状态：根据方向和动画帧
    const base = this.facing === 'right' ? 'koopaWalkR' : 'koopaWalkL'
    return this.animFrame === 0 ? base : (base === 'koopaWalkR' ? 'koopaWalk2R' : 'koopaWalk2L') as SpriteKey
  }

  // 被踩：行走→壳静止；壳静止→壳滑动；壳滑动→壳静止
  stomp(marioX: number) {
    if (this.state === 'walking') {
      this.state = 'shellIdle'
      this.vx = 0
      this.shellCooldown = 10
      // 缩小高度为壳
      this.height = 14
      this.y += 8  // 调整y使壳贴地
    } else if (this.state === 'shellIdle') {
      if (this.shellCooldown > 0) return
      // 变为滑动壳，方向远离马里奥
      this.state = 'shellMoving'
      const dir = this.x + this.width / 2 < marioX ? -1 : 1
      this.vx = dir * 4
    } else if (this.state === 'shellMoving') {
      // 滑动壳被踩：停下
      this.state = 'shellIdle'
      this.vx = 0
      this.shellCooldown = 10
    }
  }

  // 被火球或滑动壳撞击：直接死亡（飞出屏幕）
  kill() {
    this.state = 'dead'
    this.vy = -6
    this.vx = 0
    this.deadTimer = 0
  }

  // 星星无敌：直接死亡
  starKill() {
    this.state = 'dead'
    this.vy = -6
    this.deadTimer = 0
  }

  isDead(): boolean {
    return this.state === 'dead' && this.deadTimer > 60
  }

  // 是否会伤害马里奥
  isDangerous(): boolean {
    return this.state === 'walking' || this.state === 'shellMoving'
  }

  // 是否可被踩（包括壳的交互）
  isStompable(): boolean {
    return this.state !== 'dead'
  }
}
