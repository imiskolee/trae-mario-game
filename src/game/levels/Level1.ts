export { TILE_SIZE } from '../renderer/SpriteSheet'

export const TILE = {
  EMPTY: 0,
  GROUND: 1,
  BRICK: 2,
  QUESTION: 3,
  PIPE_TOP_LEFT: 4,
  PIPE_TOP_RIGHT: 5,
  PIPE_BODY_LEFT: 6,
  PIPE_BODY_RIGHT: 7,
  COIN: 8,
  MARIO_START: 9,
  QUESTION_USED: 10,
  GOOMBA: 'G',
  KOOPA: 'k',
  HILL: 'H',
  CLOUD1: 'C1',
  CLOUD2: 'C2',
  BUSH: 'B',
  FLAG_POLE: 'F',
  CASTLE: 'CA',
} as const

export type TileType = number | string

export const LEVEL_WIDTH = 228
export const LEVEL_HEIGHT = 15

const groundRow: TileType[] = new Array(LEVEL_WIDTH).fill(TILE.GROUND)
const emptyRow: TileType[] = new Array(LEVEL_WIDTH).fill(TILE.EMPTY)

function setTile(map: TileType[][], x: number, y: number, tile: TileType) {
  if (y >= 0 && y < map.length && x >= 0 && x < map[0].length) {
    map[y][x] = tile
  }
}

function setTiles(map: TileType[][], x: number, y: number, w: number, h: number, tile: TileType) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setTile(map, x + dx, y + dy, tile)
    }
  }
}

// 设置管道：x为左列坐标，topY为管道顶部行
function setPipe(map: TileType[][], x: number, topY: number) {
  map[topY][x] = TILE.PIPE_TOP_LEFT
  map[topY][x + 1] = TILE.PIPE_TOP_RIGHT
  for (let y = topY + 1; y <= 12; y++) {
    map[y][x] = TILE.PIPE_BODY_LEFT
    map[y][x + 1] = TILE.PIPE_BODY_RIGHT
  }
}

// 设置阶梯（向上递增）：startX为起始列，steps为步数
function setStaircaseUp(map: TileType[][], startX: number, steps: number) {
  for (let i = 0; i < steps; i++) {
    const x = startX + i
    const height = i + 1
    for (let y = 13 - height; y <= 12; y++) {
      setTile(map, x, y, TILE.GROUND)
    }
  }
}

// 设置阶梯（向下递减）：startX为起始列，steps为步数
function setStaircaseDown(map: TileType[][], startX: number, steps: number) {
  for (let i = 0; i < steps; i++) {
    const x = startX + i
    const height = steps - i
    for (let y = 13 - height; y <= 12; y++) {
      setTile(map, x, y, TILE.GROUND)
    }
  }
}

