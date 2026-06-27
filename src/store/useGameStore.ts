import { create } from 'zustand'

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover' | 'win' | 'levelComplete'

interface GameStore {
  gameState: GameState
  score: number
  coins: number
  lives: number
  time: number
  world: string
  currentLevel: number  // 当前关卡索引(0-based)
  totalLevels: number   // 总关卡数
  setGameState: (state: GameState) => void
  addScore: (points: number) => void
  addCoin: () => void
  loseLife: () => void
  setTime: (time: number) => void
  setWorld: (world: string) => void
  nextLevel: () => void  // 进入下一关
  resetGame: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: 'menu',
  score: 0,
  coins: 0,
  lives: 3,
  time: 400,
  world: '1-1',
  currentLevel: 0,
  totalLevels: 3,
  setGameState: (state) => set({ gameState: state }),
  addScore: (points) => set((state) => ({ score: state.score + points })),
  addCoin: () => set((state) => {
    const newCoins = state.coins + 1
    if (newCoins >= 100) {
      return { coins: 0, lives: state.lives + 1 }
    }
    return { coins: newCoins }
  }),
  loseLife: () => set((state) => {
    const newLives = state.lives - 1
    if (newLives <= 0) {
      return { lives: 0, gameState: 'gameover' }
    }
    return { lives: newLives }
  }),
  setTime: (time) => set({ time }),
  setWorld: (world) => set({ world }),
  nextLevel: () => set((state) => {
    const next = state.currentLevel + 1
    if (next >= state.totalLevels) {
      // 通关全部关卡
      return { currentLevel: 0, world: '1-1', gameState: 'win' }
    }
    return {
      currentLevel: next,
      world: `1-${next + 1}`,
      gameState: 'playing',
      time: 400,
    }
  }),
  resetGame: () => set({
    gameState: 'menu',
    score: 0,
    coins: 0,
    lives: 3,
    time: 400,
    currentLevel: 0,
    world: '1-1',
  }),
}))
