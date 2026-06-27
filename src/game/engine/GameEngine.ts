import { Renderer } from '../renderer/Renderer'
import { InputManager } from './InputManager'
import { Camera } from './Camera'
import { Mario } from '../entities/Mario'
import { Goomba } from '../entities/Goomba'
import { Koopa } from '../entities/Koopa'
import { Coin } from '../entities/Coin'
import { PowerUp, PowerUpType } from '../entities/PowerUp'
import { Fireball } from '../entities/Fireball'
import { MovingPlatform } from '../entities/MovingPlatform'
import { LEVEL_HEIGHT, TILE, TileType, TILE_SIZE } from '../levels/Level1'
import { LEVELS, LevelData, TOTAL_LEVELS, createPlatforms } from '../levels/levels'
import { SpriteKey } from '../renderer/SpriteSheet'
import { useGameStore, GameState } from '../../store/useGameStore'
import { sound } from './SoundManager'

export class GameEngine {
  private renderer: Renderer
  private input: InputManager
  private camera: Camera
  private mario!: Mario
  private goombas: Goomba[] = []
  private koopas: Koopa[] = []
  private coins: Coin[] = []
  private powerUps: PowerUp[] = []
  private fireballs: Fireball[] = []
  private platforms: MovingPlatform[] = []
  private tiles: TileType[][] = []
  private animationId: number = 0
  private lastTime: number = 0
  private accumulator: number = 0
  private readonly fixedDt: number = 1000 / 60
  private running: boolean = false
  private timeLeft: number = 400
  private timerInterval: number = 0
  private scorePopups: { x: number; y: number; text: string; timer: number }[] = []
  private marioStartX: number = 0
  private marioStartY: number = 0
  private deathTimer: number = 0
  private readonly maxFireballs: number = 2
  // 砖块弹起动画：key="x,y", value={offset, timer, maxTimer}
  private brickBumps: Map<string, { offset: number; timer: number; maxTimer: number }> = new Map()
  // 降旗动画状态
  private flagAnimating: boolean = false
  private flagSlideY: number = 0  // 旗帜下落偏移（像素）
  private flagSlideTimer: number = 0
  private readonly flagSlideDuration: number = 90  // 1.5秒降旗
  private winTransitionTimer: number = 0
  // 当前关卡数据
  private currentLevelData: LevelData
  private levelWidth: number
  private levelHeight: number = LEVEL_HEIGHT

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')!
    this.renderer = new Renderer(ctx)
    this.input = new InputManager()
    // 初始化为第一关
    this.currentLevelData = LEVELS[0]
    this.levelWidth = this.currentLevelData.map[0].length
    this.camera = new Camera(this.levelWidth, this.levelHeight)
  }

  start() {
    this.loadLevel(useGameStore.getState().currentLevel)
    this.running = true
    this.lastTime = performance.now()
    this.accumulator = 0
    this.gameLoop()

    this.timerInterval = window.setInterval(() => {
      if (this.running && useGameStore.getState().gameState === 'playing') {
        this.timeLeft--
        useGameStore.getState().setTime(this.timeLeft)
        if (this.timeLeft <= 0) {
          this.mario.die()
        }
      }
    }, 1000)
  }

  // 加载指定关卡
  private loadLevel(levelIndex: number) {
    const idx = Math.max(0, Math.min(levelIndex, TOTAL_LEVELS - 1))
    this.currentLevelData = LEVELS[idx]
    this.levelWidth = this.currentLevelData.map[0].length
    this.camera = new Camera(this.levelWidth, this.levelHeight)
    useGameStore.getState().setWorld(this.currentLevelData.name)
    this.initLevel()
  }

  private initLevel() {
    // 深拷贝地图，避免修改原始关卡数据
    this.tiles = this.currentLevelData.map.map(row => [...row])
    this.goombas = []
    this.koopas = []
    this.coins = []
    this.powerUps = []
    this.fireballs = []
    this.scorePopups = []
    this.brickBumps.clear()
    this.flagAnimating = false
    this.flagSlideY = 0
    this.flagSlideTimer = 0
    this.winTransitionTimer = 0
    this.timeLeft = 400
    this.camera.reset()
    // 从关卡数据创建移动平台
    this.platforms = createPlatforms(this.currentLevelData.platforms)

    for (let y = 0; y < this.tiles.length; y++) {
      for (let x = 0; x < this.tiles[y].length; x++) {
        const tile = this.tiles[y][x]

        if (tile === TILE.MARIO_START) {
          this.mario = new Mario(x * TILE_SIZE, (y - 1) * TILE_SIZE)
          this.marioStartX = x * TILE_SIZE
          this.marioStartY = (y - 1) * TILE_SIZE
          this.tiles[y][x] = TILE.EMPTY
        }

        if (tile === TILE.GOOMBA) {
          this.goombas.push(new Goomba(x * TILE_SIZE, (y - 1) * TILE_SIZE))
          this.tiles[y][x] = TILE.EMPTY
        }

        if (tile === TILE.KOOPA) {
          this.koopas.push(new Koopa(x * TILE_SIZE, (y - 1) * TILE_SIZE))
          this.tiles[y][x] = TILE.EMPTY
        }

        if (tile === TILE.COIN) {
          this.coins.push(new Coin(x * TILE_SIZE, y * TILE_SIZE))
          this.tiles[y][x] = TILE.EMPTY
        }
      }
    }
  }

  private gameLoop = (currentTime?: number) => {
    if (!this.running) return
    
    const now = currentTime || performance.now()
    let frameTime = now - this.lastTime
    this.lastTime = now
    
    if (frameTime > 250) frameTime = 250
    
    this.accumulator += frameTime
    
    const state = useGameStore.getState().gameState
    
    while (this.accumulator >= this.fixedDt) {
      if (state === 'playing') {
        this.update()
      } else if (state === 'menu') {
        if (this.input.wasJustPressed('jump')) {
          // 首次交互：初始化音频上下文（浏览器策略要求）
          sound.init()
          sound.button()
          sound.startMusic()
          useGameStore.getState().setGameState('playing')
          this.resetLevel()
        }
      } else if (state === 'gameover') {
        if (this.input.wasJustPressed('jump')) {
          sound.button()
          useGameStore.getState().resetGame()
          this.loadLevel(0)
          sound.startMusic()
        }
      } else if (state === 'win') {
        if (this.input.wasJustPressed('jump')) {
          sound.button()
          useGameStore.getState().resetGame()
          this.loadLevel(0)
          sound.startMusic()
        }
      } else if (state === 'levelComplete') {
        // 关卡完成：等待玩家按键进入下一关
        if (this.input.wasJustPressed('jump')) {
          sound.button()
          const store = useGameStore.getState()
          if (store.currentLevel >= TOTAL_LEVELS - 1) {
            // 已是最后一关，全部通关
            store.setGameState('win')
            sound.gameWin()
          } else {
            store.nextLevel()
            this.loadLevel(store.currentLevel)
            sound.startMusic()
          }
        }
      }

      this.input.update()
      this.accumulator -= this.fixedDt
    }
    
    this.render(state)
    
    this.animationId = requestAnimationFrame(this.gameLoop)
  }

  private update() {
    // 判断是否在自动控制模式（降旗动画或走向城堡）
    const inFlagSlide = this.flagAnimating
    const inWalkToCastle = !this.flagAnimating && this.flagSlideTimer >= this.flagSlideDuration
    const autoControl = inFlagSlide || inWalkToCastle

    if (autoControl) {
      // 自动控制模式：不处理玩家输入
      if (inFlagSlide) {
        // 降旗中：马里奥沿旗杆下滑
        this.mario.vx = 0
        this.mario.facing = 'right'
        const slideSpeed = 2
        this.mario.y += slideSpeed
        this.mario.vy = slideSpeed
        // 限制不超过地面（地面顶部在第13行）
        const groundY = 13 * TILE_SIZE - this.mario.height
        if (this.mario.y > groundY) {
          this.mario.y = groundY
          this.mario.vy = 0
          this.mario.onGround = true
        }
      } else {
        // 走向城堡：强制向右走
        this.mario.vx = 1.5
        this.mario.facing = 'right'
        this.mario.vy += 0.45
        if (this.mario.vy > 11) this.mario.vy = 11
        this.mario.x += this.mario.vx
        this.mario.y += this.mario.vy
        // 地面检测（地面顶部在第13行）
        const groundY = 13 * TILE_SIZE - this.mario.height
        if (this.mario.y > groundY) {
          this.mario.y = groundY
          this.mario.vy = 0
          this.mario.onGround = true
        }
        // 行走动画
        this.mario.state = 'walking'
        this.mario.animTimer += 1.5
        if (this.mario.animTimer > 5) {
          this.mario.animTimer = 0
          this.mario.animFrame = (this.mario.animFrame + 1) % 3
        }
      }
    } else {
      const result = this.mario.update(this.input, this.tiles)

      // 跳跃音效
      if (result.jumped) {
        if (this.mario.size === 'small') {
          sound.jump()
        } else {
          sound.bigJump()
        }
      }

      // 处理头顶撞击问号块/砖块
      if (result.headBump) {
        this.handleHeadBump(result.headBump)
      }

      // 处理发射火球
      if (result.shooting) {
        if (this.spawnFireball()) {
          sound.fireball()
        }
      }
    }

    for (const goomba of this.goombas) {
      goomba.update(this.tiles)
    }

    for (const koopa of this.koopas) {
      koopa.update(this.tiles)
    }

    for (const coin of this.coins) {
      coin.update()
    }

    for (const powerUp of this.powerUps) {
      powerUp.update(this.tiles)
    }

    for (const fireball of this.fireballs) {
      fireball.update(this.tiles)
    }

    // 更新移动平台
    for (const platform of this.platforms) {
      platform.update()
    }

    if (!autoControl) {
      this.checkCollisions()
      this.handlePlatformRiding()
    }

    this.goombas = this.goombas.filter(g => !g.isDead())
    this.koopas = this.koopas.filter(k => !k.isDead())
    this.coins = this.coins.filter(c => !c.isCollected())
    this.powerUps = this.powerUps.filter(p => !p.isCollected() && !p.isOffScreen())
    this.fireballs = this.fireballs.filter(f => !f.isDead())

    this.scorePopups = this.scorePopups.filter(p => {
      p.timer--
      p.y -= 0.5
      return p.timer > 0
    })

    // 更新砖块弹起动画
    for (const [key, bump] of this.brickBumps) {
      bump.timer++
      const t = bump.timer / bump.maxTimer
      if (t >= 1) {
        this.brickBumps.delete(key)
      } else {
        bump.offset = -Math.sin(t * Math.PI) * 6
      }
    }

    this.camera.follow(this.mario.x + this.mario.width / 2, this.mario.y)

    // 深渊掉落检测：掉出关卡底部即死亡
    if (this.mario.state !== 'dead' && this.mario.y > LEVEL_HEIGHT * TILE_SIZE) {
      this.mario.die()
      useGameStore.getState().loseLife()
      this.deathTimer = 0
      sound.die()
      sound.stopMusic()
    }

    if (this.mario.state === 'dead') {
      this.deathTimer++
      if (this.deathTimer > 90) {
        this.handleMarioDeath()
      }
      return
    }

    // 触发降旗动画（使用当前关卡数据的旗杆位置）
    const flagX = this.currentLevelData.flagX
    const castleX = this.currentLevelData.castleX
    if (this.mario.x >= flagX * TILE_SIZE && !this.flagAnimating && this.flagSlideTimer === 0 && useGameStore.getState().gameState === 'playing') {
      this.flagAnimating = true
      this.mario.x = flagX * TILE_SIZE - 4
      sound.flagpole()
      sound.stopMusic()
    }

    if (this.flagAnimating) {
      this.flagSlideTimer++
      const progress = Math.min(1, this.flagSlideTimer / this.flagSlideDuration)
      this.flagSlideY = progress * 9 * TILE_SIZE

      if (this.flagSlideTimer >= this.flagSlideDuration) {
        this.flagAnimating = false
        this.winTransitionTimer = 0
      }
    }

    // 走向城堡并通关
    if (inWalkToCastle) {
      this.winTransitionTimer++
      if (this.mario.x >= (castleX - 1) * TILE_SIZE) {
        if (useGameStore.getState().gameState === 'playing') {
          useGameStore.getState().addScore(this.timeLeft * 50)
          // 判断是否还有下一关
          if (useGameStore.getState().currentLevel >= TOTAL_LEVELS - 1) {
            useGameStore.getState().setGameState('win')
            sound.gameWin()
          } else {
            useGameStore.getState().setGameState('levelComplete')
            sound.levelComplete()
          }
        }
      }
    }
  }

  // 处理头顶撞击方块
  private handleHeadBump(bump: { type: 'question' | 'brick'; x: number; y: number }) {
    if (bump.type === 'question') {
      sound.bump()
      // 问号块：检查是否掉落道具（使用当前关卡数据）
      const key = `${bump.x},${bump.y}`
      if (this.currentLevelData.powerupBlocks.has(key)) {
        // 生成蘑菇或星星（交替：偶数索引为蘑菇，奇数索引为星星）
        const blockList = Array.from(this.currentLevelData.powerupBlocks)
        const idx = blockList.indexOf(key)
        const isStar = idx % 2 === 1
        const powerType: PowerUpType = isStar ? 'star' : 'mushroom'
        this.powerUps.push(new PowerUp(bump.x * TILE_SIZE, bump.y * TILE_SIZE, powerType))
        sound.powerupAppear()
      } else {
        // 普通问号块：金币弹出动画 + 直接收集
        useGameStore.getState().addCoin()
        useGameStore.getState().addScore(200)
        this.addScorePopup(bump.x * TILE_SIZE, bump.y * TILE_SIZE - 8, '200')
        // 生成弹出金币动画（飞起后消失）
        const popCoin = new Coin(bump.x * TILE_SIZE, (bump.y - 1) * TILE_SIZE)
        popCoin.collect()
        this.coins.push(popCoin)
        sound.coin()
      }
    } else if (bump.type === 'brick') {
      // 砖块：大马里奥可以打碎，小马里奥只有弹起动画
      if (this.mario.size !== 'small') {
        this.tiles[bump.y][bump.x] = TILE.EMPTY
        useGameStore.getState().addScore(50)
        this.addScorePopup(bump.x * TILE_SIZE, bump.y * TILE_SIZE - 8, '50')
        sound.brickBreak()
      } else {
        // 小马里奥：砖块弹起动画
        const bumpKey = `${bump.x},${bump.y}`
        if (!this.brickBumps.has(bumpKey)) {
          this.brickBumps.set(bumpKey, { offset: 0, timer: 0, maxTimer: 12 })
        }
        sound.bump()
      }
    }
  }

  // 生成火球，返回是否成功发射
  private spawnFireball(): boolean {
    if (this.fireballs.length >= this.maxFireballs) return false
    const shot = this.mario.shoot()
    if (shot) {
      this.fireballs.push(new Fireball(shot.x, shot.y, shot.direction))
      return true
    }
    return false
  }

  private handleMarioDeath() {
    const state = useGameStore.getState()
    if (state.lives <= 0) {
      state.setGameState('gameover')
    } else {
      this.resetMarioPosition()
    }
  }

  private resetMarioPosition() {
    this.mario.reset(this.marioStartX, this.marioStartY)
    this.camera.reset()
    this.deathTimer = 0
    this.goombas = []
    this.koopas = []
    this.coins = []
    this.powerUps = []
    this.fireballs = []
    this.brickBumps.clear()
    this.flagAnimating = false
    this.flagSlideY = 0
    this.flagSlideTimer = 0
    this.winTransitionTimer = 0
    // 重新从当前关卡数据加载地图
    this.tiles = this.currentLevelData.map.map(row => [...row])
    // 重新创建移动平台
    this.platforms = createPlatforms(this.currentLevelData.platforms)

    for (let y = 0; y < this.tiles.length; y++) {
      for (let x = 0; x < this.tiles[y].length; x++) {
        const tile = this.tiles[y][x]
        if (tile === TILE.MARIO_START) {
          this.tiles[y][x] = TILE.EMPTY
        }
        if (tile === TILE.GOOMBA) {
          this.goombas.push(new Goomba(x * TILE_SIZE, (y - 1) * TILE_SIZE))
          this.tiles[y][x] = TILE.EMPTY
        }
        if (tile === TILE.KOOPA) {
          this.koopas.push(new Koopa(x * TILE_SIZE, (y - 1) * TILE_SIZE))
          this.tiles[y][x] = TILE.EMPTY
        }
        if (tile === TILE.COIN) {
          this.coins.push(new Coin(x * TILE_SIZE, y * TILE_SIZE))
          this.tiles[y][x] = TILE.EMPTY
        }
      }
    }
  }

  private checkCollisions() {
    if (this.mario.state === 'dead') return

    // 马里奥 vs 蘑菇怪
    for (const goomba of this.goombas) {
      if (goomba.state === 'dead') continue

      // 缩小蘑菇怪碰撞箱，让踩踏更容易
      const goombaHitbox = {
        x: goomba.x + 2,
        y: goomba.y + 2,
        width: goomba.width - 4,
        height: goomba.height - 2,
      }

      if (this.checkAABB(this.mario, goombaHitbox)) {
        const marioBottom = this.mario.y + this.mario.height
        const goombaCenter = goombaHitbox.y + goombaHitbox.height / 2

        // 踩踏判定：马里奥正在下落，且马里奥底部在蘑菇怪上半部分
        if (this.mario.vy >= -0.5 && marioBottom < goombaCenter + 4) {
          goomba.stomp()
          this.mario.vy = -6
          this.mario.onGround = false
          useGameStore.getState().addScore(100)
          this.addScorePopup(goomba.x, goomba.y - 8, '100')
          sound.stomp()
        } else if (this.mario.starPowered) {
          // 星星无敌：直接消灭
          goomba.stomp()
          useGameStore.getState().addScore(200)
          this.addScorePopup(goomba.x, goomba.y - 8, '200')
          sound.kick()
        } else {
          // 受伤：大马里奥变小，小马里奥死亡
          const died = this.mario.takeDamage()
          if (died) {
            useGameStore.getState().loseLife()
            this.deathTimer = 0
            sound.die()
            sound.stopMusic()
          } else {
            sound.hurt()
          }
        }
      }
    }

    // 马里奥 vs 金币
    for (const coin of this.coins) {
      if (coin.state === 'collected') continue

      if (this.checkAABB(this.mario, coin)) {
        coin.collect()
        useGameStore.getState().addCoin()
        useGameStore.getState().addScore(200)
        this.addScorePopup(coin.x, coin.y, '200')
        sound.coin()
      }
    }

    // 马里奥 vs 道具
    for (const powerUp of this.powerUps) {
      if (powerUp.isCollected() || powerUp.state !== 'moving') continue

      if (this.checkAABB(this.mario, powerUp)) {
        powerUp.collect()
        if (powerUp.type === 'mushroom') {
          this.mario.grow()
          useGameStore.getState().addScore(1000)
          this.addScorePopup(powerUp.x, powerUp.y - 8, '1000')
          sound.powerup()
        } else {
          // 星星：获得火球能力 + 无敌
          this.mario.powerStar()
          useGameStore.getState().addScore(1000)
          this.addScorePopup(powerUp.x, powerUp.y - 8, '1000')
          sound.star()
        }
      }
    }

    // 火球 vs 蘑菇怪
    for (const fireball of this.fireballs) {
      if (fireball.isDead()) continue
      for (const goomba of this.goombas) {
        if (goomba.state === 'dead') continue
        if (this.checkAABB(fireball, goomba)) {
          goomba.stomp()
          fireball.dead = true
          useGameStore.getState().addScore(200)
          this.addScorePopup(goomba.x, goomba.y - 8, '200')
          sound.kick()
          break
        }
      }
    }

    // 火球 vs 乌龟
    for (const fireball of this.fireballs) {
      if (fireball.isDead()) continue
      for (const koopa of this.koopas) {
        if (koopa.state === 'dead') continue
        if (this.checkAABB(fireball, koopa)) {
          koopa.kill()
          fireball.dead = true
          useGameStore.getState().addScore(200)
          this.addScorePopup(koopa.x, koopa.y - 8, '200')
          sound.kick()
          break
        }
      }
    }

    // 马里奥 vs 乌龟
    for (const koopa of this.koopas) {
      if (koopa.state === 'dead') continue
      if (!this.checkAABB(this.mario, koopa)) continue

      const marioBottom = this.mario.y + this.mario.height
      const koopaCenter = koopa.y + koopa.height / 2

      if (this.mario.starPowered) {
        // 星星无敌：直接消灭
        koopa.starKill()
        useGameStore.getState().addScore(200)
        this.addScorePopup(koopa.x, koopa.y - 8, '200')
        sound.kick()
        continue
      }

      // 踩踏判定：马里奥正在下落，且马里奥底部在乌龟上半部分
      if (this.mario.vy >= -0.5 && marioBottom < koopaCenter + 6) {
        koopa.stomp(this.mario.x + this.mario.width / 2)
        this.mario.vy = -6
        this.mario.onGround = false
        useGameStore.getState().addScore(100)
        this.addScorePopup(koopa.x, koopa.y - 8, '100')
        sound.stomp()
      } else if (koopa.state === 'shellIdle') {
        // 静止壳侧面接触：踢动它
        koopa.stomp(this.mario.x + this.mario.width / 2)
        useGameStore.getState().addScore(400)
        this.addScorePopup(koopa.x, koopa.y - 8, '400')
        sound.kick()
      } else if (koopa.isDangerous()) {
        // 行走或滑动壳：受伤
        const died = this.mario.takeDamage()
        if (died) {
          useGameStore.getState().loseLife()
          this.deathTimer = 0
          sound.die()
          sound.stopMusic()
        } else {
          sound.hurt()
        }
      }
    }

    // 滑动壳 vs 蘑菇怪（滑动壳可以消灭其他敌人）
    for (const koopa of this.koopas) {
      if (koopa.state !== 'shellMoving') continue
      for (const goomba of this.goombas) {
        if (goomba.state === 'dead') continue
        if (this.checkAABB(koopa, goomba)) {
          goomba.stomp()
          useGameStore.getState().addScore(200)
          this.addScorePopup(goomba.x, goomba.y - 8, '200')
          sound.kick()
        }
      }
      // 滑动壳 vs 其他乌龟（非自己）
      for (const other of this.koopas) {
        if (other === koopa || other.state === 'dead') continue
        if (this.checkAABB(koopa, other)) {
          other.kill()
          useGameStore.getState().addScore(200)
          this.addScorePopup(other.x, other.y - 8, '200')
          sound.kick()
        }
      }
    }
  }

  // 处理马里奥站在移动平台上
  private handlePlatformRiding() {
    if (this.mario.state === 'dead') return
    // 马里奥底部
    const marioBottom = this.mario.y + this.mario.height
    for (const platform of this.platforms) {
      const pb = platform.bounds
      // 水平重叠
      const overlapX = this.mario.x + this.mario.width > pb.x + 2 &&
                       this.mario.x < pb.x + pb.width - 2
      // 马里奥底部刚好在平台顶部附近（1像素容差）
      if (overlapX && marioBottom >= pb.y - 2 && marioBottom <= pb.y + 4 && this.mario.vy >= 0) {
        // 站在平台上
        this.mario.y = pb.y - this.mario.height
        this.mario.vy = 0
        this.mario.onGround = true
        // 跟随平台移动
        this.mario.x += platform.getDeltaX()
        // 垂直平台：跟随上下移动（已在上面设置y）
        break
      }
    }
  }

  private checkAABB(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): boolean {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y
  }

  private addScorePopup(x: number, y: number, text: string) {
    this.scorePopups.push({ x, y, text, timer: 60 })
  }

  private render(state: GameState) {
    this.renderer.clear()

    // 使用当前关卡数据的背景元素
    this.renderer.drawBackground(this.currentLevelData.background, this.camera)

    this.renderer.drawTiles(this.tiles, this.camera, this.brickBumps)

    // 旗杆和城堡使用当前关卡数据
    this.renderer.drawFlag(this.currentLevelData.flagX, 4, this.camera, this.flagSlideY)
    this.renderer.drawCastle(this.currentLevelData.castleX, this.currentLevelData.castleY, this.camera)

    for (const coin of this.coins) {
      this.renderer.drawCoin(coin, this.camera)
    }

    for (const powerUp of this.powerUps) {
      this.renderer.drawPowerUp(powerUp, this.camera)
    }

    for (const goomba of this.goombas) {
      this.renderer.drawGoomba(goomba, this.camera)
    }

    // 绘制乌龟
    for (const koopa of this.koopas) {
      const sprite = koopa.getSprite()
      const screenPos = this.camera.worldToScreen(koopa.x, koopa.y)
      this.renderer.drawSprite(sprite, Math.floor(screenPos.x), Math.floor(screenPos.y))
    }

    // 绘制移动平台
    for (const platform of this.platforms) {
      const sprite = platform.getSprite()
      const screenPos = this.camera.worldToScreen(platform.x, platform.y)
      this.renderer.drawSprite(sprite, Math.floor(screenPos.x), Math.floor(screenPos.y))
    }

    for (const fireball of this.fireballs) {
      this.renderer.drawFireball(fireball, this.camera)
    }

    this.renderer.drawMario(this.mario, this.camera)

    for (const popup of this.scorePopups) {
      const screenPos = this.camera.worldToScreen(popup.x, popup.y)
      const alpha = Math.min(1, popup.timer / 30)
      this.renderer.offscreenCtx.globalAlpha = alpha
      this.renderer.drawText(popup.text, screenPos.x, screenPos.y, 8)
      this.renderer.offscreenCtx.globalAlpha = 1
    }

    this.drawHUD()

    if (state === 'menu') {
      this.drawMenu()
    } else if (state === 'gameover') {
      this.drawGameOver()
    } else if (state === 'win') {
      this.drawWin()
    } else if (state === 'levelComplete') {
      this.drawLevelComplete()
    }

    this.renderer.present()
  }

  private drawHUD() {
    const store = useGameStore.getState()
    const scoreStr = store.score.toString().padStart(6, '0')
    const coinStr = store.coins.toString().padStart(2, '0')
    const timeStr = store.time.toString().padStart(3, '0')
    
    this.renderer.drawText('MARIO', 16, 16, 8)
    this.renderer.drawText(scoreStr, 16, 28, 8)
    
    this.renderer.drawText('x' + coinStr, 100, 28, 8)
    
    this.renderer.drawText('WORLD', 150, 16, 8)
    this.renderer.drawText(store.world, 160, 28, 8)
    
    this.renderer.drawText('TIME', 200, 16, 8)
    this.renderer.drawText(timeStr, 208, 28, 8)
  }

  private drawMenu() {
    const ctx = this.renderer.offscreenCtx
    // 天空背景
    ctx.fillStyle = '#5C94FC'
    ctx.fillRect(0, 0, 256, 240)

    // 云朵
    this.renderer.drawSprite('cloudSmall', 20, 30)
    this.renderer.drawSprite('cloudBig', 150, 20)
    this.renderer.drawSprite('cloudSmall', 200, 50)

    // 远处大山丘
    this.renderer.drawSprite('hillBig', -8, 240 - 24)
    this.renderer.drawSprite('hillSmall', 180, 240 - 24)

    // 草丛
    this.renderer.drawSprite('bush', 60, 240 - 24)
    this.renderer.drawSprite('bush', 120, 240 - 24)

    // 地面（2行砖块）
    for (let x = 0; x < 16; x++) {
      this.renderer.drawSprite('ground', x * 16, 208)
      this.renderer.drawSprite('ground', x * 16, 224)
    }

    // 装饰：管道
    this.renderer.drawSprite('pipeTopLeft', 30, 176)
    this.renderer.drawSprite('pipeTopRight', 46, 176)
    this.renderer.drawSprite('pipeBodyLeft', 30, 192)
    this.renderer.drawSprite('pipeBodyRight', 46, 192)

    // 装饰：砖块和问号块
    this.renderer.drawSprite('brick', 100, 160)
    this.renderer.drawSprite('question', 116, 160)
    this.renderer.drawSprite('brick', 132, 160)

    // 装饰：金币（动画）
    const coinFrame = Math.floor(Date.now() / 150) % 4
    const coinSprites: SpriteKey[] = ['coin1', 'coin2', 'coin3', 'coin4']
    this.renderer.drawSprite(coinSprites[coinFrame], 118, 144)

    // 蘑菇怪（动画）
    const goombaFrame = Math.floor(Date.now() / 200) % 2
    this.renderer.drawSprite(goombaFrame === 0 ? 'goomba1' : 'goomba2', 210, 192)

    // 马里奥（行走动画）
    const marioFrame = Math.floor(Date.now() / 120) % 3
    const marioWalkSprites: SpriteKey[] = ['smallMarioWalk1R', 'smallMarioWalk2R', 'smallMarioWalk3R']
    this.renderer.drawSprite(marioWalkSprites[marioFrame], 70, 192)

    // 标题
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fillRect(40, 60, 176, 60)
    this.renderer.drawText('SUPER', 76, 70, 18, '#FFF')
    this.renderer.drawText('MARIO', 76, 92, 18, '#E40000')
    this.renderer.drawText('BROS.', 92, 114, 18, '#FFF')

    // 开始提示
    const blink = Math.floor(Date.now() / 500) % 2 === 0
    if (blink) {
      this.renderer.drawText('PRESS SPACE TO START', 50, 150, 8, '#FFF')
    }

    // 操作说明
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, 224, 256, 16)
    this.renderer.drawText('← → MOVE  ↑/SPACE JUMP  SHIFT RUN/FIRE  DOWN CROUCH', 2, 230, 6, '#FFF')
  }

  private drawGameOver() {
    this.renderer.offscreenCtx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.renderer.offscreenCtx.fillRect(0, 0, 256, 240)
    
    this.renderer.drawText('GAME OVER', 70, 100, 16, '#E40000')
    
    const store = useGameStore.getState()
    this.renderer.drawText('SCORE: ' + store.score.toString().padStart(6, '0'), 60, 130, 8)
    
    const blink = Math.floor(Date.now() / 500) % 2 === 0
    if (blink) {
      this.renderer.drawText('PRESS SPACE TO RETRY', 45, 170, 8)
    }
  }

  private drawWin() {
    this.renderer.offscreenCtx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.renderer.offscreenCtx.fillRect(0, 0, 256, 240)

    this.renderer.drawText('CONGRATULATIONS!', 30, 70, 14, '#00FF00')
    this.renderer.drawText('ALL LEVELS CLEAR!', 28, 92, 12, '#FFF')

    const store = useGameStore.getState()
    this.renderer.drawText('FINAL SCORE: ' + store.score.toString().padStart(6, '0'), 40, 120, 8)
    this.renderer.drawText('COINS: ' + store.coins, 40, 135, 8)
    this.renderer.drawText('LIVES LEFT: ' + store.lives, 40, 150, 8)

    const blink = Math.floor(Date.now() / 500) % 2 === 0
    if (blink) {
      this.renderer.drawText('PRESS SPACE TO PLAY AGAIN', 35, 190, 8)
    }
  }

  private drawLevelComplete() {
    this.renderer.offscreenCtx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.renderer.offscreenCtx.fillRect(0, 0, 256, 240)

    this.renderer.drawText('COURSE CLEAR!', 50, 80, 14, '#00FF00')

    const store = useGameStore.getState()
    this.renderer.drawText('WORLD ' + store.world + ' CLEAR', 60, 110, 10, '#FFF')
    this.renderer.drawText('SCORE: ' + store.score.toString().padStart(6, '0'), 60, 130, 8)
    this.renderer.drawText('TIME BONUS: ' + (store.time * 50), 60, 145, 8)

    // 显示下一关信息
    if (store.currentLevel < TOTAL_LEVELS - 1) {
      this.renderer.drawText('NEXT: WORLD 1-' + (store.currentLevel + 2), 60, 165, 8, '#FCBC00')
    }

    const blink = Math.floor(Date.now() / 500) % 2 === 0
    if (blink) {
      this.renderer.drawText('PRESS SPACE TO CONTINUE', 40, 200, 8)
    }
  }

  private resetLevel() {
    this.initLevel()
    useGameStore.getState().setTime(400)
    this.timeLeft = 400
  }

  stop() {
    this.running = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
    }
    this.input.destroy()
  }
}
