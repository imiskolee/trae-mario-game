import { SpriteKey } from '../renderer/SpriteSheet'

export type CoinState = 'idle' | 'collected'

export class Coin {
  x: number
  y: number
  width: number = 16
  height: number = 16
  state: CoinState = 'idle'
  animFrame: number = 0
  animTimer: number = 0
  collectedTimer: number = 0

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  update(dt: number = 1) {
    if (this.state === 'collected') {
      this.collectedTimer += dt
      this.y -= 2 * dt
      return
    }

    this.animTimer += dt
    if (this.animTimer > 8) {
      this.animTimer = 0
      this.animFrame = (this.animFrame + 1) % 4
    }
  }

  getSprite(): SpriteKey {
    const frames = ['coin1', 'coin2', 'coin3', 'coin4']
    return frames[this.animFrame] as SpriteKey
  }

  collect() {
    if (this.state === 'collected') return
    this.state = 'collected'
    this.collectedTimer = 0
  }

  isCollected(): boolean {
    return this.state === 'collected' && this.collectedTimer > 30
  }
}
