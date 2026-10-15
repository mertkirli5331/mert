import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine2D, GameStatus2D } from './game/GameEngine2D';
import { GameHUD } from './components/GameHUD';
import { HelpCircle, Keyboard, Smartphone, Shovel, Trash2 } from 'lucide-react';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine2D | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus2D | null>(null);
  const [showControlsGuide, setShowControlsGuide] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize 2D Game Engine
    const engine = new GameEngine2D(containerRef.current);
    engineRef.current = engine;

    engine.onUpdateStatus = (status: GameStatus2D) => {
      setGameStatus({ ...status });
    };

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const handleDig = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.triggerDig();
    }
  }, []);

  const handleDump = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.triggerDump();
    }
  }, []);

  const handleNextLevel = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.nextLevel();
    }
  }, []);

  const handleRestartLevel = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.loadLevel(engineRef.current.currentLevelIndex);
    }
  }, []);

  const handleSelectLevel = useCallback((lvlIndex: number) => {
    if (engineRef.current) {
      engineRef.current.loadLevel(lvlIndex);
    }
  }, []);

  // Virtual touch controls for mobile/tablet
  const handleTouchKey = (key: string, isDown: boolean) => {
    if (engineRef.current) {
      engineRef.current.keys[key.toLowerCase()] = isDown;
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* 2D HTML5 Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Interactive HUD Overlay */}
      <GameHUD
        status={gameStatus}
        onDig={handleDig}
        onDump={handleDump}
        onNextLevel={handleNextLevel}
        onRestartLevel={handleRestartLevel}
        onSelectLevel={handleSelectLevel}
      />

      {/* Controls Help Guide Toggle */}
      <button
        onClick={() => setShowControlsGuide(!showControlsGuide)}
        className="absolute top-4 right-4 z-20 p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 shadow-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
      >
        <HelpCircle className="w-4 h-4 text-amber-400" />
        <span className="hidden sm:inline">Kontroller</span>
      </button>

      {/* On-Screen Mobile Touch Action Buttons (E: Kaz, Q: Boşalt) */}
      <div className="absolute bottom-24 right-4 z-10 flex flex-col gap-2 sm:hidden pointer-events-auto">
        <button
          onClick={handleDig}
          className="w-14 h-14 rounded-xl bg-amber-500 border border-yellow-300 text-slate-950 font-black text-xs flex flex-col items-center justify-center shadow-lg active:scale-95"
        >
          <Shovel className="w-5 h-5 fill-current" />
          <span>KAZ (E)</span>
        </button>
        <button
          onClick={handleDump}
          className="w-14 h-14 rounded-xl bg-cyan-600 border border-cyan-400 text-white font-black text-xs flex flex-col items-center justify-center shadow-lg active:scale-95"
        >
          <Trash2 className="w-5 h-5" />
          <span>BOŞALT (Q)</span>
        </button>
      </div>

      {/* On-Screen Mobile Touch D-Pad */}
      <div className="absolute bottom-24 left-4 z-10 flex flex-col items-center gap-1 sm:hidden pointer-events-auto">
        <button
          onPointerDown={() => handleTouchKey('w', true)}
          onPointerUp={() => handleTouchKey('w', false)}
          onPointerLeave={() => handleTouchKey('w', false)}
          className="w-12 h-12 rounded-lg bg-slate-900/80 border border-slate-700 text-white font-bold flex items-center justify-center active:bg-amber-500 active:text-black"
        >
          ▲
        </button>
        <div className="flex gap-1">
          <button
            onPointerDown={() => handleTouchKey('a', true)}
            onPointerUp={() => handleTouchKey('a', false)}
            onPointerLeave={() => handleTouchKey('a', false)}
            className="w-12 h-12 rounded-lg bg-slate-900/80 border border-slate-700 text-white font-bold flex items-center justify-center active:bg-amber-500 active:text-black"
          >
            ◀
          </button>
          <button
            onPointerDown={() => handleTouchKey('s', true)}
            onPointerUp={() => handleTouchKey('s', false)}
            onPointerLeave={() => handleTouchKey('s', false)}
            className="w-12 h-12 rounded-lg bg-slate-900/80 border border-slate-700 text-white font-bold flex items-center justify-center active:bg-amber-500 active:text-black"
          >
            ▼
          </button>
          <button
            onPointerDown={() => handleTouchKey('d', true)}
            onPointerUp={() => handleTouchKey('d', false)}
            onPointerLeave={() => handleTouchKey('d', false)}
            className="w-12 h-12 rounded-lg bg-slate-900/80 border border-slate-700 text-white font-bold flex items-center justify-center active:bg-amber-500 active:text-black"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Controls Modal Guide */}
      {showControlsGuide && (
        <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-amber-400 flex items-center gap-2">
                <Keyboard className="w-5 h-5" /> Kum Kazma Kontrolleri
              </h3>
              <button
                onClick={() => setShowControlsGuide(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex justify-between items-center bg-slate-800/60 p-2.5 rounded-lg border border-amber-500/30">
                <span className="font-bold text-amber-400">Kum Dağını Kaz / Doldur</span>
                <span className="font-mono bg-amber-500 text-black px-2.5 py-0.5 rounded font-black">E Tuşu</span>
              </div>
              <div className="flex justify-between items-center bg-slate-800/60 p-2.5 rounded-lg border border-cyan-500/30">
                <span className="font-bold text-cyan-400">Kepçedeki Kumu Boşalt</span>
                <span className="font-mono bg-cyan-500 text-black px-2.5 py-0.5 rounded font-black">Q Tuşu</span>
              </div>
              <div className="flex justify-between items-center bg-slate-800/60 p-2.5 rounded-lg">
                <span>İleri / Geri Sürüş</span>
                <span className="font-mono bg-slate-700 px-2 py-0.5 rounded text-amber-300 font-bold">A / D veya ← / →</span>
              </div>
              <div className="flex justify-between items-center bg-slate-800/60 p-2.5 rounded-lg">
                <span>Bom Kolunu Kaldır / İndir</span>
                <span className="font-mono bg-slate-700 px-2 py-0.5 rounded text-amber-300 font-bold">W / S veya ↑ / ↓</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Dokunmatik ekranda sağdaki KAZ (E) ve BOŞALT (Q) butonlarına dokunabilirsiniz.</span>
            </div>

            <button
              onClick={() => setShowControlsGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm uppercase transition-colors"
            >
              Anladım, Oyuna Dön
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