export function createLevel1(): TileType[][] {
  const map: TileType[][] = []
  for (let y = 0; y < LEVEL_HEIGHT; y++) {
    map.push([...emptyRow])
  }

  // ===== 地面（第13-14行），带3个缺口 =====
  // 段1: x=0 ~ x=68
  for (let x = 0; x <= 68; x++) {
    map[13][x] = TILE.GROUND
    map[14][x] = TILE.GROUND
  }
  // 缺口1: x=69 ~ x=70（2格宽）
  // 段2: x=71 ~ x=85
  for (let x = 71; x <= 85; x++) {
    map[13][x] = TILE.GROUND
    map[14][x] = TILE.GROUND
  }
  // 缺口2: x=86 ~ x=88（3格宽）
  // 段3: x=89 ~ x=152
  for (let x = 89; x <= 152; x++) {
    map[13][x] = TILE.GROUND
    map[14][x] = TILE.GROUND
  }
  // 缺口3: x=153 ~ x=154（2格宽）
  // 段4: x=155 ~ 关卡末尾
  for (let x = 155; x < LEVEL_WIDTH; x++) {
    map[13][x] = TILE.GROUND
    map[14][x] = TILE.GROUND
  }

  // ===== 问号块和砖块 =====
  // 第一个问号块
  setTile(map, 16, 9, TILE.QUESTION)

  // 砖块-问号-砖块-问号-砖块 序列
  setTile(map, 20, 9, TILE.BRICK)
  setTile(map, 21, 9, TILE.QUESTION)
  setTile(map, 22, 9, TILE.BRICK)
  setTile(map, 23, 9, TILE.QUESTION)
  setTile(map, 24, 9, TILE.BRICK)

  // 高空问号块（1up蘑菇）
  setTile(map, 22, 5, TILE.QUESTION)

  // ===== 管道（高度递增） =====
  setPipe(map, 28, 11)   // 管道1：2格高
  setPipe(map, 38, 10)   // 管道2：3格高
  setPipe(map, 46, 9)    // 管道3：4格高
  setPipe(map, 57, 9)    // 管道4：4格高

  // ===== 缺口1之后 =====
  // 问号块
  setTile(map, 71, 9, TILE.QUESTION)

  // ===== 砖块/问号块结构 =====
  setTile(map, 77, 9, TILE.BRICK)
  setTile(map, 78, 9, TILE.QUESTION)
  setTile(map, 79, 9, TILE.BRICK)
  setTile(map, 80, 9, TILE.QUESTION)
  setTile(map, 81, 9, TILE.BRICK)
  setTile(map, 82, 9, TILE.QUESTION)
  setTile(map, 83, 9, TILE.BRICK)
  setTile(map, 84, 9, TILE.QUESTION)

  // ===== 缺口2之后 =====
  // 高空砖块（原版藤蔓区域）
  setTile(map, 91, 5, TILE.BRICK)

  // 问号块和砖块序列
  setTile(map, 94, 9, TILE.QUESTION)
  setTile(map, 100, 9, TILE.BRICK)
  setTile(map, 101, 9, TILE.QUESTION)
  setTile(map, 102, 9, TILE.BRICK)
  setTile(map, 103, 9, TILE.QUESTION)
  setTile(map, 104, 9, TILE.BRICK)
  setTile(map, 105, 9, TILE.QUESTION)
  setTile(map, 106, 9, TILE.BRICK)

  // 高空砖块
  setTile(map, 109, 5, TILE.BRICK)

  // 更多问号块
  setTile(map, 112, 9, TILE.QUESTION)
  setTile(map, 118, 9, TILE.QUESTION)

  // 砖块结构
  setTile(map, 121, 9, TILE.BRICK)
  setTile(map, 122, 9, TILE.QUESTION)
  setTile(map, 123, 9, TILE.BRICK)
  setTile(map, 124, 9, TILE.QUESTION)
  setTile(map, 125, 9, TILE.BRICK)

  // ===== 缺口3之后：阶梯区域 =====
  // 阶梯1（向上递增，4步）
  setStaircaseUp(map, 163, 4)
  // 阶梯2（向上递增，4步）- 紧邻旗杆前
  setStaircaseUp(map, 184, 4)

  // ===== 马里奥起始位置 =====
  setTile(map, 2, 12, TILE.MARIO_START)

  // ===== 蘑菇怪位置 =====
  setTile(map, 22, 12, TILE.GOOMBA)
  setTile(map, 40, 12, TILE.GOOMBA)
  setTile(map, 51, 12, TILE.GOOMBA)
  setTile(map, 52, 12, TILE.GOOMBA)
  setTile(map, 80, 12, TILE.GOOMBA)
  setTile(map, 82, 12, TILE.GOOMBA)
  setTile(map, 97, 12, TILE.GOOMBA)
  setTile(map, 98, 12, TILE.GOOMBA)
  setTile(map, 130, 12, TILE.GOOMBA)
  setTile(map, 131, 12, TILE.GOOMBA)
  setTile(map, 143, 12, TILE.GOOMBA)
  setTile(map, 144, 12, TILE.GOOMBA)

  // ===== 金币（空中浮动） =====
  // 起始区域上空
  setTile(map, 11, 7, TILE.COIN)
  setTile(map, 12, 7, TILE.COIN)
  setTile(map, 13, 7, TILE.COIN)
  // 管道之间
  setTile(map, 34, 7, TILE.COIN)
  setTile(map, 35, 7, TILE.COIN)
  setTile(map, 36, 7, TILE.COIN)
  // 砖块结构上空
  setTile(map, 100, 7, TILE.COIN)
  setTile(map, 101, 7, TILE.COIN)
  setTile(map, 102, 7, TILE.COIN)
  setTile(map, 103, 7, TILE.COIN)
  setTile(map, 104, 7, TILE.COIN)
  setTile(map, 105, 7, TILE.COIN)
  // 阶梯区域
  setTile(map, 160, 7, TILE.COIN)
  setTile(map, 161, 7, TILE.COIN)

  return map
}

