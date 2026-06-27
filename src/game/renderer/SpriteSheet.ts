export const TILE_SIZE = 16
export const SCREEN_WIDTH = 256
export const SCREEN_HEIGHT = 240

export const COLORS = {
  sky: '#5C94FC',
  ground: '#C84C0C',
  groundTop: '#E0A040',
  groundDark: '#803000',
  brick: '#C84C0C',
  brickDark: '#E0A040',
  brickShadow: '#803000',
  question: '#FCBC00',
  questionDark: '#E09020',
  pipe: '#00A800',
  pipeDark: '#00D828',
  pipeLight: '#B8F818',
  pipeShadow: '#007800',
  marioRed: '#E40000',
  marioBlue: '#0000C8',
  marioSkin: '#FCBCB8',
  marioBrown: '#A0522D',
  goomba: '#A0522D',
  goombaDark: '#6B3410',
  coin: '#FCBC00',
  coinDark: '#E09020',
  cloud: '#FFFFFF',
  cloudShadow: '#D8D8D8',
  hill: '#00A800',
  hillDark: '#00D828',
  hillShadow: '#007800',
  bush: '#00A800',
  bushDark: '#00D828',
  bushShadow: '#007800',
  castle: '#D8D8D8',
  castleDark: '#A8A8A8',
  flag: '#00FF00',
  flagPole: '#D8D8D8',
  text: '#FFFFFF',
  textShadow: '#000000',
}

export type SpriteKey =
  | 'smallMarioIdleR' | 'smallMarioWalk1R' | 'smallMarioWalk2R' | 'smallMarioWalk3R'
  | 'smallMarioIdleL' | 'smallMarioWalk1L' | 'smallMarioWalk2L' | 'smallMarioWalk3L'
  | 'smallMarioJumpR' | 'smallMarioJumpL'
  | 'bigMarioIdleR' | 'bigMarioWalk1R' | 'bigMarioWalk2R' | 'bigMarioWalk3R'
  | 'bigMarioIdleL' | 'bigMarioWalk1L' | 'bigMarioWalk2L' | 'bigMarioWalk3L'
  | 'bigMarioJumpR' | 'bigMarioJumpL'
  | 'bigMarioCrouchR' | 'bigMarioCrouchL'
  | 'fireMarioIdleR' | 'fireMarioWalk1R' | 'fireMarioWalk2R' | 'fireMarioWalk3R'
  | 'fireMarioIdleL' | 'fireMarioWalk1L' | 'fireMarioWalk2L' | 'fireMarioWalk3L'
  | 'fireMarioJumpR' | 'fireMarioJumpL'
  | 'fireMarioCrouchR' | 'fireMarioCrouchL'
  | 'goomba1' | 'goomba2' | 'goombaDead'
  | 'coin1' | 'coin2' | 'coin3' | 'coin4'
  | 'ground' | 'brick' | 'question' | 'questionUsed'
  | 'pipeTopLeft' | 'pipeTopRight' | 'pipeBodyLeft' | 'pipeBodyRight'
  | 'cloudBig' | 'cloudSmall' | 'hillBig' | 'hillSmall' | 'bush'
  | 'flagPole' | 'flag' | 'castle'
  | 'mushroomItem' | 'star1' | 'star2' | 'star3' | 'star4'
  | 'fireball1' | 'fireball2' | 'fireball3' | 'fireball4'
  | 'koopaWalkL' | 'koopaWalk2L' | 'koopaWalkR' | 'koopaWalk2R' | 'koopaShell'
  | 'movingPlatform'

const spriteCache: Map<SpriteKey, HTMLCanvasElement> = new Map()

function createPixelSprite(draw: (ctx: CanvasRenderingContext2D) => void, w = TILE_SIZE, h = TILE_SIZE): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  draw(ctx)
  return canvas
}

function pixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, w = 1, h = 1) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)
}

// 像素地图绘制：用字符串数组定义精灵，每个字符代表一种颜色
const PIXEL_COLORS: Record<string, string> = {
  '.': '',          // 透明
  'R': '#E40000',   // 马里奥红
  'B': '#0000C8',   // 马里奥蓝
  'S': '#FCBCB8',   // 肤色
  'H': '#7C2400',   // 深棕（头发/鞋子）
  'h': '#A0522D',   // 棕色
  'K': '#000000',   // 黑色
  'W': '#FFFFFF',   // 白色
  'G': '#00A800',   // 绿色
  'g': '#00D828',   // 亮绿
  'd': '#007800',   // 暗绿
  'Y': '#FCBC00',   // 金黄
  'y': '#E09020',   // 暗黄
  'O': '#E0A040',   // 橙棕
  'o': '#C84C0C',   // 深橙
  'L': '#B8F818',   // 亮绿（管道高光）
  'C': '#D8D8D8',   // 灰色
  'c': '#A8A8A8',   // 暗灰
  'F': '#00FF00',   // 旗帜绿
  'T': '#8B4513',   // 木棕色
}

function drawPixelMap(ctx: CanvasRenderingContext2D, map: string[], offsetX = 0, offsetY = 0) {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      const ch = map[y][x]
      const color = PIXEL_COLORS[ch]
      if (color) {
        pixel(ctx, x + offsetX, y + offsetY, color)
      }
    }
  }
}

function flipPixelMap(map: string[]): string[] {
  return map.map(row => row.split('').reverse().join(''))
}

