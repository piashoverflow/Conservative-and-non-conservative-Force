import React from 'react';
import {
  Gauge,
  CheckCircle2,
  AlertCircle,
  Activity,
  Flame,
  ArrowRightLeft,
  Ruler,
  Zap,
} from 'lucide-react';
import { ForceCategory, Language, TelemetryState, ForceAnalysis } from '../types';

interface TelemetryPanelProps {
  lang: Language;
  forceCategory: ForceCategory;
  telemetry: TelemetryState;
  forceAnalysis: ForceAnalysis;
  theme?: 'dark' | 'light';
}

const TelemetryPanelComponent: React.FC<TelemetryPanelProps> = ({
  lang,
  forceCategory,
  telemetry,
  forceAnalysis,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  const {
    workDone,
    closedLoopWork,
    power,
    distanceTraveled,
    path1Work,
    path2Work,
    pos,
    vel,
    acc,
    force,
  } = telemetry;

  const speed = Math.hypot(vel.x, vel.y);
  const forceMag = Math.hypot(force.x, force.y);

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border shadow-xl flex flex-col gap-4 transition-colors duration-200 ${
        isDark
          ? 'bg-slate-900/80 border-slate-800 text-slate-100 backdrop-blur-md'
          : 'bg-white border-slate-300 text-slate-900 shadow-lg'
      }`}
    >
      {/* Telemetry Header */}
      <div className={`flex items-center justify-between border-b pb-2.5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan-600 dark:text-cyan-500" />
          <h2 className={`text-sm font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
            {lang === 'bn' ? 'লাইভ টেলিম্যাট্রি ও তথ্য' : 'Live Physics Telemetry'}
          </h2>
        </div>
        <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-md font-bold">
          REALTIME 60FPS
        </span>
      </div>

      {/* 1. Primary Metrics Cards (Work Done, Closed Loop Work) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Work Done Card */}
        <div
          className={`p-3 rounded-xl border flex flex-col justify-between ${
            isDark ? 'bg-slate-950/90 border-cyan-500/30' : 'bg-cyan-100/80 border-cyan-300 shadow-sm'
          }`}
        >
          <span className={`text-[11px] font-extrabold ${isDark ? 'text-slate-400' : 'text-cyan-950'}`}>
            {lang === 'bn' ? 'মোট কৃতকাজ (W = ∫ F·dr)' : 'Total Work Done (W)'}
          </span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-xl font-extrabold font-mono text-cyan-950 dark:text-cyan-300">
              {workDone >= 0 ? `+${workDone.toFixed(1)}` : workDone.toFixed(1)}
            </span>
            <span className="text-xs text-cyan-900 dark:text-cyan-400 font-mono font-extrabold">Joules</span>
          </div>
          <span className={`text-[10px] font-mono font-extrabold ${isDark ? 'text-slate-400' : 'text-cyan-900'}`}>
            {workDone > 0 ? '✓ Positive Work' : workDone < 0 ? '⚠ Negative/Resistive' : 'Zero Work'}
          </span>
        </div>

        {/* Closed Loop Work Card */}
        <div
          className={`p-3 rounded-xl border flex flex-col justify-between ${
            forceAnalysis.isConservative
              ? isDark
                ? 'bg-emerald-950/40 border-emerald-500/40'
                : 'bg-emerald-100/80 border-emerald-300 shadow-sm'
              : isDark
              ? 'bg-amber-950/40 border-amber-500/40'
              : 'bg-amber-100/80 border-amber-300 shadow-sm'
          }`}
        >
          <span className={`text-[11px] font-extrabold flex items-center gap-1 ${
            forceAnalysis.isConservative
              ? isDark ? 'text-slate-300' : 'text-emerald-950'
              : isDark ? 'text-slate-300' : 'text-amber-950'
          }`}>
            {forceAnalysis.isConservative ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-500" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-700 dark:text-amber-500" />
            )}
            {lang === 'bn' ? 'আবদ্ধ চক্রে কাজ (W_loop)' : 'Closed Loop Work'}
          </span>
          <div className="flex items-baseline gap-1 my-1">
            <span
              className={`text-xl font-extrabold font-mono ${
                forceAnalysis.isConservative
                  ? 'text-emerald-950 dark:text-emerald-300'
                  : 'text-amber-950 dark:text-amber-300'
              }`}
            >
              {Math.abs(closedLoopWork) < 0.05 ? '0.00' : closedLoopWork.toFixed(1)}
            </span>
            <span className="text-xs font-mono font-extrabold text-slate-900 dark:text-slate-300">J</span>
          </div>
          <span className={`text-[10px] font-extrabold ${
            forceAnalysis.isConservative
              ? isDark ? 'text-slate-400' : 'text-emerald-900'
              : isDark ? 'text-slate-400' : 'text-amber-900'
          }`}>
            {forceAnalysis.isConservative
              ? lang === 'bn'
                ? '✓ W_closed = 0 (সংরক্ষণশীল)'
                : '✓ W_closed = 0 (Conservative)'
              : lang === 'bn'
              ? '⚠ W_closed ≠ 0 (অসংরক্ষণশীল)'
              : '⚠ W_closed ≠ 0 (Dissipative)'}
          </span>
        </div>
      </div>

      {/* 2. Path Independence Comparison */}
      <div
        className={`p-3 rounded-xl border flex flex-col gap-2 ${
          isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-100/80 border-slate-300 shadow-sm'
        }`}
      >
        <div className={`flex justify-between items-center text-xs font-extrabold ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>
          <span className="flex items-center gap-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5 text-purple-700 dark:text-purple-500" />
            {lang === 'bn' ? 'গতিপথ নিরপেক্ষতা পরীক্ষা' : 'Path Independence Test'}
          </span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded font-black ${
              forceAnalysis.isConservative
                ? isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-200 text-slate-950 border border-emerald-500 shadow-sm'
                : isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-200 text-slate-950 border border-amber-500 shadow-sm'
            }`}
          >
            {forceAnalysis.isConservative
              ? lang === 'bn'
                ? 'পথ নিরপেক্ষ'
                : 'Path Independent'
              : lang === 'bn'
              ? 'পথের ওপর নির্ভরশীল'
              : 'Path Dependent'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
          <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300 shadow-sm'}`}>
            <span className={`text-[10px] block font-extrabold ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>Path 1 (Straight):</span>
            <span className="text-cyan-950 dark:text-cyan-300 font-extrabold">{path1Work.toFixed(1)} J</span>
          </div>
          <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300 shadow-sm'}`}>
            <span className={`text-[10px] block font-extrabold ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>Path 2 (Curved):</span>
            <span className="text-purple-950 dark:text-purple-300 font-extrabold">
              {forceAnalysis.isConservative
                ? `${path1Work.toFixed(1)} J`
                : `${path2Work.toFixed(1)} J`}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Live Vector Numerical Telemetry */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className={`p-2.5 rounded-xl border flex justify-between items-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300 shadow-sm'}`}>
          <span className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>Position (x,y):</span>
          <span className={`font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>
            ({pos.x.toFixed(1)}, {pos.y.toFixed(1)}) m
          </span>
        </div>

        <div className={`p-2.5 rounded-xl border flex justify-between items-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300 shadow-sm'}`}>
          <span className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>Velocity |v|:</span>
          <span className="text-amber-800 dark:text-amber-500 font-extrabold">{speed.toFixed(1)} m/s</span>
        </div>

        <div className={`p-2.5 rounded-xl border flex justify-between items-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300 shadow-sm'}`}>
          <span className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>Force |F|:</span>
          <span className="text-cyan-800 dark:text-cyan-500 font-extrabold">{forceMag.toFixed(1)} N</span>
        </div>

        <div className={`p-2.5 rounded-xl border flex justify-between items-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300 shadow-sm'}`}>
          <span className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>Power (F · v):</span>
          <span className="text-emerald-800 dark:text-emerald-500 font-extrabold">{power.toFixed(1)} W</span>
        </div>
      </div>

      {/* 4. Distance & Path Progress */}
      <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300 shadow-sm'}`}>
        <span className={`flex items-center gap-1.5 font-bold ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>
          <Ruler className="w-3.5 h-3.5 text-slate-600 dark:text-slate-500" />
          {lang === 'bn' ? 'মোট অতিক্রান্ত দূরত্ব:' : 'Distance Traveled:'}
        </span>
        <span className={`font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>{distanceTraveled.toFixed(2)} m</span>
      </div>
    </div>
  );
};

export const TelemetryPanel = React.memo(TelemetryPanelComponent);
