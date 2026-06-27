export class InputManager {
  private keys: Set<string> = new Set()
  private justPressed: Set<string> = new Set()

  constructor() {
    window.addEventListener('keydown', this.handleKeyDown.bind(this))
    window.addEventListener('keyup', this.handleKeyUp.bind(this))
  }

  private handleKeyDown(e: KeyboardEvent) {
    const key = this.normalizeKey(e.key)
    if (!this.keys.has(key)) {
      this.justPressed.add(key)
    }
    this.keys.add(key)
    
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault()
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    const key = this.normalizeKey(e.key)
    this.keys.delete(key)
  }

  private normalizeKey(key: string): string {
    switch (key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        return 'left'
      case 'ArrowRight':
      case 'd':
      case 'D':
        return 'right'
      case 'ArrowUp':
      case 'w':
      case 'W':
      case ' ':
        return 'jump'
      case 'ArrowDown':
      case 's':
      case 'S':
        return 'down'
      case 'Shift':
        return 'run'
      default:
        return key.toLowerCase()
    }
  }

  isPressed(action: string): boolean {
    return this.keys.has(action)
  }

  wasJustPressed(action: string): boolean {
    return this.justPressed.has(action)
  }

  update() {
    this.justPressed.clear()
  }

  clear() {
    this.keys.clear()
    this.justPressed.clear()
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this))
    window.removeEventListener('keyup', this.handleKeyUp.bind(this))
  }
}
