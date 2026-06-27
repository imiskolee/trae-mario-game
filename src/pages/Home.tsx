import { useState, useCallback } from "react";
import { GameCanvas } from "@/components/GameCanvas";
import { sound } from "@/game/engine/SoundManager";

export default function Home() {
  const [muted, setMuted] = useState(false);

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    sound.setEnabled(!next);
    if (next) {
      sound.stopMusic();
    }
  }, [muted]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'monospace', letterSpacing: '2px' }}>
          SUPER MARIO BROS.
        </h1>
        <p className="text-gray-400 text-sm">World 1-1 · Canvas Edition</p>
      </div>

      <div className="relative">
        <GameCanvas />
        <button
          onClick={toggleMute}
          className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1 rounded border border-gray-600 transition-colors"
          style={{ fontFamily: 'monospace' }}
          title={muted ? "开启音效" : "静音"}
        >
          {muted ? "🔇 MUTED" : "🔊 SOUND"}
        </button>
      </div>

      <div className="mt-6 text-center text-gray-500 text-sm">
        <p className="mb-1">
          <span className="text-yellow-500">← →</span> 移动 &nbsp;·&nbsp;
          <span className="text-yellow-500">↑ / SPACE</span> 跳跃 &nbsp;·&nbsp;
          <span className="text-yellow-500">SHIFT</span> 吐火球
        </p>
        <p>按空格键开始游戏</p>
      </div>
    </div>
  );
}
