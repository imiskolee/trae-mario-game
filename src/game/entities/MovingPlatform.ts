import { TILE_SIZE, SpriteKey } from '../renderer/SpriteSheet'

export type PlatformAxis = 'horizontal' | 'vertical'

// 移动平台：沿水平或垂直轴来回移动
export class MovingPlatform {
  x: number
  y: number
  width: number
  height: number = 8       // 平台厚度（像素）
  vx: number = 0
  vy: number = 0
  axis: PlatformAxis
  private minX: number     // 水平移动范围
  private maxX: number
  private minY: number     // 垂直移动范围
  private maxY: number
  private speed: number
  private dir: 1 | -1 = 1  // 当前方向

  constructor(x: number, y: number, width: number, range: number, axis: PlatformAxis, speed: number = 0.8) {
    this.x = x
    this.y = y
    this.width = width
    this.height = 8
    this.axis = axis
    this.speed = speed
    if (axis === 'horizontal') {
      this.minX = x
      this.maxX = x + range
      this.minY = y
      this.maxY = y
      this.vx = speed
      this.vy = 0
    } else {
      this.minX = x
      this.maxX = x
      this.minY = y
      this.maxY = y + range
      this.vx = 0
      this.vy = speed
    }
  }

  update() {
    if (this.axis === 'horizontal') {
      this.x += this.vx * this.dir
      if (this.x <= this.minX) {
        this.x = this.minX
        this.dir = 1
      } else if (this.x >= this.maxX) {
        this.x = this.maxX
        this.dir = -1
      }
    } else {
      this.y += this.vy * this.dir
      if (this.y <= this.minY) {
        this.y = this.minY
        this.dir = 1
      } else if (this.y >= this.maxY) {
        this.y = this.maxY
        this.dir = -1
      }
    }
  }

  getSprite(): SpriteKey {
    return 'movingPlatform'
  }

  // 本帧位移（供马里奥跟随平台用）
  getDeltaX(): number {
    return this.axis === 'horizontal' ? this.vx * this.dir : 0
  }

  getDeltaY(): number {
    return this.axis === 'vertical' ? this.vy * this.dir : 0
  }

  // AABB 碰撞箱
  get bounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height }
  }
}
