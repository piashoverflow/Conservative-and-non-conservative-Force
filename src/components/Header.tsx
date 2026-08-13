import React from 'react';
import {
  Atom,
  RotateCcw,
  HelpCircle,
  Sparkles,
  Volume2,
  VolumeX,
  Languages,
  BookOpen,
  Sun,
  Moon,
} from 'lucide-react';
import { Language, PresetScenario } from '../types';
import { PRESETS } from '../utils/physicsEngine';

interface HeaderProps {
  lang: Language;
  setLang: (lang: Language) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  activePresetId: string;
  onSelectPreset: (preset: PresetScenario) => void;
  onReset: () => void;
  onOpenHelp: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const HeaderComponent: React.FC<HeaderProps> = ({
  lang,
  setLang,
  theme,
  setTheme,
  activePresetId,
  onSelectPreset,
  onReset,
  onOpenHelp,
  soundEnabled,
  setSoundEnabled,
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      className={`sticky top-0 z-40 border-b px-3 sm:px-6 py-2.5 shadow-md transition-colors duration-200 ${
        isDark
          ? 'bg-slate-950/90 border-slate-800 text-slate-100 backdrop-blur-md'
          : 'bg-white border-slate-300 text-slate-900 backdrop-blur-md shadow-sm'
      }`}
    >
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Title & Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 text-cyan-500 shadow-md">
            <Atom className="w-6 h-6 animate-spin-slow text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className={`text-lg md:text-xl font-extrabold tracking-tight ${
                  isDark
                    ? 'bg-gradient-to-r from-cyan-300 via-emerald-300 to-cyan-100 bg-clip-text text-transparent'
                    : 'text-slate-900'
                }`}
              >
                {lang === 'bn'
                  ? 'সংরক্ষণশীল ও অসংরক্ষণশীল বল সিমুলেটর'
                  : 'Conservative vs. Non-Conservative Forces Lab'}
              </h1>
              <span
                className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isDark
                    ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                    : 'bg-cyan-100 text-cyan-900 border-cyan-300'
                }`}
              >
                <BookOpen className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                Physics Lab - Work, Energy & Power
              </span>
            </div>
            <p
              className={`text-xs flex items-center gap-1.5 font-semibold ${
                isDark ? 'text-slate-400' : 'text-slate-700'
              }`}
            >
              <span>
                {lang === 'bn'
                  ? 'কাজ, ক্ষমতা ও শক্তি (Work, Energy & Power)'
                  : 'Mechanics & Vector Calculus'}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                {lang === 'bn' ? 'ক্যালকুলাস ও ভেক্টর বিশ্লেষণ' : 'Vector Calculus Verified'}
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls & Far Right UDVASH Branding */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`p-1.5 rounded-xl border transition-all active:scale-95 ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 text-amber-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 font-bold border transition-all active:scale-95 ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border-slate-700'
                : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border-cyan-300'
            }`}
            title={lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
          >
            <Languages className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-500" />
            <span>{lang === 'bn' ? 'ENGLISH' : 'বাংলা'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-xl border transition-all ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
            title={soundEnabled ? 'Mute Audio SFX' : 'Enable Audio SFX'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-cyan-500" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Reset Button */}
          <button
            onClick={onReset}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 font-bold border transition-all active:scale-95 ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
            title="Reset Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
            <span>{lang === 'bn' ? 'রিসেট' : 'Reset'}</span>
          </button>

          {/* Help / Tutorial Button */}
          <button
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-800 dark:text-cyan-300 border border-cyan-500/40 rounded-xl px-3 py-1.5 font-bold transition-all shadow-sm active:scale-95"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'টিউটোরিয়াল' : 'Lab Guide'}</span>
          </button>

          {/* UDVASH Brand Badge (Far Right) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-extrabold text-xs tracking-wider shadow-md uppercase border border-rose-400/40 ml-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
            <span>UDVASH</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export const Header = React.memo(HeaderComponent);
