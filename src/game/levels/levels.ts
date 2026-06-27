import { TileType, TILE, BackgroundElement } from './Level1'
import { MovingPlatform } from '../entities/MovingPlatform'

// ===== 字符地图系统 =====
// 每个字符代表一个绘制单元，让关卡地图用二维数组(字符串数组)清晰描述
const CHAR_MAP: Record<string, TileType> = {
  ' ': TILE.EMPTY,      // 空气
  '.': TILE.EMPTY,      // 空气（替代符）
  'X': TILE.GROUND,     // 地面
  'B': TILE.BRICK,      // 砖块
  '?': TILE.QUESTION,   // 问号块
  '[': TILE.PIPE_TOP_LEFT,   // 管道顶左
  ']': TILE.PIPE_TOP_RIGHT,  // 管道顶右
  '{': TILE.PIPE_BODY_LEFT,  // 管道身左
  '}': TILE.PIPE_BODY_RIGHT, // 管道身右
  'o': TILE.COIN,       // 金币
  'M': TILE.MARIO_START,// 马里奥起点
  'g': TILE.GOOMBA,     // 蘑菇怪
  'k': TILE.KOOPA,      // 乌龟（新增）
  'F': TILE.FLAG_POLE,  // 旗杆位置标记
  'K': TILE.CASTLE,     // 城堡位置标记
}

// 解析字符地图为 TileType 二维数组
function parseLevelMap(rows: string[]): TileType[][] {
  const height = rows.length
  const width = rows[0].length
  const map: TileType[][] = []
  for (let y = 0; y < height; y++) {
    const row: TileType[] = []
    for (let x = 0; x < width; x++) {
      const ch = rows[y][x] || ' '
      row.push(CHAR_MAP[ch] !== undefined ? CHAR_MAP[ch] : TILE.EMPTY)
    }
    map.push(row)
  }
  return map
}

// 移动平台定义（关卡数据中独立配置）
export interface PlatformDef {
  x: number       // 起始x（像素）
  y: number       // 起始y（像素）
  width: number   // 平台宽度（像素）
  range: number   // 移动范围（像素）
  axis: 'horizontal' | 'vertical'
  speed: number
}

// 关卡数据接口
export interface LevelData {
  name: string          // 关卡名 "1-1", "1-2", "1-3"
  map: TileType[][]     // 二维数组地图
  background: BackgroundElement[]
  flagX: number         // 旗杆x坐标(tile)
  castleX: number       // 城堡x坐标(tile)
  castleY: number       // 城堡y坐标(tile)
  powerupBlocks: Set<string>  // 掉落道具的问号块 "x,y"
  platforms: PlatformDef[]    // 移动平台定义
  theme: 'overworld' | 'underground' | 'sky'  // 主题（影响配色）
}

// 辅助：生成空行
function emptyLine(width: number): string {
  return ' '.repeat(width)
}

