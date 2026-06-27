// 8-bit 风格音效管理器（使用 Web Audio API 生成方波音效，无需外部音频文件）
// 模拟 NES 的 2A03 音源芯片音色

type WaveType = 'square' | 'triangle' | 'sawtooth' | 'sine'

interface ToneOptions {
  freq: number          // 频率 Hz
  duration: number      // 持续时间 秒
  type?: WaveType       // 波形，默认方波
  volume?: number       // 音量 0~1，默认 0.15
  sweep?: number        // 频率扫频（每秒变化量 Hz），0=不扫
  delay?: number        // 延迟开始 秒
  glideTo?: number      // 滑动到目标频率
}

export class SoundManager {
  private static instance: SoundManager
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private enabled: boolean = true
  private musicNodes: { osc: OscillatorNode; gain: GainNode }[] = []
  private musicPlaying: boolean = false

  private constructor() {}

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager()
    }
    return SoundManager.instance
  }

  // 必须在用户首次交互后调用以解锁 AudioContext
  init() {
    if (this.ctx) return
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext
      this.ctx = new Ctx()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.4
      this.masterGain.connect(this.ctx.destination)
    } catch (e) {
      console.warn('Web Audio API 不可用', e)
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (!enabled) {
      this.stopMusic()
    }
  }

  isEnabled(): boolean {
    return this.enabled
  }

  // 播放一个音调
  private playTone(opt: ToneOptions) {
    if (!this.ctx || !this.masterGain || !this.enabled) return
    const ctx = this.ctx
    const now = ctx.currentTime + (opt.delay || 0)

    const osc = ctx.createOscillator()
    osc.type = opt.type || 'square'
    osc.frequency.setValueAtTime(opt.freq, now)

    // 频率扫频/滑动
    if (opt.glideTo && opt.duration > 0) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(1, opt.glideTo),
        now + opt.duration
      )
    } else if (opt.sweep) {
      const endFreq = Math.max(1, opt.freq + opt.sweep * opt.duration)
      osc.frequency.linearRampToValueAtTime(endFreq, now + opt.duration)
    }

    const gain = ctx.createGain()
    const vol = opt.volume ?? 0.15
    // 简单 ADSR 包络
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(vol, now + 0.005)
    gain.gain.linearRampToValueAtTime(vol * 0.7, now + opt.duration * 0.3)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + opt.duration)

    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(now)
    osc.stop(now + opt.duration + 0.05)
  }

  // ===== 音效 =====

  // 跳跃（小马里奥：升调）
  jump() {
    this.playTone({ freq: 380, glideTo: 760, duration: 0.18, type: 'square', volume: 0.18 })
  }

  // 大马里奥跳跃（略低）
  bigJump() {
    this.playTone({ freq: 320, glideTo: 640, duration: 0.2, type: 'square', volume: 0.18 })
  }

  // 收集金币（经典两音）
  coin() {
    this.playTone({ freq: 988, duration: 0.07, type: 'square', volume: 0.16 })
    this.playTone({ freq: 1319, duration: 0.18, type: 'square', volume: 0.16, delay: 0.07 })
  }

  // 踩蘑菇怪（短促降调）
  stomp() {
    this.playTone({ freq: 180, glideTo: 90, duration: 0.12, type: 'square', volume: 0.2 })
  }

  // 踢火球命中敌人
  kick() {
    this.playTone({ freq: 200, glideTo: 80, duration: 0.15, type: 'square', volume: 0.2 })
  }

  // 头顶撞砖块/问号块（闷响）
  bump() {
    this.playTone({ freq: 160, duration: 0.08, type: 'square', volume: 0.15 })
  }

  // 砖块碎裂
  brickBreak() {
    this.playTone({ freq: 240, glideTo: 80, duration: 0.15, type: 'square', volume: 0.18 })
    this.playTone({ freq: 120, duration: 0.1, type: 'sawtooth', volume: 0.1, delay: 0.03 })
  }

  // 道具出现（升调）
  powerupAppear() {
    this.playTone({ freq: 392, duration: 0.08, type: 'square', volume: 0.15 })
    this.playTone({ freq: 523, duration: 0.08, type: 'square', volume: 0.15, delay: 0.08 })
    this.playTone({ freq: 659, duration: 0.08, type: 'square', volume: 0.15, delay: 0.16 })
  }

  // 吃蘑菇长大（升调和弦）
  powerup() {
    const notes = [392, 523, 659, 784]
    notes.forEach((f, i) => {
      this.playTone({ freq: f, duration: 0.1, type: 'square', volume: 0.15, delay: i * 0.04 })
    })
  }

  // 吃星星（快速琶音）
  star() {
    const notes = [523, 659, 784, 1047, 1319]
    notes.forEach((f, i) => {
      this.playTone({ freq: f, duration: 0.06, type: 'square', volume: 0.14, delay: i * 0.03 })
    })
  }

  // 发射火球
  fireball() {
    this.playTone({ freq: 600, glideTo: 200, duration: 0.12, type: 'square', volume: 0.14 })
  }

  // 受伤（降调）
  hurt() {
    this.playTone({ freq: 440, glideTo: 220, duration: 0.3, type: 'square', volume: 0.18 })
  }

  // 死亡（经典死亡音效）
  die() {
    const notes = [523, 494, 440, 392, 349, 330, 294, 262]
    notes.forEach((f, i) => {
      this.playTone({ freq: f, duration: 0.12, type: 'square', volume: 0.18, delay: i * 0.1 })
    })
  }

  // 降旗（滑下音）
  flagpole() {
    this.playTone({ freq: 1047, glideTo: 262, duration: 0.8, type: 'square', volume: 0.16 })
  }

  // 关卡完成（胜利和弦）
  levelComplete() {
    const seq = [
      { f: 523, t: 0 },
      { f: 659, t: 0.1 },
      { f: 784, t: 0.2 },
      { f: 1047, t: 0.3 },
      { f: 784, t: 0.5 },
      { f: 1047, t: 0.6 },
      { f: 1319, t: 0.7 },
    ]
    seq.forEach(n => {
      this.playTone({ freq: n.f, duration: 0.18, type: 'square', volume: 0.16, delay: n.t })
    })
  }

  // 全部通关（更长胜利曲）
  gameWin() {
    const seq = [
      { f: 523, t: 0 }, { f: 659, t: 0.12 }, { f: 784, t: 0.24 },
      { f: 1047, t: 0.36 }, { f: 784, t: 0.5 }, { f: 1047, t: 0.62 },
      { f: 1319, t: 0.74 }, { f: 1047, t: 0.9 }, { f: 1319, t: 1.0 },
      { f: 1568, t: 1.12 },
    ]
    seq.forEach(n => {
      this.playTone({ freq: n.f, duration: 0.22, type: 'square', volume: 0.16, delay: n.t })
    })
  }

  // 菜单按键确认
  button() {
    this.playTone({ freq: 880, duration: 0.06, type: 'square', volume: 0.12 })
  }

  // 1up 加生命
  oneUp() {
    this.playTone({ freq: 784, duration: 0.08, type: 'square', volume: 0.15 })
    this.playTone({ freq: 1047, duration: 0.15, type: 'square', volume: 0.15, delay: 0.08 })
  }

  // 暂停
  pause() {
    this.playTone({ freq: 330, duration: 0.1, type: 'square', volume: 0.12 })
  }

  // ===== 背景音乐 =====
  // 简单循环背景音乐（NES 风格主旋律片段）
  startMusic() {
    if (!this.ctx || !this.masterGain || !this.enabled || this.musicPlaying) return
    this.musicPlaying = true
    this.playMusicLoop()
  }

  stopMusic() {
    this.musicPlaying = false
    this.musicNodes.forEach(({ osc, gain }) => {
      try {
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx!.currentTime + 0.1)
        osc.stop(this.ctx!.currentTime + 0.15)
      } catch (e) {}
    })
    this.musicNodes = []
  }

  // 简化的循环旋律（基于 C 大调）
  private melodyIndex = 0
  private readonly melody: { freq: number; dur: number }[] = [
    { freq: 659, dur: 0.15 }, { freq: 659, dur: 0.15 }, { freq: 0, dur: 0.15 },
    { freq: 659, dur: 0.15 }, { freq: 0, dur: 0.15 }, { freq: 523, dur: 0.15 },
    { freq: 659, dur: 0.15 }, { freq: 0, dur: 0.15 }, { freq: 784, dur: 0.3 },
    { freq: 0, dur: 0.3 }, { freq: 392, dur: 0.3 }, { freq: 0, dur: 0.3 },
    { freq: 523, dur: 0.15 }, { freq: 0, dur: 0.15 }, { freq: 392, dur: 0.15 },
    { freq: 0, dur: 0.15 }, { freq: 330, dur: 0.3 }, { freq: 0, dur: 0.3 },
  ]

  private playMusicLoop() {
    if (!this.musicPlaying || !this.ctx) return
    const note = this.melody[this.melodyIndex]
    const ctx = this.ctx
    const now = ctx.currentTime

    if (note.freq > 0) {
      const osc = ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.value = note.freq
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.08, now + 0.01)
      gain.gain.linearRampToValueAtTime(0.06, now + note.dur * 0.7)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.dur)
      osc.connect(gain)
      gain.connect(this.masterGain!)
      osc.start(now)
      osc.stop(now + note.dur + 0.02)
      this.musicNodes.push({ osc, gain })
      // 清理已结束的节点
      this.musicNodes = this.musicNodes.filter(n => true)
    }

    // 低音伴奏（每两拍一个低音）
    if (this.melodyIndex % 4 === 0) {
      const bassOsc = ctx.createOscillator()
      bassOsc.type = 'triangle'
      bassOsc.frequency.value = 131 // C3
      const bassGain = ctx.createGain()
      bassGain.gain.setValueAtTime(0, now)
      bassGain.gain.linearRampToValueAtTime(0.06, now + 0.01)
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4)
      bassOsc.connect(bassGain)
      bassGain.connect(this.masterGain!)
      bassOsc.start(now)
      bassOsc.stop(now + 0.45)
    }

    this.melodyIndex = (this.melodyIndex + 1) % this.melody.length
    // 排程下一个音符
    setTimeout(() => this.playMusicLoop(), note.dur * 1000)
  }
}

// 导出单例
export const sound = SoundManager.getInstance()
