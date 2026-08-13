import React from 'react';
import { Flame, Zap, Shield, BatteryCharging, ShieldAlert } from 'lucide-react';
import { ForceCategory, Language, TelemetryState } from '../types';

interface EnergyBarChartProps {
  lang: Language;
  forceCategory: ForceCategory;
  telemetry: TelemetryState;
  isConservative: boolean;
  theme?: 'dark' | 'light';
}

const EnergyBarChartComponent: React.FC<EnergyBarChartProps> = ({
  lang,
  forceCategory,
  telemetry,
  isConservative,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const { kineticEnergy, potentialEnergy, thermalEnergy, totalEnergy } = telemetry;

  // Max scale calculation for bar lengths
  const maxEnergy = Math.max(10, totalEnergy, kineticEnergy + potentialEnergy + thermalEnergy);

  const kePercent = Math.min(100, Math.max(0, (kineticEnergy / maxEnergy) * 100));
  const pePercent = Math.min(100, Math.max(0, (potentialEnergy / maxEnergy) * 100));
  const heatPercent = Math.min(100, Math.max(0, (thermalEnergy / maxEnergy) * 100));

  return (
    <div
      className={`rounded-2xl p-4 border shadow-2xl flex flex-col gap-3 transition-colors duration-200 ${
        isDark
          ? 'bg-slate-900/80 border-slate-800 text-slate-100 backdrop-blur-md'
          : 'bg-white/90 border-slate-200 text-slate-900 shadow-lg'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <BatteryCharging className="w-4 h-4 text-emerald-500" />
          <h2 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {lang === 'bn' ? 'শক্তির সংরক্ষণশীলতা পরিমাপক' : 'Live Mechanical Energy Balance'}
          </h2>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-1.5">
          {isConservative ? (
            <span className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
              isDark
                ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
                : 'text-slate-950 bg-emerald-100 border-emerald-500 shadow-sm'
            }`}>
              <Shield className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
              {lang === 'bn' ? 'যান্ত্রিক শক্তি সংরক্ষিত' : 'Mechanical Energy Conserved'}
            </span>
          ) : (
            <span className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
              isDark
                ? 'text-amber-300 bg-amber-500/15 border-amber-500/30'
                : 'text-slate-950 bg-amber-100 border-amber-500 shadow-sm'
            }`}>
              <Flame className="w-3 h-3 text-amber-700 dark:text-amber-400" />
              {lang === 'bn' ? 'তাপ শক্তিতে রূপান্তরিত' : 'Energy Dissipated as Heat'}
            </span>
          )}
        </div>
      </div>

      {/* Stacked Energy Progress Bar */}
      <div className="space-y-3">
        <div className={`flex justify-between items-center text-xs font-mono ${isDark ? 'text-slate-300' : 'text-slate-950 font-black'}`}>
          <span>{lang === 'bn' ? 'মোট শক্তি E_total:' : 'Total Energy E_total:'}</span>
          <span className="font-black text-cyan-800 dark:text-cyan-400 text-sm">{totalEnergy.toFixed(1)} J</span>
        </div>

        {/* Energy Bar Stack */}
        <div className={`w-full h-6 rounded-xl border p-0.5 flex overflow-hidden shadow-inner ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-200 border-slate-400'}`}>
          {/* Kinetic Energy Bar */}
          <div
            style={{ width: `${kePercent}%` }}
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-150 relative group"
            title={`Kinetic Energy: ${kineticEnergy.toFixed(1)} J`}
          />
          {/* Potential Energy Bar */}
          <div
            style={{ width: `${pePercent}%` }}
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-150 relative group"
            title={`Potential Energy: ${potentialEnergy.toFixed(1)} J`}
          />
          {/* Thermal / Dissipated Energy Bar */}
          <div
            style={{ width: `${heatPercent}%` }}
            className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-150 relative group"
            title={`Thermal Loss: ${thermalEnergy.toFixed(1)} J`}
          />
        </div>

        {/* Energy Legend & Values */}
        <div className="grid grid-cols-3 gap-2 text-xs pt-1">
          {/* Kinetic Energy */}
          <div className={`p-2.5 rounded-xl border flex flex-col ${isDark ? 'bg-cyan-950/40 border-cyan-500/30' : 'bg-cyan-100 border-cyan-400 shadow-sm'}`}>
            <span className={`text-[11px] font-black flex items-center gap-1 ${isDark ? 'text-cyan-300' : 'text-slate-950'}`}>
              <Zap className="w-3.5 h-3.5 text-cyan-800 dark:text-cyan-400" />
              {lang === 'bn' ? 'গতিশক্তি (E_k)' : 'Kinetic (E_k)'}
            </span>
            <span className={`text-sm font-black font-mono mt-0.5 ${isDark ? 'text-cyan-200' : 'text-slate-950'}`}>
              {kineticEnergy.toFixed(1)} J
            </span>
          </div>

          {/* Potential Energy */}
          <div className={`p-2.5 rounded-xl border flex flex-col ${isDark ? 'bg-purple-950/40 border-purple-500/30' : 'bg-purple-100 border-purple-400 shadow-sm'}`}>
            <span className={`text-[11px] font-black flex items-center gap-1 ${isDark ? 'text-purple-300' : 'text-slate-950'}`}>
              <Shield className="w-3.5 h-3.5 text-purple-800 dark:text-purple-400" />
              {lang === 'bn' ? 'স্থিতিশক্তি (E_p)' : 'Potential (E_p)'}
            </span>
            <span className={`text-sm font-black font-mono mt-0.5 ${isDark ? 'text-purple-200' : 'text-slate-950'}`}>
              {potentialEnergy.toFixed(1)} J
            </span>
          </div>

          {/* Thermal Energy Loss */}
          <div className={`p-2.5 rounded-xl border flex flex-col ${isDark ? 'bg-amber-950/40 border-amber-500/30' : 'bg-amber-100 border-amber-400 shadow-sm'}`}>
            <span className={`text-[11px] font-black flex items-center gap-1 ${isDark ? 'text-amber-300' : 'text-slate-950'}`}>
              <Flame className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400" />
              {lang === 'bn' ? 'অপচয়ী শক্তি (Q)' : 'Dissipated Heat'}
            </span>
            <span className={`text-sm font-black font-mono mt-0.5 ${isDark ? 'text-amber-200' : 'text-slate-950'}`}>
              {thermalEnergy.toFixed(1)} J
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const EnergyBarChart = React.memo(EnergyBarChartComponent);