// ===== 关卡 1 (1-1): 经典地面关 - 平原风格 =====
function createLevel1Data(): LevelData {
  const W = 228
  const H = 15
  const rows: string[] = []
  for (let i = 0; i < H; i++) rows.push(emptyLine(W))

  const setChar = (x: number, y: number, ch: string) => {
    if (y >= 0 && y < H && x >= 0 && x < W) {
      rows[y] = rows[y].substring(0, x) + ch + rows[y].substring(x + 1)
    }
  }
  const setPipe = (x: number, topY: number) => {
    setChar(x, topY, '['); setChar(x + 1, topY, ']')
    for (let y = topY + 1; y <= 12; y++) { setChar(x, y, '{'); setChar(x + 1, y, '}') }
  }
  const setStairUp = (startX: number, steps: number) => {
    for (let i = 0; i < steps; i++) {
      for (let y = 13 - (i + 1); y <= 12; y++) setChar(startX + i, y, 'X')
    }
  }

  // 地面：第13、14行，带3个缺口
  for (let x = 0; x < W; x++) {
    if ((x >= 69 && x <= 70) || (x >= 86 && x <= 88) || (x >= 153 && x <= 154)) continue
    setChar(x, 13, 'X'); setChar(x, 14, 'X')
  }

  // 问号块和砖块
  setChar(16, 9, '?')
  setChar(20, 9, 'B'); setChar(21, 9, '?'); setChar(22, 9, 'B'); setChar(23, 9, '?'); setChar(24, 9, 'B')
  setChar(22, 5, '?')
  setPipe(28, 11); setPipe(38, 10); setPipe(46, 9); setPipe(57, 9)
  setChar(71, 9, '?')
  setChar(77, 9, 'B'); setChar(78, 9, '?'); setChar(79, 9, 'B'); setChar(80, 9, '?')
  setChar(81, 9, 'B'); setChar(82, 9, '?'); setChar(83, 9, 'B'); setChar(84, 9, '?')
  setChar(91, 5, 'B'); setChar(94, 9, '?')
  setChar(100, 9, 'B'); setChar(101, 9, '?'); setChar(102, 9, 'B'); setChar(103, 9, '?')
  setChar(104, 9, 'B'); setChar(105, 9, '?'); setChar(106, 9, 'B')
  setChar(109, 5, 'B'); setChar(112, 9, '?'); setChar(118, 9, '?')
  setChar(121, 9, 'B'); setChar(122, 9, '?'); setChar(123, 9, 'B'); setChar(124, 9, '?'); setChar(125, 9, 'B')
  setStairUp(163, 4)
  setStairUp(184, 4)

  setChar(2, 12, 'M')
  // 蘑菇怪
  setChar(22, 12, 'g'); setChar(40, 12, 'g'); setChar(51, 12, 'g'); setChar(52, 12, 'g')
  setChar(80, 12, 'g'); setChar(82, 12, 'g'); setChar(97, 12, 'g'); setChar(98, 12, 'g')
  setChar(130, 12, 'g'); setChar(131, 12, 'g'); setChar(143, 12, 'g'); setChar(144, 12, 'g')
  // 金币
  setChar(11, 7, 'o'); setChar(12, 7, 'o'); setChar(13, 7, 'o')
  setChar(34, 7, 'o'); setChar(35, 7, 'o'); setChar(36, 7, 'o')
  setChar(100, 7, 'o'); setChar(101, 7, 'o'); setChar(102, 7, 'o')
  setChar(103, 7, 'o'); setChar(104, 7, 'o'); setChar(105, 7, 'o')
  setChar(160, 7, 'o'); setChar(161, 7, 'o')

  const background: BackgroundElement[] = [
    { type: 'cloudBig', x: 8, y: 1 }, { type: 'cloudSmall', x: 22, y: 0 },
    { type: 'cloudBig', x: 38, y: 1 }, { type: 'cloudSmall', x: 58, y: 0 },
    { type: 'cloudBig', x: 70, y: 1 }, { type: 'cloudSmall', x: 90, y: 0 },
    { type: 'cloudBig', x: 102, y: 1 }, { type: 'cloudSmall', x: 122, y: 0 },
    { type: 'cloudBig', x: 138, y: 1 }, { type: 'cloudSmall', x: 154, y: 0 },
    { type: 'cloudBig', x: 166, y: 1 }, { type: 'cloudSmall', x: 188, y: 0 },
    { type: 'cloudBig', x: 202, y: 1 },
    { type: 'hillSmall', x: 0, y: 11 }, { type: 'bush', x: 12, y: 11 },
    { type: 'bush', x: 44, y: 11 }, { type: 'hillBig', x: 56, y: 11 },
    { type: 'bush', x: 70, y: 11 }, { type: 'hillSmall', x: 91, y: 11 },
    { type: 'bush', x: 96, y: 11 }, { type: 'bush', x: 118, y: 11 },
    { type: 'hillBig', x: 130, y: 11 }, { type: 'bush', x: 145, y: 11 },
    { type: 'hillSmall', x: 157, y: 11 }, { type: 'bush', x: 172, y: 11 },
    { type: 'bush', x: 192, y: 11 },
  ]

  return {
    name: '1-1',
    map: parseLevelMap(rows),
    background,
    flagX: 189,
    castleX: 198,
    castleY: 8,
    powerupBlocks: new Set(['16,9', '71,9', '94,9', '118,9']),
    platforms: [],
    theme: 'overworld',
  }
}