export interface BackgroundElement {
  type: 'cloudBig' | 'cloudSmall' | 'hillBig' | 'hillSmall' | 'bush'
  x: number
  y: number
}

export function getBackgroundElements(): BackgroundElement[] {
  const elements: BackgroundElement[] = []

  // 云朵（天空中）- y坐标以tile为单位，新云朵高度24px=1.5tile
  elements.push({ type: 'cloudBig', x: 8, y: 1 })
  elements.push({ type: 'cloudSmall', x: 22, y: 0 })
  elements.push({ type: 'cloudBig', x: 38, y: 1 })
  elements.push({ type: 'cloudSmall', x: 58, y: 0 })
  elements.push({ type: 'cloudBig', x: 70, y: 1 })
  elements.push({ type: 'cloudSmall', x: 90, y: 0 })
  elements.push({ type: 'cloudBig', x: 102, y: 1 })
  elements.push({ type: 'cloudSmall', x: 122, y: 0 })
  elements.push({ type: 'cloudBig', x: 138, y: 1 })
  elements.push({ type: 'cloudSmall', x: 154, y: 0 })
  elements.push({ type: 'cloudBig', x: 166, y: 1 })
  elements.push({ type: 'cloudSmall', x: 188, y: 0 })
  elements.push({ type: 'cloudBig', x: 202, y: 1 })

  // 山丘和草丛（地面上）- 底部对齐到地面(y=13)，新山丘高度24px=1.5tile
  // 所以y坐标 = 13 - 1.5 = 11.5，取11
  elements.push({ type: 'hillSmall', x: 0, y: 11 })
  elements.push({ type: 'bush', x: 12, y: 11 })
  elements.push({ type: 'bush', x: 44, y: 11 })
  elements.push({ type: 'hillBig', x: 56, y: 11 })
  elements.push({ type: 'bush', x: 70, y: 11 })
  elements.push({ type: 'hillSmall', x: 91, y: 11 })
  elements.push({ type: 'bush', x: 96, y: 11 })
  elements.push({ type: 'bush', x: 118, y: 11 })
  elements.push({ type: 'hillBig', x: 130, y: 11 })
  elements.push({ type: 'bush', x: 145, y: 11 })
  elements.push({ type: 'hillSmall', x: 157, y: 11 })
  elements.push({ type: 'bush', x: 172, y: 11 })
  elements.push({ type: 'bush', x: 192, y: 11 })

  return elements
}

export function isSolidTile(tile: TileType): boolean {
  return tile === TILE.GROUND ||
         tile === TILE.BRICK ||
         tile === TILE.QUESTION ||
         tile === TILE.QUESTION_USED ||
         tile === TILE.PIPE_TOP_LEFT ||
         tile === TILE.PIPE_TOP_RIGHT ||
         tile === TILE.PIPE_BODY_LEFT ||
         tile === TILE.PIPE_BODY_RIGHT
}

export function isQuestionBlock(tile: TileType): boolean {
  return tile === TILE.QUESTION
}

export function isBrick(tile: TileType): boolean {
  return tile === TILE.BRICK
}
