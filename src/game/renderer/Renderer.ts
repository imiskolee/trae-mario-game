import { TILE_SIZE, SCREEN_WIDTH, SCREEN_HEIGHT, COLORS, getSprite, SpriteKey } from './SpriteSheet'
import { Camera } from '../engine/Camera'
import { TileType, TILE, BackgroundElement } from '../levels/Level1'
import { Mario } from '../entities/Mario'
import { Goomba } from '../entities/Goomba'
import { Coin } from '../entities/Coin'
import { PowerUp } from '../entities/PowerUp'
import { Fireball } from '../entities/Fireball'

export class Renderer {
  private ctx: CanvasRenderingContext2D
  private offscreenCanvas: HTMLCanvasElement
  offscreenCtx: CanvasRenderingContext2D

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
    this.offscreenCanvas = document.createElement('canvas')
    this.offscreenCanvas.width = SCREEN_WIDTH
    this.offscreenCanvas.height = SCREEN_HEIGHT
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!
    this.offscreenCtx.imageSmoothingEnabled = false
    this.ctx.imageSmoothingEnabled = false
  }

  clear() {
    this.offscreenCtx.fillStyle = COLORS.sky
    this.offscreenCtx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
  }

  drawBackground(elements: BackgroundElement[], camera: Camera) {
    // 地面顶部y坐标（像素）
    const groundTopY = 13 * TILE_SIZE

    for (const elem of elements) {
      const parallaxX = elem.x * TILE_SIZE - camera.x * 0.5

      if (parallaxX < -TILE_SIZE * 3 || parallaxX > SCREEN_WIDTH + TILE_SIZE) {
        continue
      }

      let sprite: SpriteKey
      switch (elem.type) {
        case 'cloudBig': sprite = 'cloudBig'; break
        case 'cloudSmall': sprite = 'cloudSmall'; break
        case 'hillBig': sprite = 'hillBig'; break
        case 'hillSmall': sprite = 'hillSmall'; break
        case 'bush': sprite = 'bush'; break
        default: continue
      }

      const spr = getSprite(sprite)
      let parallaxY: number
      if (elem.type === 'cloudBig' || elem.type === 'cloudSmall') {
        // 云朵：用y坐标定位
        parallaxY = elem.y * TILE_SIZE
      } else {
        // 山丘和草丛：底部贴合地面
        parallaxY = groundTopY - spr.height
      }

      this.drawSprite(sprite, Math.floor(parallaxX), Math.floor(parallaxY))
    }
  }

  drawTiles(tiles: TileType[][], camera: Camera, brickBumps?: Map<string, { offset: number; timer: number; maxTimer: number }>) {
    const startTileX = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 1)
    const endTileX = Math.min(tiles[0].length, Math.ceil((camera.x + SCREEN_WIDTH) / TILE_SIZE) + 1)
    const startTileY = 0
    const endTileY = tiles.length

    for (let y = startTileY; y < endTileY; y++) {
      for (let x = startTileX; x < endTileX; x++) {
        const tile = tiles[y][x]
        if (tile === TILE.EMPTY || tile === TILE.COIN || tile === TILE.MARIO_START || tile === TILE.GOOMBA ||
            tile === TILE.HILL || tile === TILE.CLOUD1 || tile === TILE.CLOUD2 || tile === TILE.BUSH ||
            tile === TILE.FLAG_POLE || tile === TILE.CASTLE) {
          continue
        }

        const screenX = x * TILE_SIZE - camera.x
        let screenY = y * TILE_SIZE

        // 砖块弹起动画偏移
        if (brickBumps && tile === TILE.BRICK) {
          const bump = brickBumps.get(`${x},${y}`)
          if (bump) {
            screenY += bump.offset
          }
        }

        let sprite: SpriteKey | null = null
        switch (tile) {
          case TILE.GROUND: sprite = 'ground'; break
          case TILE.BRICK: sprite = 'brick'; break
          case TILE.QUESTION: sprite = 'question'; break
          case TILE.QUESTION_USED: sprite = 'questionUsed'; break
          case TILE.PIPE_TOP_LEFT: sprite = 'pipeTopLeft'; break
          case TILE.PIPE_TOP_RIGHT: sprite = 'pipeTopRight'; break
          case TILE.PIPE_BODY_LEFT: sprite = 'pipeBodyLeft'; break
          case TILE.PIPE_BODY_RIGHT: sprite = 'pipeBodyRight'; break
        }

        if (sprite) {
          this.drawSprite(sprite, Math.floor(screenX), Math.floor(screenY))
        }
      }
    }
  }

  drawFlag(flagX: number, flagY: number, camera: Camera, flagOffsetY: number = 0) {
    const screenX = flagX * TILE_SIZE - camera.x
    const screenY = flagY * TILE_SIZE

    // 旗杆
    for (let y = 0; y < 9; y++) {
      this.drawSprite('flagPole', Math.floor(screenX), Math.floor(screenY + y * TILE_SIZE))
    }

    // 旗帜（根据offsetY下移）
    this.drawSprite('flag', Math.floor(screenX - 12), Math.floor(screenY + 2 + flagOffsetY))
  }

  drawCastle(castleX: number, castleY: number, camera: Camera) {
    // castle精灵本身已是80x80的完整城堡，直接绘制一次
    const screenX = castleX * TILE_SIZE - camera.x
    const screenY = castleY * TILE_SIZE
    this.drawSprite('castle', Math.floor(screenX), Math.floor(screenY))
  }

  drawMario(mario: Mario, camera: Camera) {
    const screenPos = camera.worldToScreen(mario.x, mario.y)

    // 闪烁效果（受伤无敌或星星无敌时）
    if (mario.isFlashing()) {
      return
    }

    // 根据马里奥大小计算精灵偏移
    // 小马里奥: 16宽精灵, 12宽碰撞箱 -> 偏移-2居中
    // 大/火马里奥: 16宽精灵, 14宽碰撞箱 -> 偏移-1居中
    const offsetX = mario.size === 'small' ? -2 : -1
    this.drawSprite(mario.getSprite(), screenPos.x + offsetX, screenPos.y)
  }

  drawGoomba(goomba: Goomba, camera: Camera) {
    const screenPos = camera.worldToScreen(goomba.x, goomba.y)
    this.drawSprite(goomba.getSprite(), screenPos.x, screenPos.y)
  }

  drawCoin(coin: Coin, camera: Camera) {
    const screenPos = camera.worldToScreen(coin.x, coin.y)

    if (coin.state === 'collected') {
      const alpha = Math.max(0, 1 - coin.collectedTimer / 30)
      this.offscreenCtx.globalAlpha = alpha
    }

    this.drawSprite(coin.getSprite(), screenPos.x, screenPos.y)
    this.offscreenCtx.globalAlpha = 1
  }

  drawPowerUp(powerUp: PowerUp, camera: Camera) {
    const screenPos = camera.worldToScreen(powerUp.x, powerUp.y)
    this.drawSprite(powerUp.getSprite(), screenPos.x, screenPos.y)
  }

  drawFireball(fireball: Fireball, camera: Camera) {
    const screenPos = camera.worldToScreen(fireball.x, fireball.y)
    this.drawSprite(fireball.getSprite(), screenPos.x, screenPos.y)
  }

  drawSprite(key: SpriteKey, x: number, y: number) {
    const sprite = getSprite(key)
    this.offscreenCtx.drawImage(sprite, x, y)
  }

  drawText(text: string, x: number, y: number, size: number = 8, color: string = '#FFF') {
    this.offscreenCtx.font = `bold ${size}px "Courier New", monospace`
    this.offscreenCtx.fillStyle = '#000'
    this.offscreenCtx.fillText(text, x + 1, y + 1)
    this.offscreenCtx.fillStyle = color
    this.offscreenCtx.fillText(text, x, y)
  }

  present() {
    this.ctx.imageSmoothingEnabled = false
    this.ctx.drawImage(
      this.offscreenCanvas,
      0, 0, SCREEN_WIDTH, SCREEN_HEIGHT,
      0, 0, this.ctx.canvas.width, this.ctx.canvas.height
    )
  }

  get width() {
    return SCREEN_WIDTH
  }

  get height() {
    return SCREEN_HEIGHT
  }
}