// ===== 关卡 2 (1-2): 移动平台关 - 峡谷风格 =====
// 特色：大量深坑，必须借助移动平台跨越；高低落差大
function createLevel2Data(): LevelData {
  const W = 240
  const H = 15
  const rows: string[] = []
  for (let i = 0; i < H; i++) rows.push(emptyLine(W))

  const setChar = (x: number, y: number, ch: string) => {
    if (y >= 0 && y < H && x >= 0 && x < W) {
      rows[y] = rows[y].substring(0, x) + ch + rows[y].substring(x + 1)
    }
  }
  const setPipe = (x: number, topY: number) => {
    setChar(x, topY, '['); setChar(x + 1, topY, ']')
    for (let y = topY + 1; y <= 12; y++) { setChar(x, y, '{'); setChar(x + 1, y, '}') }
  }
  const setStairUp = (startX: number, steps: number) => {
    for (let i = 0; i < steps; i++) {
      for (let y = 13 - (i + 1); y <= 12; y++) setChar(startX + i, y, 'X')
    }
  }

  // 地面：分段式，大量深坑（6个深坑，需要移动平台跨越）
  // 段1: 0~30 起始平台
  for (let x = 0; x <= 30; x++) { setChar(x, 13, 'X'); setChar(x, 14, 'X') }
  // 深坑1: 31~44 (14格宽，必须用移动平台)
  // 段2: 45~60 小平台
  for (let x = 45; x <= 60; x++) { setChar(x, 13, 'X'); setChar(x, 14, 'X') }
  // 深坑2: 61~76 (16格宽)
  // 段3: 77~95
  for (let x = 77; x <= 95; x++) { setChar(x, 13, 'X'); setChar(x, 14, 'X') }
  // 深坑3: 96~108 (13格宽)
  // 段4: 109~130
  for (let x = 109; x <= 130; x++) { setChar(x, 13, 'X'); setChar(x, 14, 'X') }
  // 深坑4: 131~143 (13格宽)
  // 段5: 144~165
  for (let x = 144; x <= 165; x++) { setChar(x, 13, 'X'); setChar(x, 14, 'X') }
  // 深坑5: 166~178 (13格宽)
  // 段6: 179~终点
  for (let x = 179; x < W; x++) { setChar(x, 13, 'X'); setChar(x, 14, 'X') }

  // 起始区装饰
  setChar(8, 9, '?')
  setChar(12, 9, 'B'); setChar(13, 9, '?'); setChar(14, 9, 'B')
  setChar(20, 5, 'B'); setChar(21, 5, '?'); setChar(22, 5, 'B')
  setPipe(25, 10)

  // 段2：高空砖块
  for (let x = 48; x <= 55; x++) setChar(x, 8, 'B')
  setChar(50, 8, '?')
  setChar(58, 9, 'g')

  // 段3
  setChar(80, 9, 'B'); setChar(81, 9, '?'); setChar(82, 9, 'B')
  setChar(85, 5, '?')
  setPipe(88, 11)
  setChar(92, 9, 'g')

  // 段4
  setChar(112, 9, '?')
  setChar(118, 9, 'B'); setChar(119, 9, '?'); setChar(120, 9, 'B')
  for (let x = 122; x <= 128; x++) setChar(x, 6, 'B')
  setChar(125, 6, '?')
  setChar(115, 12, 'g'); setChar(126, 12, 'g')

  // 段5
  setStairUp(144, 3)
  setChar(150, 9, '?')
  setChar(154, 5, 'B'); setChar(155, 5, '?')
  setChar(160, 12, 'g'); setChar(161, 12, 'g')

  // 段6：终点
  setStairUp(185, 4)
  setStairUp(205, 4)

  // 马里奥起点
  setChar(2, 12, 'M')

  // 蘑菇怪
  setChar(13, 12, 'g'); setChar(26, 12, 'g')
  setChar(58, 12, 'g')
  setChar(80, 12, 'g'); setChar(92, 12, 'g')
  setChar(115, 12, 'g'); setChar(126, 12, 'g')
  setChar(150, 12, 'g')
  setChar(160, 12, 'g'); setChar(161, 12, 'g')
  setChar(190, 12, 'g')

  // 金币（深坑上方诱导玩家）
  setChar(36, 7, 'o'); setChar(37, 7, 'o'); setChar(38, 7, 'o')
  setChar(66, 7, 'o'); setChar(67, 7, 'o'); setChar(68, 7, 'o')
  setChar(100, 7, 'o'); setChar(101, 7, 'o'); setChar(102, 7, 'o')
  setChar(135, 7, 'o'); setChar(136, 7, 'o'); setChar(137, 7, 'o')
  setChar(170, 7, 'o'); setChar(171, 7, 'o'); setChar(172, 7, 'o')
  // 高空金币
  setChar(50, 6, 'o'); setChar(51, 6, 'o')
  setChar(125, 4, 'o'); setChar(126, 4, 'o')

  const background: BackgroundElement[] = [
    { type: 'cloudBig', x: 6, y: 1 }, { type: 'cloudSmall', x: 20, y: 0 },
    { type: 'cloudBig', x: 40, y: 1 }, { type: 'cloudSmall', x: 60, y: 0 },
    { type: 'cloudBig', x: 80, y: 1 }, { type: 'cloudSmall', x: 100, y: 0 },
    { type: 'cloudBig', x: 120, y: 1 }, { type: 'cloudSmall', x: 140, y: 0 },
    { type: 'cloudBig', x: 160, y: 1 }, { type: 'cloudSmall', x: 180, y: 0 },
    { type: 'cloudBig', x: 200, y: 1 }, { type: 'cloudSmall', x: 220, y: 0 },
    { type: 'hillSmall', x: 3, y: 11 }, { type: 'bush', x: 15, y: 11 },
    { type: 'hillBig', x: 50, y: 11 }, { type: 'bush', x: 82, y: 11 },
    { type: 'hillSmall', x: 114, y: 11 }, { type: 'bush', x: 149, y: 11 },
    { type: 'hillBig', x: 184, y: 11 }, { type: 'bush', x: 210, y: 11 },
  ]

  // 移动平台：5个，跨越深坑
  const platforms: PlatformDef[] = [
    // 深坑1：水平移动平台
    { x: 31 * 16, y: 9 * 16, width: 32, range: 14 * 16, axis: 'horizontal', speed: 1.0 },
    // 深坑2：水平移动平台
    { x: 61 * 16, y: 9 * 16, width: 32, range: 16 * 16, axis: 'horizontal', speed: 1.2 },
    // 深坑3：垂直移动平台
    { x: 100 * 16, y: 6 * 16, width: 32, range: 5 * 16, axis: 'vertical', speed: 0.8 },
    // 深坑4：水平移动平台
    { x: 131 * 16, y: 8 * 16, width: 32, range: 13 * 16, axis: 'horizontal', speed: 1.1 },
    // 深坑5：垂直移动平台
    { x: 170 * 16, y: 5 * 16, width: 32, range: 6 * 16, axis: 'vertical', speed: 0.9 },
  ]

  return {
    name: '1-2',
    map: parseLevelMap(rows),
    background,
    flagX: 215,
    castleX: 224,
    castleY: 8,
    powerupBlocks: new Set(['8,9', '21,5', '50,8', '81,9', '85,5', '112,9', '125,6', '150,9', '155,5']),
    platforms,
    theme: 'overworld',
  }
}

