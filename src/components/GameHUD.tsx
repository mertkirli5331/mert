import React, { useState } from 'react';
import { GameStatus2D } from '../game/GameEngine2D';
import { sound } from '../audio/SoundEffects';
import { downloadStandalone2DGame } from '../game/StandaloneExporter2D';
import { 
  Trophy, 
  Gauge, 
  Volume2, 
  VolumeX, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  ShieldAlert, 
  Heart, 
  Play, 
  ArrowRight,
  Shovel,
  Trash2
} from 'lucide-react';

interface GameHUDProps {
  status: GameStatus2D | null;
  onDig: () => void;
  onDump: () => void;
  onNextLevel: () => void;
  onRestartLevel: () => void;
  onSelectLevel: (lvl: number) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  status,
  onDig,
  onDump,
  onNextLevel,
  onRestartLevel,
  onSelectLevel,
}) => {
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  if (!status) return null;

  const { level, levelConfig, score, combo, speed, progressPercent, bucketLoad, gameState, targetObstacleHp } = status;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-sans">
      {/* ---------------- TOP BAR (MINIMAL SPEC BADGE & STATS) ---------------- */}
      <header className="absolute top-4 left-4 right-4 flex flex-wrap justify-between items-start gap-4">
        {/* Mission Level Badge */}
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-lg p-3 px-4 shadow-xl pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <h1 className="text-sm font-black tracking-wider uppercase text-amber-400">
              {levelConfig.title}
            </h1>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-sm">
            Kum dağlarını kepçenle kaz (E), kumu boşalt (Q) ve yolu aç!
          </p>
        </div>

        {/* Stats Counter Card */}
        <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-700/60 rounded-lg p-2.5 px-4 shadow-xl pointer-events-auto">
          {/* Score */}
          <div className="text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" /> Skor
            </div>
            <div className="text-lg font-black text-amber-400 font-mono">
              {score}
            </div>
          </div>

          <div className="w-px h-7 bg-slate-700" />

          {/* Speed */}
          <div className="text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
              <Gauge className="w-3 h-3 text-cyan-400" /> Hız
            </div>
            <div className="text-lg font-black text-white font-mono">
              {speed} <span className="text-[10px] text-slate-400">km/s</span>
            </div>
          </div>

          <div className="w-px h-7 bg-slate-700" />

          {/* Bucket Sand Load Bar */}
          <div className="text-center min-w-[70px]">
            <div className="text-[10px] uppercase font-bold text-amber-300">Kepçe Kumu</div>
            <div className="text-base font-black font-mono text-amber-400">
              %{bucketLoad}
            </div>
          </div>

          <div className="w-px h-7 bg-slate-700" />

          {/* Progress */}
          <div className="text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">İlerleme</div>
            <div className="text-lg font-black text-emerald-400 font-mono">
              %{progressPercent}
            </div>
          </div>

          {combo > 1 && (
            <>
              <div className="w-px h-7 bg-slate-700" />
              <div className="text-center">
                <div className="text-[10px] uppercase font-bold text-amber-400">Kombo</div>
                <div className="text-lg font-black text-amber-300 font-mono">
                  {combo}x
                </div>
              </div>
            </>
          )}

          {/* Audio & Download Action Buttons */}
          <div className="flex items-center gap-1.5 ml-2 border-l border-slate-700 pl-3">
            <button
              onClick={handleToggleSound}
              title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
              className="p-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={() => downloadStandalone2DGame()}
              title="Çevrimdışı Tek Dosya HTML Olarak İndir (Sıfır Derleme)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>İndir (.html)</span>
            </button>
          </div>
        </div>
      </header>

      {/* ---------------- TARGET OBSTACLE HP BAR (TOP-CENTER) ---------------- */}
      {targetObstacleHp && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-80 max-w-[90vw] bg-slate-900/95 border border-amber-500/40 rounded-lg p-2.5 shadow-2xl pointer-events-none">
          <div className="flex justify-between items-center text-xs font-bold text-amber-400 mb-1">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> {targetObstacleHp.name}
            </span>
            <span className="font-mono text-slate-200">
              {targetObstacleHp.current} / {targetObstacleHp.max} Kalan Kum
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 transition-all duration-150"
              style={{ width: `${Math.max(0, (targetObstacleHp.current / targetObstacleHp.max) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* ---------------- UNIFIED COLLAPSIBLE BOTTOM DOCK ---------------- */}
      <footer
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 transition-transform duration-300 pointer-events-auto ${
          isDockCollapsed ? 'translate-y-full' : 'translate-y-0'
        }`}
      >
        {/* Collapse / Expand Tab Button */}
        <button
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 border-b-0 rounded-t-lg px-3 py-1 text-[11px] font-bold text-slate-300 flex items-center gap-1 shadow-md"
        >
          {isDockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-amber-400" /> Kontrolleri Göster
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-amber-400" /> Gizle
            </>
          )}
        </button>

        {/* Dock Controls Container */}
        <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 px-5 shadow-2xl flex flex-wrap items-center justify-center gap-3 max-w-[94vw]">
          {/* E: DIG / SCOOP BUTTON */}
          <button
            onClick={onDig}
            className="flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm uppercase tracking-wide shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
          >
            <Shovel className="w-5 h-5 text-slate-950 fill-current" />
            <span>KUMU KAZ (E TUŞU)</span>
          </button>

          {/* Q: DUMP SAND BUTTON */}
          <button
            onClick={onDump}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg font-black text-sm uppercase tracking-wide shadow-lg active:scale-95 transition-all ${
              bucketLoad > 0
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 shadow-cyan-500/25'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
            }`}
          >
            <Trash2 className="w-5 h-5" />
            <span>KUMU BOŞALT (Q TUŞU)</span>
          </button>

          {/* Level Switcher Quick Buttons */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1.5 rounded-lg border border-slate-700 text-xs font-bold">
            <span className="text-[10px] text-slate-400 px-1 uppercase">Bölüm:</span>
            {[1, 2, 3].map((lvlNum) => (
              <button
                key={lvlNum}
                onClick={() => onSelectLevel(lvlNum - 1)}
                className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                  level === lvlNum
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                {lvlNum}
              </button>
            ))}
          </div>

          {/* Restart Button */}
          <button
            onClick={onRestartLevel}
            title="Bölümü Baştan Başlat"
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* ---------------- LEVEL CLEAR MODAL (LEVEL 1 & 2) ---------------- */}
      {gameState === 'LEVEL_CLEAR' && (
        <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center p-4 pointer-events-auto z-50">
          <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white mb-1">
              Bölüm {level} Tamamlandı!
            </h2>
            <p className="text-sm text-slate-300 mb-6">
              Yoldaki tüm kum dağlarını kazıp temizledin! Sıradaki bölüme hazırsın.
            </p>

            <div className="bg-slate-800/70 rounded-xl p-4 mb-6 grid grid-cols-2 gap-4 text-left">
              <div>
                <div className="text-xs text-slate-400">Kazanılan Skor</div>
                <div className="text-xl font-black text-amber-400 font-mono">{score}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Tamamlama</div>
                <div className="text-xl font-black text-emerald-400 font-mono">%100</div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={onNextLevel}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
              >
                <span>Sonraki Bölüme Geç</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => downloadStandalone2DGame()}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Oyunu Çevrimdışı Tek Dosya İndir (.html)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- GRAND VICTORY MODAL (PRINCESS RESCUED!) ---------------- */}
      {gameState === 'VICTORY' && (
        <div className="absolute inset-0 bg-slate-950/85 flex items-center justify-center p-4 pointer-events-auto z-50">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400 rounded-2xl p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 text-xs font-black uppercase mb-3">
              <Heart className="w-3.5 h-3.5 fill-current" /> Krallık Kurtarıldı
            </div>

            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 mb-2">
              👑 PRENSESİ KURTARDIN! 👑
            </h2>

            {/* Princess Speech Bubble */}
            <div className="relative bg-slate-800/90 border border-pink-500/30 rounded-xl p-4 my-4 text-slate-200 text-sm leading-relaxed italic">
              <div className="font-bold text-pink-400 not-italic mb-1 flex items-center justify-center gap-1">
                <span>Prenses Aurelia:</span>
              </div>
              &ldquo;Cesur Ekskavatörcüm! Büyülü kum dağını kepçenle kazıp beni bu karanlık zindandan çıkardın! Krallığımız sana minnettar!&rdquo;
            </div>

            {/* Final Statistics */}
            <div className="bg-slate-800/50 rounded-xl p-4 mb-6 grid grid-cols-3 gap-2">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Toplam Skor</div>
                <div className="text-xl font-black text-amber-400 font-mono">{score}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Tamamlanan</div>
                <div className="text-xl font-black text-emerald-400 font-mono">3 / 3 Bölüm</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Kahramanlık</div>
                <div className="text-xl font-black text-pink-400 font-mono">★★★★★</div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => downloadStandalone2DGame()}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Tek Dosya Olarak İndir (HTML/CSS/JS)</span>
              </button>
              <button
                onClick={() => onSelectLevel(0)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>En Baştan Oyna</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