function initSprites() {
  // ===== 地面 =====
  spriteCache.set('ground', createPixelSprite((ctx) => {
    pixel(ctx, 0, 0, COLORS.groundTop, 16, 3)
    pixel(ctx, 0, 0, '#000', 16, 1)
    for (let y = 3; y < 16; y += 4) {
      for (let x = 0; x < 16; x += 4) {
        const c = ((x / 4) + (y / 4)) % 2 === 0 ? COLORS.ground : COLORS.groundDark
        pixel(ctx, x, y, c, 4, 4)
        pixel(ctx, x, y + 3, '#000', 4, 1)
        if (x === 0 || x === 12) {
          pixel(ctx, x, y, '#000', 1, 4)
        }
      }
    }
  }))

  // ===== 砖块 =====
  spriteCache.set('brick', createPixelSprite((ctx) => {
    pixel(ctx, 0, 0, COLORS.brick, 16, 16)
    pixel(ctx, 0, 0, '#000', 16, 1)
    pixel(ctx, 0, 15, '#000', 16, 1)
    pixel(ctx, 0, 0, '#000', 1, 16)
    pixel(ctx, 15, 0, '#000', 1, 16)
    pixel(ctx, 7, 1, '#000', 1, 7)
    pixel(ctx, 0, 7, '#000', 16, 1)
    pixel(ctx, 3, 8, '#000', 1, 7)
    pixel(ctx, 11, 8, '#000', 1, 7)
    pixel(ctx, 1, 1, COLORS.brickDark, 6, 2)
    pixel(ctx, 8, 1, COLORS.brickDark, 7, 2)
    pixel(ctx, 1, 8, COLORS.brickDark, 2, 7)
    pixel(ctx, 4, 8, COLORS.brickDark, 7, 7)
    pixel(ctx, 12, 8, COLORS.brickDark, 3, 7)
    pixel(ctx, 1, 3, COLORS.brickShadow, 6, 1)
    pixel(ctx, 8, 3, COLORS.brickShadow, 7, 1)
  }))

  // ===== 问号块 =====
  spriteCache.set('question', createPixelSprite((ctx) => {
    pixel(ctx, 0, 0, COLORS.question, 16, 16)
    pixel(ctx, 0, 0, '#000', 16, 1)
    pixel(ctx, 0, 15, '#000', 16, 1)
    pixel(ctx, 0, 0, '#000', 1, 16)
    pixel(ctx, 15, 0, '#000', 1, 16)
    pixel(ctx, 1, 1, '#FFF8E8', 3, 3)
    pixel(ctx, 12, 12, COLORS.questionDark, 3, 3)
    pixel(ctx, 7, 3, '#000', 2, 3)
    pixel(ctx, 6, 6, '#000', 4, 1)
    pixel(ctx, 7, 7, '#000', 2, 3)
    pixel(ctx, 9, 10, '#000', 1, 1)
    pixel(ctx, 7, 11, '#000', 2, 2)
    pixel(ctx, 1, 13, COLORS.questionDark, 2, 2)
  }))

  // ===== 已使用问号块 =====
  spriteCache.set('questionUsed', createPixelSprite((ctx) => {
    pixel(ctx, 0, 0, COLORS.brickDark, 16, 16)
    pixel(ctx, 0, 0, '#000', 16, 1)
    pixel(ctx, 0, 15, '#000', 16, 1)
    pixel(ctx, 0, 0, '#000', 1, 16)
    pixel(ctx, 15, 0, '#000', 1, 16)
    pixel(ctx, 2, 2, '#C8A060', 4, 4)
    pixel(ctx, 10, 10, '#A08040', 4, 4)
  }))

  // ===== 管道 =====
  spriteCache.set('pipeTopLeft', createPixelSprite((ctx) => {
    pixel(ctx, 0, 2, COLORS.pipe, 16, 14)
    pixel(ctx, 2, 0, COLORS.pipe, 12, 4)
    pixel(ctx, 0, 0, '#000', 16, 2)
    pixel(ctx, 0, 2, '#000', 2, 14)
    pixel(ctx, 14, 2, '#000', 2, 14)
    pixel(ctx, 0, 15, '#000', 16, 1)
    pixel(ctx, 2, 2, COLORS.pipeLight, 3, 2)
    pixel(ctx, 2, 6, COLORS.pipeLight, 2, 8)
    pixel(ctx, 10, 4, COLORS.pipeShadow, 4, 2)
    pixel(ctx, 12, 8, COLORS.pipeShadow, 2, 7)
    pixel(ctx, 10, 2, COLORS.pipeDark, 2, 2)
  }))

  spriteCache.set('pipeTopRight', createPixelSprite((ctx) => {
    pixel(ctx, 0, 2, COLORS.pipe, 16, 14)
    pixel(ctx, 2, 0, COLORS.pipe, 12, 4)
    pixel(ctx, 0, 0, '#000', 16, 2)
    pixel(ctx, 0, 2, '#000', 2, 14)
    pixel(ctx, 14, 2, '#000', 2, 14)
    pixel(ctx, 0, 15, '#000', 16, 1)
    pixel(ctx, 2, 2, COLORS.pipeLight, 3, 2)
    pixel(ctx, 2, 6, COLORS.pipeLight, 2, 8)
    pixel(ctx, 10, 4, COLORS.pipeShadow, 4, 2)
    pixel(ctx, 12, 8, COLORS.pipeShadow, 2, 7)
    pixel(ctx, 10, 2, COLORS.pipeDark, 2, 2)
  }))

  spriteCache.set('pipeBodyLeft', createPixelSprite((ctx) => {
    pixel(ctx, 0, 0, COLORS.pipe, 16, 16)
    pixel(ctx, 0, 0, '#000', 2, 16)
    pixel(ctx, 14, 0, '#000', 2, 16)
    pixel(ctx, 0, 15, '#000', 16, 1)
    pixel(ctx, 2, 0, COLORS.pipeLight, 2, 16)
    pixel(ctx, 12, 0, COLORS.pipeShadow, 2, 16)
    pixel(ctx, 4, 0, COLORS.pipeDark, 2, 16)
  }))

  spriteCache.set('pipeBodyRight', createPixelSprite((ctx) => {
    pixel(ctx, 0, 0, COLORS.pipe, 16, 16)
    pixel(ctx, 0, 0, '#000', 2, 16)
    pixel(ctx, 14, 0, '#000', 2, 16)
    pixel(ctx, 0, 15, '#000', 16, 1)
    pixel(ctx, 2, 0, COLORS.pipeLight, 2, 16)
    pixel(ctx, 12, 0, COLORS.pipeShadow, 2, 16)
    pixel(ctx, 4, 0, COLORS.pipeDark, 2, 16)
  }))

  // ===== 小马里奥精灵图 (16x16) =====
  const smallMarioIdleR = [
    '.....RRRRRR.....',
    '....RRRRRRRR....',
    '...HHSSSSKSS....',
    '...HHSSSSKSSS...',
    '...HSSSSSSSSS...',
    '...HHHSSSSS.....',
    '....BBBRRRBBB...',
    '..RBBBRRRRRBBBR.',
    '..RBSSRRRRRSSBR.',
    '..RBBBRRRRRBBBR.',
    '...BBBRRRRRBBB..',
    '....BBBRRRBBB...',
    '....BBB...BBB...',
    '....HH.....HH...',
    '...HHH.....HHH..',
    '................',
  ]

  const smallMarioWalk1R = [
    '.....RRRRRR.....',
    '....RRRRRRRR....',
    '...HHSSSSKSS....',
    '...HHSSSSKSSS...',
    '...HSSSSSSSSS...',
    '...HHHSSSSS.....',
    '....BBBRRRBBB...',
    '..RBBBRRRRRBBBR.',
    '..RBSSRRRRRSSBR.',
    '..RBBBRRRRRBBBR.',
    '...BBBRRRRRBBB..',
    '....BBBRRRBBB...',
    '....BBB...BBB...',
    '...HHH.....BBB..',
    '..HHH.......HH..',
    '................',
  ]

  const smallMarioWalk2R = [
    '.....RRRRRR.....',
    '....RRRRRRRR....',
    '...HHSSSSKSS....',
    '...HHSSSSKSSS...',
    '...HSSSSSSSSS...',
    '...HHHSSSSS.....',
    '....BBBRRRBBB...',
    '..RBBBRRRRRBBBR.',
    '..RBSSRRRRRSSBR.',
    '..RBBBRRRRRBBBR.',
    '...BBBRRRRRBBB..',
    '....BBBRRRBBB...',
    '....BBB...BBB...',
    '....HH.....HH...',
    '...HHH.....HHH..',
    '................',
  ]

  const smallMarioWalk3R = [
    '.....RRRRRR.....',
    '....RRRRRRRR....',
    '...HHSSSSKSS....',
    '...HHSSSSKSSS...',
    '...HSSSSSSSSS...',
    '...HHHSSSSS.....',
    '....BBBRRRBBB...',
    '..RBBBRRRRRBBBR.',
    '..RBSSRRRRRSSBR.',
    '..RBBBRRRRRBBBR.',
    '...BBBRRRRRBBB..',
    '....BBBRRRBBB...',
    '....BBB...BBB...',
    '..HHH.....HHH...',
    '.HH.........HH..',
    '................',
  ]

  const smallMarioJumpR = [
    '.....RRRRRR.....',
    '....RRRRRRRR....',
    '...HHSSSSKSS....',
    '...HHSSSSKSSS...',
    '...HSSSSSSSSS...',
    '...HHHSSSSS.....',
    '.R.BBBRRRBBB.R..',
    'RRBBBRRRRRBBBRR.',
    'RBSSRRRRRRRSSBR.',
    '.RBBBRRRRRBBBR..',
    '..BBBRRRRRBBB...',
    '...BBBRRRBBB....',
    '...BBB...BBB....',
    '...HH.....HH....',
    '..HHH.....HHH...',
    '................',
  ]

  const smallMarioMaps: Record<string, string[]> = {
    smallMarioIdleR: smallMarioIdleR,
    smallMarioWalk1R: smallMarioWalk1R,
    smallMarioWalk2R: smallMarioWalk2R,
    smallMarioWalk3R: smallMarioWalk3R,
    smallMarioJumpR: smallMarioJumpR,
  }
  Object.keys(smallMarioMaps).forEach(key => {
    const map = smallMarioMaps[key]
    spriteCache.set(key as SpriteKey, createPixelSprite((ctx) => drawPixelMap(ctx, map), 16, 16))
    const leftKey = key.replace('R', 'L') as SpriteKey
    spriteCache.set(leftKey, createPixelSprite((ctx) => drawPixelMap(ctx, flipPixelMap(map)), 16, 16))
  })

  // ===== 大马里奥精灵图 (16x24) =====
  const bigMarioIdleR = [
    '.....RRRRRR.....',
    '....RRRRRRRR....',
    '...HHSSSSKSS....',
    '...HHSSSSKSSS...',
    '...HSSSSSSSSS...',
    '...HHHSSSSS.....',
    '....RRRRRRR.....',
    '..RRBBBRRRBBBRR.',
    '.RRBBBRRRRRBBBRR',
    '.RBSSRRRRRRSSBBR',
    '.RBSSRRRRRRSSBBR',
    '.RRBBBRRRRRBBBRR',
    '..RRBBBRRRBBBRR.',
    '...RRRRRRRRRR...',
    '...BBBRRRRRBBB..',
    '...BBBRRRRRBBB..',
    '...BBBRRRRRBBB..',
    '...BBBRRRRRBBB..',
    '...BBB.....BBB..',
    '...BBB.....BBB..',
    '...HHH.....HHH..',
    '..HHHH.....HHHH.',
    '................',
    '................',
  ]

  const bigMarioWalk1R = [
    '.....RRRRRR.....',
    '....RRRRRRRR....',
    '...HHSSSSKSS....',
    '...HHSSSSKSSS...',
    '...HSSSSSSSSS...',
    '...HHHSSSSS.....',
    '....RRRRRRR.....',
    '..RRBBBRRRBBBRR.',
    '.RRBBBRRRRRBBBRR',
    '.RBSSRRRRRRSSBBR',
    '.RBSSRRRRRRSSBBR',
    '.RRBBBRRRRRBBBRR',
    '..RRBBBRRRBBBRR.',
    '...RRRRRRRRRR...',
    '...BBBRRRRRBBB..',
    '...BBBRRRRRBBB..',
    '...BBBRRRRRBBB..',
    '...BBBRRRRRBBB..',
    '..BBB.....BBB...',
    '.HHH.......HHH..',
    'HH...........HH.',
    '................',
    '................',
    '................',
  ]

  const bigMarioWalk2R = [
    '.....RRRRRR.....',
    '....RRRRRRRR....',
    '...HHSSSSKSS....',
    '...HHSSSSKSSS...',
    '...HSSSSSSSSS...',
    '...HHHSSSSS.....',
    '....RRRRRRR.....',
    '..RRBBBRRRBBBRR.',
    '.RRBBBRRRRRBBBRR',
    '.RBSSRRRRRRSSBBR',
    '.RBSSRRRRRRSSBBR',
    '.RRBBBRRRRRBBBRR',
    '..RRBBBRRRBBBRR.',
    '...RRRRRRRRRR...',
    '...BBBRRRRRBBB..',
    '...BBBRRRRRBBB..',
    '...BBBRRRRRBBB..',
    '...BBBRRRRRBBB..',
    '...BBB.....BBB..',
    '...HHH.....HHH..',
    '..HHHH.....HHHH.',
    '................',
    '................',
    '................',
  ]

  const bigMarioWalk3R = [
    '.....RRRRRR.....',
    '....RRRRRRRR....',
    '...HHSSSSKSS....',
    '...HHSSSSKSSS...',
    '...HSSSSSSSSS...',
    '...HHHSSSSS.....',
    '....RRRRRRR.....',
    '..RRBBBRRRBBBRR.',
    '.RRBBBRRRRRBBBRR',
    '.RBSSRRRRRRSSBBR',
    '.RBSSRRRRRRSSBBR',
    '.RRBBBRRRRRBBBRR',
    '..RRBBBRRRBBBRR.',
    '...RRRRRRRRRR...',
    '...BBBRRRRRBBB..',
    '...BBBRRRRRBBB..',
    '...BBBRRRRRBBB..',
    '...BBBRRRRRBBB..',
    '...BBB.....BBB..',
    '..HHH.....HHH...',
    '.HHH.......HHH..',
    'HH...........HH.',
    '................',
    '................',
  ]

  const bigMarioJumpR = [
    '.....RRRRRR.....',
    '....RRRRRRRR....',
    '...HHSSSSKSS....',
    '...HHSSSSKSSS...',
    '...HSSSSSSSSS...',
    '...HHHSSSSS.....',
    'RRRRRRRRRRRRRR..',
    'RRBBBRRRRRBBBRRR',
    'BSSRRRRRRRRSSBBR',
    'BSSRRRRRRRRSSBBR',
    'RRBBBRRRRRBBBRRR',
    '.RRBBBRRRRRBBBRR',
    '..RRBBBRRRBBBRR.',
    '...RRRRRRRRRR...',
    '...BBBRRRRRBBB..',
    '...BBBRRRRRBBB..',
    '...BBBRRRRRBBB..',
    '...BBB...BBB....',
    '...BBB...BBB....',
    '...HHH...HHH....',
    '..HHHH...HHHH...',
    '................',
    '................',
    '................',
  ]

  const bigMarioCrouchR = [
    '................',
    '................',
    '.....RRRRRR.....',
    '....RRRRRRRR....',
    '...HHSSSSKSS....',
    '...HHSSSSKSSS...',
    '...HSSSSSSSSS...',
    '...HHHSSSSS.....',
    '....RRRRRRR.....',
    '..RRBBBRRRBBBRR.',
    '.RRBBBRRRRRBBBRR',
    '.RBSSRRRRRRSSBBR',
    '.RRBBBRRRRRBBBRR',
    '..RRBBBRRRBBBRR.',
    '...RRRRRRRRRR...',
    '...BBBRRRRRBBB..',
    '...BBBRRRRRBBB..',
    '...HHH.....HHH..',
    '..HHHH.....HHHH.',
    '................',
    '................',
    '................',
    '................',
    '................',
  ]

  const bigMarioMaps: Record<string, string[]> = {
    bigMarioIdleR: bigMarioIdleR,
    bigMarioWalk1R: bigMarioWalk1R,
    bigMarioWalk2R: bigMarioWalk2R,
    bigMarioWalk3R: bigMarioWalk3R,
    bigMarioJumpR: bigMarioJumpR,
    bigMarioCrouchR: bigMarioCrouchR,
  }
  Object.keys(bigMarioMaps).forEach(key => {
    const map = bigMarioMaps[key]
    spriteCache.set(key as SpriteKey, createPixelSprite((ctx) => drawPixelMap(ctx, map), 16, 24))
    const leftKey = key.replace('R', 'L') as SpriteKey
    spriteCache.set(leftKey, createPixelSprite((ctx) => drawPixelMap(ctx, flipPixelMap(map)), 16, 24))
  })

  // ===== 火球马里奥精灵图 (16x24) =====
  // 火球马里奥：白色帽子/衣服，红色裤子。用 W 替换 B
  const fireMarioMaps: Record<string, string[]> = {}
  Object.keys(bigMarioMaps).forEach(key => {
    const fireKey = key.replace('big', 'fire')
    fireMarioMaps[fireKey] = bigMarioMaps[key].map(row =>
      row.split('').map(ch => ch === 'B' ? 'W' : ch).join('')
    )
  })
  Object.keys(fireMarioMaps).forEach(key => {
    const map = fireMarioMaps[key]
    spriteCache.set(key as SpriteKey, createPixelSprite((ctx) => drawPixelMap(ctx, map), 16, 24))
    const leftKey = key.replace('R', 'L') as SpriteKey
    spriteCache.set(leftKey, createPixelSprite((ctx) => drawPixelMap(ctx, flipPixelMap(map)), 16, 24))
  })

  // ===== 蘑菇怪精灵图 =====
  const goomba1 = [
    '................',
    '....hhhhhhhh....',
    '...hhhhhhhhhh...',
    '..hhhhhhhhhhhh..',
    '..hhWWWWWWWWhh..',
    '.hhhWKWWWWKWhhh.',
    '.hhhWKWWWWKWhhh.',
    '.hhhhKKKKKKhhhh.',
    '.hhhhhhhhhhhhhh.',
    '..hhhhhhhhhhhh..',
    '...hhhhhhhhhh...',
    '....hhhhhhhh....',
    '...OOO....OOO...',
    '..OOOOO..OOOOO..',
    '..OOOOO..OOOOO..',
    '................',
  ]

  const goomba2 = [
    '................',
    '....hhhhhhhh....',
    '...hhhhhhhhhh...',
    '..hhhhhhhhhhhh..',
    '..hhWWWWWWWWhh..',
    '.hhhWKWWWWKWhhh.',
    '.hhhWKWWWWKWhhh.',
    '.hhhhKKKKKKhhhh.',
    '.hhhhhhhhhhhhhh.',
    '..hhhhhhhhhhhh..',
    '...hhhhhhhhhh...',
    '....hhhhhhhh....',
    '..OOO......OOO..',
    '.OOOOO....OOOOO.',
    '.OOOOO....OOOOO.',
    '................',
  ]

  const goombaDead = [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '..hhhhhhhhhhhh..',
    '.hhhhKKKKKKhhhh.',
    '.hhhWKWWWWKWhhh.',
    '.hhhhhhhhhhhhhh.',
    '..OOOOOOOOOOOO..',
    '..OOOOOOOOOOOO..',
    '................',
    '................',
  ]

  spriteCache.set('goomba1', createPixelSprite((ctx) => drawPixelMap(ctx, goomba1)))
  spriteCache.set('goomba2', createPixelSprite((ctx) => drawPixelMap(ctx, goomba2)))
  spriteCache.set('goombaDead', createPixelSprite((ctx) => drawPixelMap(ctx, goombaDead)))

  // ===== 蘑菇道具精灵图 =====
  const mushroomItem = [
    '................',
    '....RRRRRRRR....',
    '..RRRRRRRRRRRR..',
    '.RRRRWWWWWWRRRR.',
    '.RRWWWWWWWWWWRR.',
    'RRWWWWWWWWWWWWRR',
    'RRWWWWWWWWWWWWRR',
    'RRWWWWWWWWWWWWRR',
    '.RWWWWWWWWWWWWR.',
    '.RRWWWWWWWWWWRR.',
    '..RRRRRRRRRRRR..',
    '...SSSSSSSSSS...',
    '...SKSSSSSKSS...',
    '...SSSSSSSSSS...',
    '...SSSSSSSSSS...',
    '................',
  ]
  spriteCache.set('mushroomItem', createPixelSprite((ctx) => drawPixelMap(ctx, mushroomItem)))

  // ===== 星星道具精灵图 =====
  const star1 = [
    '................',
    '.......YY.......',
    '......YYYY......',
    '......YYYY......',
    '.....YYYYYY.....',
    'YYYYYYYYYYYYYYYY',
    'YYYYYYYYYYYYYYYY',
    '.YYYYYYYYYYYYYY.',
    '..YYYYYYYYYYYY..',
    '...YYYYYYYYYY...',
    '...YYYYYYYYYY...',
    '...YYYYYYYYYY...',
    '..YYYYYYYYYYYY..',
    '.YYYYYYYYYYYYYY.',
    '................',
    '................',
  ]
  const star2 = star1.map(row => row.split('').map(ch => ch === 'Y' ? 'g' : ch).join(''))
  const star3 = star1.map(row => row.split('').map(ch => ch === 'Y' ? 'R' : ch).join(''))
  const star4 = star1.map(row => row.split('').map(ch => ch === 'Y' ? 'W' : ch).join(''))
  spriteCache.set('star1', createPixelSprite((ctx) => drawPixelMap(ctx, star1)))
  spriteCache.set('star2', createPixelSprite((ctx) => drawPixelMap(ctx, star2)))
  spriteCache.set('star3', createPixelSprite((ctx) => drawPixelMap(ctx, star3)))
  spriteCache.set('star4', createPixelSprite((ctx) => drawPixelMap(ctx, star4)))

  // ===== 火球精灵图 =====
  const fireball1 = [
    '................',
    '....RRRR........',
    '...ROOOORR......',
    '..ROOOOOORR.....',
    '.ROOOOOOOOR.....',
    '.ROOOOOOOOR.....',
    '.ROOOOOOOOR.....',
    '..ROOOOOORR.....',
    '...ROOOORR......',
    '....RRRR........',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ]
  const fireball2 = [
    '................',
    '................',
    '......RR........',
    '....RROOR.......',
    '...ROOOOORR.....',
    '..ROOOOOOOOR....',
    '..ROOOOOOOOR....',
    '...ROOOOORR.....',
    '....RROOR.......',
    '......RR........',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ]
  const fireball3 = [
    '................',
    '................',
    '................',
    '.......RR.......',
    '......ROOR......',
    '....RROOOORR....',
    '....RROOOORR....',
    '......ROOR......',
    '.......RR.......',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ]
  const fireball4 = [
    '................',
    '................',
    '......RR........',
    '....RROOR.......',
    '...ROOOOORR.....',
    '..ROOOOOOOOR....',
    '..ROOOOOOOOR....',
    '...ROOOOORR.....',
    '....RROOR.......',
    '......RR........',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ]
  spriteCache.set('fireball1', createPixelSprite((ctx) => drawPixelMap(ctx, fireball1)))
  spriteCache.set('fireball2', createPixelSprite((ctx) => drawPixelMap(ctx, fireball2)))
  spriteCache.set('fireball3', createPixelSprite((ctx) => drawPixelMap(ctx, fireball3)))
  spriteCache.set('fireball4', createPixelSprite((ctx) => drawPixelMap(ctx, fireball4)))

  // ===== 金币精灵图 =====
  const drawCoin = (frame: 1 | 2 | 3 | 4) => {
    return createPixelSprite((ctx) => {
      const gold = COLORS.coin
      const darkGold = COLORS.coinDark
      const black = '#000'
      const light = '#FFF8E8'

      if (frame === 1) {
        pixel(ctx, 5, 2, gold, 6, 12)
        pixel(ctx, 4, 3, gold, 1, 10)
        pixel(ctx, 11, 3, gold, 1, 10)
        pixel(ctx, 6, 1, gold, 4, 1)
        pixel(ctx, 6, 14, gold, 4, 1)
        pixel(ctx, 6, 3, light, 2, 8)
        pixel(ctx, 5, 2, black, 1, 1)
        pixel(ctx, 10, 2, black, 1, 1)
        pixel(ctx, 4, 3, black, 1, 1)
        pixel(ctx, 11, 13, black, 1, 1)
        pixel(ctx, 6, 14, black, 1, 1)
        pixel(ctx, 9, 14, black, 1, 1)
      } else if (frame === 2) {
        pixel(ctx, 6, 2, gold, 4, 12)
        pixel(ctx, 5, 3, gold, 1, 10)
        pixel(ctx, 10, 3, gold, 1, 10)
        pixel(ctx, 7, 1, gold, 2, 1)
        pixel(ctx, 7, 14, gold, 2, 1)
        pixel(ctx, 6, 3, light, 1, 8)
      } else if (frame === 3) {
        pixel(ctx, 7, 2, gold, 2, 12)
        pixel(ctx, 7, 1, gold, 2, 1)
        pixel(ctx, 7, 14, gold, 2, 1)
      } else {
        pixel(ctx, 6, 2, gold, 4, 12)
        pixel(ctx, 5, 3, gold, 1, 10)
        pixel(ctx, 10, 3, gold, 1, 10)
        pixel(ctx, 7, 1, gold, 2, 1)
        pixel(ctx, 7, 14, gold, 2, 1)
        pixel(ctx, 9, 3, darkGold, 1, 8)
      }
    }, 16, 16)
  }

  spriteCache.set('coin1', drawCoin(1))
  spriteCache.set('coin2', drawCoin(2))
  spriteCache.set('coin3', drawCoin(3))
  spriteCache.set('coin4', drawCoin(4))

  // ===== 云朵精灵图 =====
  spriteCache.set('cloudBig', createPixelSprite((ctx) => {
    const white = COLORS.cloud
    const shadow = COLORS.cloudShadow
    pixel(ctx, 10, 3, white, 18, 3)
    pixel(ctx, 4, 6, white, 30, 6)
    pixel(ctx, 0, 9, white, 42, 6)
    pixel(ctx, 3, 15, white, 36, 4)
    pixel(ctx, 30, 6, shadow, 9, 6)
    pixel(ctx, 27, 12, shadow, 15, 4)
    pixel(ctx, 21, 16, shadow, 18, 3)
  }, 48, 24))

  spriteCache.set('cloudSmall', createPixelSprite((ctx) => {
    const white = COLORS.cloud
    const shadow = COLORS.cloudShadow
    pixel(ctx, 7, 3, white, 14, 3)
    pixel(ctx, 2, 6, white, 24, 5)
    pixel(ctx, 0, 9, white, 28, 5)
    pixel(ctx, 3, 14, white, 22, 4)
    pixel(ctx, 18, 6, shadow, 8, 5)
    pixel(ctx, 15, 11, shadow, 12, 3)
    pixel(ctx, 12, 14, shadow, 12, 3)
  }, 32, 20))

  // ===== 山丘精灵图 =====
  spriteCache.set('hillBig', createPixelSprite((ctx) => {
    const green = COLORS.hill
    const darkGreen = COLORS.hillDark
    const shadow = COLORS.hillShadow
    pixel(ctx, 22, 3, green, 6, 2)
    pixel(ctx, 17, 5, green, 16, 2)
    pixel(ctx, 12, 7, green, 26, 2)
    pixel(ctx, 8, 9, green, 34, 2)
    pixel(ctx, 5, 11, green, 40, 3)
    pixel(ctx, 2, 14, green, 46, 4)
    pixel(ctx, 0, 18, green, 48, 6)
    pixel(ctx, 8, 9, darkGreen, 6, 4)
    pixel(ctx, 18, 7, darkGreen, 6, 6)
    pixel(ctx, 30, 11, darkGreen, 6, 4)
    pixel(ctx, 38, 7, darkGreen, 5, 6)
    pixel(ctx, 3, 18, shadow, 3, 3)
    pixel(ctx, 42, 18, shadow, 3, 3)
    pixel(ctx, 0, 22, shadow, 4, 2)
    pixel(ctx, 44, 22, shadow, 4, 2)
  }, 48, 24))

  spriteCache.set('hillSmall', createPixelSprite((ctx) => {
    const green = COLORS.hill
    const darkGreen = COLORS.hillDark
    const shadow = COLORS.hillShadow
    pixel(ctx, 14, 6, green, 4, 2)
    pixel(ctx, 10, 8, green, 12, 2)
    pixel(ctx, 6, 10, green, 20, 2)
    pixel(ctx, 4, 12, green, 24, 3)
    pixel(ctx, 2, 15, green, 28, 3)
    pixel(ctx, 0, 18, green, 32, 6)
    pixel(ctx, 4, 10, darkGreen, 4, 3)
    pixel(ctx, 8, 12, darkGreen, 4, 3)
    pixel(ctx, 14, 9, darkGreen, 4, 3)
    pixel(ctx, 19, 12, darkGreen, 4, 3)
    pixel(ctx, 24, 10, darkGreen, 4, 3)
    pixel(ctx, 2, 18, shadow, 3, 2)
    pixel(ctx, 27, 18, shadow, 3, 2)
    pixel(ctx, 0, 22, shadow, 3, 2)
    pixel(ctx, 29, 22, shadow, 3, 2)
  }, 32, 24))

  // ===== 草丛精灵图 =====
  spriteCache.set('bush', createPixelSprite((ctx) => {
    const green = COLORS.bush
    const darkGreen = COLORS.bushDark
    const shadow = COLORS.bushShadow
    pixel(ctx, 10, 12, green, 30, 8)
    pixel(ctx, 5, 14, green, 40, 6)
    pixel(ctx, 2, 16, green, 46, 6)
    pixel(ctx, 0, 20, green, 48, 4)
    pixel(ctx, 5, 14, darkGreen, 6, 4)
    pixel(ctx, 14, 12, darkGreen, 6, 6)
    pixel(ctx, 24, 14, darkGreen, 6, 4)
    pixel(ctx, 35, 12, darkGreen, 6, 6)
    pixel(ctx, 40, 17, darkGreen, 6, 4)
    pixel(ctx, 2, 22, shadow, 3, 2)
    pixel(ctx, 43, 22, shadow, 3, 2)
  }, 48, 24))

  // ===== 旗杆和旗帜 =====
  spriteCache.set('flagPole', createPixelSprite((ctx) => {
    pixel(ctx, 7, 0, COLORS.flagPole, 2, 16)
    pixel(ctx, 7, 0, '#FFF', 1, 16)
    pixel(ctx, 8, 0, '#A8A8A8', 1, 16)
    pixel(ctx, 6, 0, '#000', 1, 16)
    pixel(ctx, 9, 0, '#000', 1, 16)
  }))

  spriteCache.set('flag', createPixelSprite((ctx) => {
    pixel(ctx, 0, 0, COLORS.flag, 8, 8)
    pixel(ctx, 0, 0, '#000', 1, 8)
    pixel(ctx, 0, 7, '#000', 8, 1)
    pixel(ctx, 7, 0, '#000', 1, 8)
    pixel(ctx, 1, 1, '#80FF80', 6, 5)
    pixel(ctx, 3, 2, '#FFF', 2, 2)
  }))

  // ===== 乌龟（Koopa）精灵图 (16x22) =====
  // 颜色：绿壳、黄皮肤、白眼
  const koopaGreen = '#00A800'
  const koopaGreenD = '#007800'
  const koopaGreenL = '#00D828'
  const koopaYellow = '#FCBC00'
  const koopaYellowD = '#E09020'
  const koopaWhite = '#FFFFFF'
  const koopaBlack = '#000000'

  // 乌龟行走第1帧（面朝左）
  const koopaWalkLMap = [
    '......KKKK......',
    '.....KGGGGK.....',
    '....KGLGGLGK....',
    '....KGWWGWWGK...',
    '....KGWKGWKGG...',
    '....KGGGGGGGK...',
    '...KGGGGGGGGGK..',
    '..KGGGGGGGGGGGK.',
    '..KGGGGGGGGGGGK.',
    '..YYKGGGGGGGKYY.',
    '.YYYKGGGGGGGKYYY',
    '.YYYYKGGGGGKYYYY',
    '.YYYYKKKKKKKYYYY',
    '..YYYKGGGGGKYYY.',
    '...KKKGGGGGKKK..',
    '....KGGGGGGGK...',
    '....KGGGGGGGK...',
    '....KGG...GGK...',
    '....KGG...GGK...',
    '....HHH...HHH...',
    '...HHHH...HHHH..',
    '................',
  ]
  spriteCache.set('koopaWalkL', createPixelSprite((ctx) => {
    // 临时映射：K=黑,G=绿壳,L=亮绿,W=白眼,Y=黄皮肤,H=深棕脚
    const map = koopaWalkLMap
    const colorMap: Record<string, string> = {
      'K': koopaBlack, 'G': koopaGreen, 'L': koopaGreenL,
      'W': koopaWhite, 'Y': koopaYellow, 'H': '#7C2400',
    }
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        const c = colorMap[map[y][x]]
        if (c) pixel(ctx, x, y, c)
      }
    }
  }, 16, 22))

  // 乌龟行走第2帧（面朝左，脚部不同）
  const koopaWalk2LMap = [
    '......KKKK......',
    '.....KGGGGK.....',
    '....KGLGGLGK....',
    '....KGWWGWWGK...',
    '....KGWKGWKGG...',
    '....KGGGGGGGK...',
    '...KGGGGGGGGGK..',
    '..KGGGGGGGGGGGK.',
    '..KGGGGGGGGGGGK.',
    '..YYKGGGGGGGKYY.',
    '.YYYKGGGGGGGKYYY',
    '.YYYYKGGGGGKYYYY',
    '.YYYYKKKKKKKYYYY',
    '..YYYKGGGGGKYYY.',
    '...KKKGGGGGKKK..',
    '....KGGGGGGGK...',
    '....KGGGGGGGK...',
    '....KG.....GGK..',
    '....KG.....GGK..',
    '...HHH.....HHH..',
    '..HHH.......HHH.',
    '................',
  ]
  spriteCache.set('koopaWalk2L', createPixelSprite((ctx) => {
    const map = koopaWalk2LMap
    const colorMap: Record<string, string> = {
      'K': koopaBlack, 'G': koopaGreen, 'L': koopaGreenL,
      'W': koopaWhite, 'Y': koopaYellow, 'H': '#7C2400',
    }
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        const c = colorMap[map[y][x]]
        if (c) pixel(ctx, x, y, c)
      }
    }
  }, 16, 22))

  // 右行版本（水平翻转）
  function flipMap(map: string[]): string[] {
    return map.map(row => row.split('').reverse().join(''))
  }
  const koopaWalkRMap = flipMap(koopaWalkLMap)
  const koopaWalk2RMap = flipMap(koopaWalk2LMap)
  spriteCache.set('koopaWalkR', createPixelSprite((ctx) => {
    const colorMap: Record<string, string> = {
      'K': koopaBlack, 'G': koopaGreen, 'L': koopaGreenL,
      'W': koopaWhite, 'Y': koopaYellow, 'H': '#7C2400',
    }
    for (let y = 0; y < koopaWalkRMap.length; y++) {
      for (let x = 0; x < koopaWalkRMap[y].length; x++) {
        const c = colorMap[koopaWalkRMap[y][x]]
        if (c) pixel(ctx, x, y, c)
      }
    }
  }, 16, 22))
  spriteCache.set('koopaWalk2R', createPixelSprite((ctx) => {
    const colorMap: Record<string, string> = {
      'K': koopaBlack, 'G': koopaGreen, 'L': koopaGreenL,
      'W': koopaWhite, 'Y': koopaYellow, 'H': '#7C2400',
    }
    for (let y = 0; y < koopaWalk2RMap.length; y++) {
      for (let x = 0; x < koopaWalk2RMap[y].length; x++) {
        const c = colorMap[koopaWalk2RMap[y][x]]
        if (c) pixel(ctx, x, y, c)
      }
    }
  }, 16, 22))

  // 乌龟壳（16x14）
  spriteCache.set('koopaShell', createPixelSprite((ctx) => {
    // 壳体：椭圆形绿色带花纹
    const G = koopaGreen, D = koopaGreenD, L = koopaGreenL, K = koopaBlack, Y = koopaYellow, W = koopaWhite
    // 底部黄色边
    pixel(ctx, 2, 12, Y, 12, 2)
    pixel(ctx, 1, 11, Y, 14, 1)
    // 壳体主体
    pixel(ctx, 2, 3, K, 12, 1)
    pixel(ctx, 1, 4, K, 14, 1)
    pixel(ctx, 3, 4, G, 10, 7)
    pixel(ctx, 0, 5, K, 16, 1)
    pixel(ctx, 1, 5, G, 14, 6)
    pixel(ctx, 0, 6, G, 16, 5)
    pixel(ctx, 0, 11, K, 16, 1)
    pixel(ctx, 1, 6, G, 14, 5)
    // 亮绿高光
    pixel(ctx, 2, 5, L, 4, 2)
    pixel(ctx, 3, 7, L, 2, 2)
    // 暗绿花纹（六边形分区）
    pixel(ctx, 5, 6, D, 3, 3)
    pixel(ctx, 9, 6, D, 3, 3)
    pixel(ctx, 7, 9, D, 3, 2)
    // 中心黄点
    pixel(ctx, 7, 7, Y, 2, 2)
    pixel(ctx, 7, 7, K, 2, 1)
    // 底部黑边
    pixel(ctx, 1, 12, K, 14, 1)
    pixel(ctx, 2, 13, K, 12, 1)
  }, 16, 14))

  // ===== 移动平台精灵图 (32x8) =====
  spriteCache.set('movingPlatform', createPixelSprite((ctx) => {
    const base = '#A0522D'    // 棕色平台
    const light = '#C87040'   // 高光
    const dark = '#603000'    // 阴影
    const black = '#000'
    // 主体
    pixel(ctx, 0, 0, black, 32, 1)
    pixel(ctx, 0, 1, light, 32, 1)
    pixel(ctx, 0, 2, base, 32, 4)
    pixel(ctx, 0, 6, dark, 32, 1)
    pixel(ctx, 0, 7, black, 32, 1)
    // 木板分隔线
    for (let i = 1; i < 4; i++) {
      pixel(ctx, i * 8, 1, black, 1, 6)
    }
    // 高光斑点
    pixel(ctx, 2, 3, light, 2, 1)
    pixel(ctx, 10, 3, light, 2, 1)
    pixel(ctx, 18, 3, light, 2, 1)
    pixel(ctx, 26, 3, light, 2, 1)
  }, 32, 8))

  // ===== 城堡精灵图（80x80，完整一座城堡）=====
  // 参考原版1-1终点城堡：雉堞城墙 + 中央塔楼 + 拱门
  spriteCache.set('castle', createPixelSprite((ctx) => {
    const gray = COLORS.castle      // 浅灰
    const dark = COLORS.castleDark  // 暗灰
    const black = '#000'
    const brick = '#A07050'         // 砖红棕（拱门框）

    // === 中央主塔楼（顶部，x=28~52, y=0~24）===
    // 塔楼雉堞（齿状顶部）
    for (let i = 0; i < 4; i++) {
      pixel(ctx, 28 + i * 6, 0, gray, 4, 6)
      pixel(ctx, 28 + i * 6, 0, black, 1, 6)
    }
    pixel(ctx, 52, 0, black, 1, 6)
    // 塔楼主体
    pixel(ctx, 28, 6, gray, 24, 18)
    pixel(ctx, 28, 6, black, 1, 18)
    pixel(ctx, 51, 6, black, 1, 18)
    // 塔楼窗户
    pixel(ctx, 38, 10, black, 4, 6)
    pixel(ctx, 38, 10, dark, 3, 5)

    // === 主城墙（x=8~72, y=24~80）===
    // 城墙雉堞（齿状顶部，左右两侧）
    for (let i = 0; i < 3; i++) {
      pixel(ctx, 8 + i * 6, 24, gray, 4, 6)
      pixel(ctx, 8 + i * 6, 24, black, 1, 6)
    }
    for (let i = 0; i < 3; i++) {
      pixel(ctx, 50 + i * 6, 24, gray, 4, 6)
      pixel(ctx, 50 + i * 6, 24, black, 1, 6)
    }
    pixel(ctx, 68, 24, black, 1, 6)
    pixel(ctx, 26, 24, black, 1, 6)

    // 城墙主体
    pixel(ctx, 8, 30, gray, 64, 50)
    pixel(ctx, 8, 30, black, 1, 50)
    pixel(ctx, 71, 30, black, 1, 50)
    pixel(ctx, 8, 79, black, 64, 1)

    // 横向砖纹分隔线
    pixel(ctx, 9, 44, dark, 63, 1)
    pixel(ctx, 9, 58, dark, 63, 1)
    pixel(ctx, 9, 72, dark, 63, 1)

    // === 中央拱门（x=32~48, y=48~80）===
    // 拱门黑色背景
    pixel(ctx, 32, 48, black, 16, 32)
    // 拱门顶部圆弧（用阶梯近似）
    pixel(ctx, 34, 48, black, 12, 2)
    pixel(ctx, 33, 50, black, 14, 2)
    // 拱门砖框
    pixel(ctx, 31, 48, brick, 1, 32)
    pixel(ctx, 48, 48, brick, 1, 32)
    pixel(ctx, 32, 47, brick, 16, 1)
    // 拱门内部阴影
    pixel(ctx, 33, 60, dark, 14, 20)

    // === 左右小窗户 ===
    // 左窗
    pixel(ctx, 16, 44, black, 8, 10)
    pixel(ctx, 16, 44, dark, 7, 9)
    pixel(ctx, 18, 46, black, 4, 6)
    // 右窗
    pixel(ctx, 56, 44, black, 8, 10)
    pixel(ctx, 56, 44, dark, 7, 9)
    pixel(ctx, 58, 46, black, 4, 6)
  }, 80, 80))
}

export function getSprite(key: SpriteKey): HTMLCanvasElement {
  if (spriteCache.size === 0) {
    initSprites()
  }
  return spriteCache.get(key)!
}