// ===== 关卡 3 (1-3): 乌龟高原关 - 高空跳跃风格 =====
// 特色：多层空中平台，大量乌龟敌人，垂直空间复杂
function createLevel3Data(): LevelData {
  const W = 220
  const H = 15
  const rows: string[] = []
  for (let i = 0; i < H; i++) rows.push(emptyLine(W))

  const setChar = (x: number, y: number, ch: string) => {
    if (y >= 0 && y < H && x >= 0 && x < W) {
      rows[y] = rows[y].substring(0, x) + ch + rows[y].substring(x + 1)
    }
  }
  const setPipe = (x: number, topY: number) => {
    setChar(x, topY, '['); setChar(x + 1, topY, ']')
    for (let y = topY + 1; y <= 12; y++) { setChar(x, y, '{'); setChar(x + 1, y, '}') }
  }
  const setStairUp = (startX: number, steps: number) => {
    for (let i = 0; i < steps; i++) {
      for (let y = 13 - (i + 1); y <= 12; y++) setChar(startX + i, y, 'X')
    }
  }
  const setPlatform = (x: number, y: number, len: number) => {
    for (let i = 0; i < len; i++) setChar(x + i, y, 'B')
  }

  // 地面：分段，带多个缺口
  // 段1: 0~35
  for (let x = 0; x <= 35; x++) { setChar(x, 13, 'X'); setChar(x, 14, 'X') }
  // 缺口: 36~38
  // 段2: 39~75
  for (let x = 39; x <= 75; x++) { setChar(x, 13, 'X'); setChar(x, 14, 'X') }
  // 缺口: 76~79
  // 段3: 80~120
  for (let x = 80; x <= 120; x++) { setChar(x, 13, 'X'); setChar(x, 14, 'X') }
  // 缺口: 121~124
  // 段4: 125~160
  for (let x = 125; x <= 160; x++) { setChar(x, 13, 'X'); setChar(x, 14, 'X') }
  // 缺口: 161~163
  // 段5: 164~终点
  for (let x = 164; x < W; x++) { setChar(x, 13, 'X'); setChar(x, 14, 'X') }

  // 起始区
  setChar(6, 9, '?')
  setChar(10, 9, 'B'); setChar(11, 9, '?'); setChar(12, 9, 'B')
  setChar(8, 5, 'B'); setChar(9, 5, '?')

  // 第一只乌龟（在起始平台巡逻）
  setChar(18, 12, 'k')

  // 缺口1上的高空平台
  setPlatform(34, 8, 7)
  setChar(37, 8, '?')
  setChar(40, 12, 'k')  // 乌龟在缺口后巡逻

  // 段2：多层结构
  setPlatform(45, 10, 4)
  setPlatform(52, 7, 5)
  setChar(54, 7, '?')
  setPlatform(60, 5, 6)
  setChar(63, 5, '?')
  setChar(48, 9, 'g')
  setChar(68, 12, 'k')  // 乌龟

  setPipe(72, 11)

  // 缺口2上的平台
  setPlatform(76, 8, 5)
  setChar(78, 8, '?')

  // 段3：塔楼结构
  setStairUp(82, 4)
  setChar(88, 8, '?')
  setPlatform(92, 6, 8)
  setChar(95, 6, '?')
  setPlatform(102, 9, 5)
  setChar(104, 9, '?')
  setChar(90, 12, 'k')  // 乌龟
  setChar(108, 12, 'g')
  setChar(110, 12, 'k')  // 乌龟

  // 缺口3上的平台
  setPlatform(121, 7, 5)
  setChar(123, 7, '?')

  // 段4
  setStairUp(125, 3)
  setPlatform(130, 5, 6)
  setChar(133, 5, '?')
  setPlatform(140, 8, 5)
  setChar(142, 8, '?')
  setPipe(148, 10)
  setChar(128, 12, 'k')  // 乌龟
  setChar(152, 12, 'g')
  setChar(155, 12, 'k')  // 乌龟

  // 缺口4上的平台
  setPlatform(161, 7, 4)

  // 段5：终点
  setStairUp(166, 5)
  setStairUp(182, 4)
  setChar(195, 12, 'g')

  // 马里奥起点
  setChar(2, 12, 'M')

  // 金币（高空平台诱导）
  setChar(5, 7, 'o'); setChar(6, 7, 'o')
  setChar(35, 5, 'o'); setChar(36, 5, 'o'); setChar(37, 5, 'o')
  setChar(53, 4, 'o'); setChar(54, 4, 'o')
  setChar(62, 3, 'o'); setChar(63, 3, 'o'); setChar(64, 3, 'o')
  setChar(77, 5, 'o'); setChar(78, 5, 'o')
  setChar(94, 3, 'o'); setChar(95, 3, 'o'); setChar(96, 3, 'o')
  setChar(104, 7, 'o')
  setChar(122, 4, 'o'); setChar(123, 4, 'o')
  setChar(132, 3, 'o'); setChar(133, 3, 'o'); setChar(134, 3, 'o')
  setChar(142, 6, 'o'); setChar(143, 6, 'o')
  setChar(175, 7, 'o'); setChar(176, 7, 'o')

  const background: BackgroundElement[] = [
    { type: 'cloudBig', x: 5, y: 1 }, { type: 'cloudSmall', x: 18, y: 0 },
    { type: 'cloudBig', x: 32, y: 1 }, { type: 'cloudSmall', x: 48, y: 0 },
    { type: 'cloudBig', x: 62, y: 1 }, { type: 'cloudSmall', x: 78, y: 0 },
    { type: 'cloudBig', x: 92, y: 1 }, { type: 'cloudSmall', x: 108, y: 0 },
    { type: 'cloudBig', x: 122, y: 1 }, { type: 'cloudSmall', x: 138, y: 0 },
    { type: 'cloudBig', x: 152, y: 1 }, { type: 'cloudSmall', x: 168, y: 0 },
    { type: 'cloudBig', x: 182, y: 1 }, { type: 'cloudSmall', x: 198, y: 0 },
    { type: 'hillSmall', x: 2, y: 11 }, { type: 'bush', x: 12, y: 11 },
    { type: 'hillBig', x: 42, y: 11 }, { type: 'bush', x: 55, y: 11 },
    { type: 'hillSmall', x: 70, y: 11 }, { type: 'bush', x: 85, y: 11 },
    { type: 'hillBig', x: 100, y: 11 }, { type: 'bush', x: 115, y: 11 },
    { type: 'hillSmall', x: 130, y: 11 }, { type: 'bush', x: 145, y: 11 },
    { type: 'hillBig', x: 158, y: 11 }, { type: 'bush', x: 172, y: 11 },
    { type: 'hillSmall', x: 188, y: 11 }, { type: 'bush', x: 200, y: 11 },
  ]

  return {
    name: '1-3',
    map: parseLevelMap(rows),
    background,
    flagX: 198,
    castleX: 207,
    castleY: 8,
    powerupBlocks: new Set([
      '6,9', '11,9', '9,5', '37,8', '54,7', '63,5',
      '78,8', '88,8', '95,6', '104,9', '123,7',
      '133,5', '142,8',
    ]),
    platforms: [],
    theme: 'sky',
  }
}

// 所有关卡数据
export const LEVELS: LevelData[] = [
  createLevel1Data(),
  createLevel2Data(),
  createLevel3Data(),
]

export const TOTAL_LEVELS = LEVELS.length

// 从 PlatformDef 创建 MovingPlatform 实例
export function createPlatforms(defs: PlatformDef[]): MovingPlatform[] {
  return defs.map(d => new MovingPlatform(d.x, d.y, d.width, d.range, d.axis, d.speed))
}
