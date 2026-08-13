import React from 'react';
import {
  Sliders,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Settings2,
  Route,
  Activity,
  Calculator,
  Eye,
  Sparkles,
  Info,
} from 'lucide-react';
import { ForceCategory, Language, PathType, SimulationParams, ForceAnalysis } from '../types';

interface ControlPanelProps {
  lang: Language;
  forceCategory: ForceCategory;
  setForceCategory: (cat: ForceCategory) => void;
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  forceAnalysis: ForceAnalysis;
  onAnalyzeCustomForce: () => void;
  theme?: 'dark' | 'light';
}

const ControlPanelComponent: React.FC<ControlPanelProps> = ({
  lang,
  forceCategory,
  setForceCategory,
  params,
  setParams,
  forceAnalysis,
  onAnalyzeCustomForce,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  const forceTabs: { id: ForceCategory; labelEn: string; labelBn: string; color: string }[] = [
    { id: 'gravity', labelEn: 'Gravity (-mg)', labelBn: 'মহাকর্ষ বল', color: 'border-emerald-600 text-emerald-950 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 font-extrabold shadow-sm' },
    { id: 'spring', labelEn: 'Spring (-kr)', labelBn: 'স্প্রিং বল', color: 'border-cyan-600 text-cyan-950 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/60 font-extrabold shadow-sm' },
    { id: 'coulomb', labelEn: 'Coulomb (q₁q₂/r²)', labelBn: 'কুলম্বের বল', color: 'border-blue-600 text-blue-950 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 font-extrabold shadow-sm' },
    { id: 'buoyant', labelEn: 'Buoyant (ρVg)', labelBn: 'প্লবতা বল', color: 'border-teal-600 text-teal-950 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/60 font-extrabold shadow-sm' },
    { id: 'friction', labelEn: 'Friction (-μN)', labelBn: 'ঘর্ষণ বল', color: 'border-amber-600 text-amber-950 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 font-extrabold shadow-sm' },
    { id: 'viscous', labelEn: 'Viscous (-bv)', labelBn: 'সান্দ্রতা বল', color: 'border-purple-600 text-purple-950 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 font-extrabold shadow-sm' },
    { id: 'quadratic_drag', labelEn: 'Air Drag (v²)', labelBn: 'দ্বিঘাত বায়ুর বাধা', color: 'border-rose-600 text-rose-950 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 font-extrabold shadow-sm' },
    { id: 'induced_electric', labelEn: 'Induced E (∇×E≠0)', labelBn: 'আবেশিত তড়িৎ বল', color: 'border-orange-600 text-orange-950 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/60 font-extrabold shadow-sm' },
    { id: 'magnetic_lorentz', labelEn: 'Lorentz (W=0)', labelBn: 'চৌম্বক লোরেন্জ বল', color: 'border-indigo-600 text-indigo-950 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 font-extrabold shadow-sm' },
    { id: 'custom', labelEn: 'Custom F(x,y)', labelBn: 'কাস্টম সমীকরণ', color: 'border-pink-600 text-pink-950 dark:text-pink-300 bg-pink-100 dark:bg-pink-950/60 font-extrabold shadow-sm' },
  ];

  const pathOptions: { id: PathType; labelEn: string; labelBn: string }[] = [
    { id: 'straight', labelEn: 'Straight Path (A → B)', labelBn: 'সরলরেখা পথ (A → B)' },
    { id: 'arc', labelEn: 'Hill Arc (Curved)', labelBn: 'পাহাড়ি বক্রপথ' },
    { id: 'scurve', labelEn: 'S-Curve Wave', labelBn: 'S-আকৃতির তরঙ্গ পথ' },
    { id: 'zigzag', labelEn: 'Zigzag Path', labelBn: 'জিগজ্যাগ পথ' },
    { id: 'closed_loop', labelEn: 'Closed Loop (A → B → A)', labelBn: 'আবদ্ধ চক্র (A → B → A)' },
  ];

  const updateParam = (key: keyof SimulationParams, val: any) => {
    setParams((prev) => ({ ...prev, [key]: val }));
  };

  const applyCustomPreset = (fx: string, fy: string) => {
    setParams((prev) => ({
      ...prev,
      customFx: fx,
      customFy: fy,
    }));
    onAnalyzeCustomForce();
  };

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 flex flex-col gap-5 border shadow-xl transition-colors duration-200 ${
        isDark
          ? 'bg-slate-900/80 border-slate-800 text-slate-100 backdrop-blur-md'
          : 'bg-white border-slate-300 text-slate-900 shadow-lg'
      }`}
    >
      {/* 1. Force Category Selector */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className={`text-sm font-extrabold flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
            <Sliders className="w-4 h-4 text-cyan-600 dark:text-cyan-500" />
            <span>{lang === 'bn' ? '১. বল নির্বাচন করুন (Force Category)' : '1. Select Force Field'}</span>
          </h2>
          <span
            className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
              forceAnalysis.isConservative
                ? isDark
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-emerald-100 text-slate-950 border-emerald-500 shadow-sm'
                : isDark
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-amber-100 text-slate-950 border-amber-500 shadow-sm'
            }`}
          >
            {forceAnalysis.isConservative
              ? lang === 'bn'
                ? 'সংরক্ষণশীল (Conservative)'
                : 'Conservative'
              : lang === 'bn'
              ? 'অসংরক্ষণশীল (Non-Conservative)'
              : 'Non-Conservative'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {forceTabs.map((tab) => {
            const isActive = forceCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setForceCategory(tab.id)}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isActive
                    ? 'bg-orange-500 border-orange-600 text-white font-black shadow-lg ring-2 ring-orange-400 scale-[1.02]'
                    : isDark
                    ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-slate-100'
                    : 'bg-slate-50 border-slate-300 text-slate-900 font-bold hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <span className={`text-xs ${isActive ? 'text-white font-black' : 'font-bold'}`}>
                  {lang === 'bn' ? tab.labelBn : tab.labelEn}
                </span>
                <span className={`text-[10px] font-mono mt-0.5 ${isActive ? 'text-white/95 font-bold' : 'opacity-80 font-medium'}`}>
                  {tab.id === 'gravity' && 'F = -mg Ĵ'}
                  {tab.id === 'spring' && 'F = -k r̂'}
                  {tab.id === 'coulomb' && 'F_e = k_e q₁q₂/r² r̂'}
                  {tab.id === 'buoyant' && 'F_b = ρ V_sub g Ĵ'}
                  {tab.id === 'friction' && 'F_k = -μ_k N v̂'}
                  {tab.id === 'viscous' && 'F_v = -b v'}
                  {tab.id === 'quadratic_drag' && 'F_d = -½ρC_dA v² v̂'}
                  {tab.id === 'induced_electric' && 'F_ind = q E_ind'}
                  {tab.id === 'magnetic_lorentz' && 'F_m = q(v × B)'}
                  {tab.id === 'electrostatic' && 'F = -k_e/r² r̂'}
                  {tab.id === 'custom' && 'F = Fx i + Fy j'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Custom Force Function Inputs (Shown if 'custom') */}
      {forceCategory === 'custom' && (
        <div
          className={`p-3.5 rounded-xl border flex flex-col gap-3 ${
            isDark ? 'bg-slate-950/90 border-pink-500/30' : 'bg-pink-50/70 border-pink-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-pink-700 dark:text-pink-400 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" />
              {lang === 'bn' ? '২D কাস্টম বল সমীকরণ' : '2D Custom Force Field'}
            </span>
            <span className="text-[10px] text-pink-950 dark:text-pink-200 font-mono font-bold bg-pink-100 dark:bg-pink-950/60 px-2 py-0.5 rounded border border-pink-300">
              Interactive
            </span>
          </div>

          {/* Variables Syntax Tooltip */}
          <div className={`p-2 rounded-lg border text-[11px] font-mono flex items-start gap-1.5 ${
            isDark ? 'bg-pink-500/10 border-pink-500/20 text-pink-400' : 'bg-white border-pink-300 text-slate-950 font-bold shadow-sm'
          }`}>
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-pink-600" />
            <div>
              <span className="font-black block mb-0.5 text-slate-950 dark:text-pink-300">Supported Input Variables:</span>
              <span className="text-slate-900 dark:text-pink-200">x, y (position) • vx, vy, v (velocity & speed) • m (mass)</span>
            </div>
          </div>

          {/* Quick Preset Examples */}
          <div className="space-y-1">
            <span className={`text-[11px] font-black block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-900'}`}>Load Preset Examples:</span>
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              <button
                onClick={() => applyCustomPreset('-0.5 * vx', '-0.5 * vy')}
                className={`px-2.5 py-1.5 rounded-lg border font-mono font-black transition-all flex items-center gap-1 ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-pink-300 border-pink-500/30'
                    : 'bg-white hover:bg-slate-50 text-slate-950 border-slate-300 shadow-sm'
                }`}
                title="Velocity-dependent air drag (Non-conservative)"
              >
                <span className="text-pink-600 font-black">⚡</span> Drag (-0.5*vx, -0.5*vy)
              </button>
              <button
                onClick={() => applyCustomPreset('-y', 'x')}
                className={`px-2.5 py-1.5 rounded-lg border font-mono font-black transition-all flex items-center gap-1 ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-purple-300 border-purple-500/30'
                    : 'bg-white hover:bg-slate-50 text-slate-950 border-slate-300 shadow-sm'
                }`}
                title="Vortex field with curl (Non-conservative)"
              >
                <span className="text-purple-600 font-black">🌀</span> Vortex (-y, x)
              </button>
              <button
                onClick={() => applyCustomPreset('-2 * x', '-2 * y')}
                className={`px-2.5 py-1.5 rounded-lg border font-mono font-black transition-all flex items-center gap-1 ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-500/30'
                    : 'bg-white hover:bg-slate-50 text-slate-950 border-slate-300 shadow-sm'
                }`}
                title="2D Harmonic Oscillator (Conservative)"
              >
                <span className="text-cyan-600 font-black">🎯</span> Oscillator (-2x, -2y)
              </button>
            </div>
          </div>

          {/* Text Inputs */}
          <div className="space-y-2 font-mono text-xs">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">F_x(x, y, v_x) =</label>
              <input
                type="text"
                value={params.customFx}
                onChange={(e) => updateParam('customFx', e.target.value)}
                placeholder="e.g. -0.5*vx or -2*x or -y"
                className={`w-full border rounded-lg px-2.5 py-1.5 font-mono outline-none transition-all ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-pink-200 focus:border-pink-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-pink-500'
                }`}
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">F_y(x, y, v_y) =</label>
              <input
                type="text"
                value={params.customFy}
                onChange={(e) => updateParam('customFy', e.target.value)}
                placeholder="e.g. -0.5*vy or -9.8*m or x"
                className={`w-full border rounded-lg px-2.5 py-1.5 font-mono outline-none transition-all ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-pink-200 focus:border-pink-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-pink-500'
                }`}
              />
            </div>
          </div>

          <button
            onClick={onAnalyzeCustomForce}
            className="w-full py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-500/40 text-pink-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'কার্ল ও সংরক্ষণশীলতা পরীক্ষা' : 'Analyze Curl (∇ × F)'}</span>
          </button>

          {/* Curl Result Badge */}
          <div
            className={`p-2.5 rounded-lg border text-xs font-mono ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">∂F_y/∂x - ∂F_x/∂y:</span>
              <span className={forceAnalysis.isConservative ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>
                {forceAnalysis.curlZ}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {forceAnalysis.isConservative
                ? '✓ Curl is zero -> Field is Conservative!'
                : '⚠ Curl/Velocity dependence -> Field is Non-Conservative!'}
            </div>
          </div>
        </div>
      )}

      {/* 3. Path Selector */}
      <div>
        <h2 className={`text-sm font-bold flex items-center gap-2 mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          <Route className="w-4 h-4 text-emerald-500" />
          <span>{lang === 'bn' ? '২. গতির গতিপথ (Path Geometry)' : '2. Select Motion Path'}</span>
        </h2>
        <div className="space-y-1.5">
          {pathOptions.map((path) => {
            const isSelected = params.pathType === path.id;
            return (
              <label
                key={path.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-orange-500 border-orange-600 text-white font-black shadow-md ring-2 ring-orange-400 scale-[1.01]'
                    : isDark
                    ? 'bg-slate-950/40 border-slate-800 text-slate-300 hover:text-slate-100 hover:border-slate-700'
                    : 'bg-white border-slate-300 text-slate-900 font-bold hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pathType"
                    value={path.id}
                    checked={isSelected}
                    onChange={() => updateParam('pathType', path.id)}
                    className="accent-white w-4 h-4 cursor-pointer"
                  />
                  <span className={isSelected ? 'text-white font-black' : ''}>{lang === 'bn' ? path.labelBn : path.labelEn}</span>
                </div>
                {path.id === 'closed_loop' && (
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-mono font-extrabold ${
                    isSelected
                      ? 'bg-orange-700 text-white border-orange-400'
                      : 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40'
                  }`}>
                    W_loop Test
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* 4. Physical Parameters Sliders */}
      <div>
        <h2 className={`text-sm font-bold flex items-center gap-2 mb-3 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          <Settings2 className="w-4 h-4 text-purple-500" />
          <span>{lang === 'bn' ? '৩. ভৌত ধ্রুবকসমূহ (Parameters)' : '3. Physical Parameters'}</span>
        </h2>

        <div className="space-y-3.5 text-xs">
          {/* Mass Slider */}
          <div>
            <div className={`flex justify-between font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <span>{lang === 'bn' ? 'ভর (Mass, m):' : 'Mass (m):'}</span>
              <span className="font-mono text-cyan-500 font-bold">{params.mass.toFixed(1)} kg</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="10.0"
              step="0.1"
              value={params.mass}
              onChange={(e) => updateParam('mass', parseFloat(e.target.value))}
              className="w-full accent-cyan-500 bg-slate-200 dark:bg-slate-800 rounded-lg h-1.5 cursor-pointer"
            />
          </div>

          {/* Conditional Sliders according to ForceCategory */}
          {forceCategory === 'gravity' && (
            <div>
              <div className={`flex justify-between font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span>{lang === 'bn' ? 'অভিকর্ষজ ত্বরণ (g):' : 'Gravity Acceleration (g):'}</span>
                <span className="font-mono text-emerald-500 font-bold">{params.gravity.toFixed(1)} m/s²</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="25.0"
                step="0.1"
                value={params.gravity}
                onChange={(e) => updateParam('gravity', parseFloat(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-200 dark:bg-slate-800 rounded-lg h-1.5 cursor-pointer"
              />
            </div>
          )}

          {forceCategory === 'spring' && (
            <div>
              <div className={`flex justify-between font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span>{lang === 'bn' ? 'স্প্রিং ধ্রুবক (Spring Constant, k):' : 'Spring Constant (k):'}</span>
                <span className="font-mono text-cyan-500 font-bold">{params.springK.toFixed(0)} N/m</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={params.springK}
                onChange={(e) => updateParam('springK', parseFloat(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-200 dark:bg-slate-800 rounded-lg h-1.5 cursor-pointer"
              />
            </div>
          )}

          {forceCategory === 'friction' && (
            <div>
              <div className={`flex justify-between font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span>{lang === 'bn' ? 'ঘর্ষণ গুণাঙ্ক (Coeff μ_k):' : 'Friction Coeff (μ_k):'}</span>
                <span className="font-mono text-amber-500 font-bold">{params.frictionMu.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.00"
                max="1.00"
                step="0.02"
                value={params.frictionMu}
                onChange={(e) => updateParam('frictionMu', parseFloat(e.target.value))}
                className="w-full accent-amber-500 bg-slate-200 dark:bg-slate-800 rounded-lg h-1.5 cursor-pointer"
              />
            </div>
          )}

          {forceCategory === 'viscous' && (
            <div>
              <div className={`flex justify-between font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span>{lang === 'bn' ? 'সান্দ্রতা গুণাঙ্ক (Viscous Drag b):' : 'Viscous Coeff (b):'}</span>
                <span className="font-mono text-purple-500 font-bold">{params.viscousB.toFixed(2)} N·s/m</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="5.0"
                step="0.1"
                value={params.viscousB}
                onChange={(e) => updateParam('viscousB', parseFloat(e.target.value))}
                className="w-full accent-purple-500 bg-slate-200 dark:bg-slate-800 rounded-lg h-1.5 cursor-pointer"
              />
            </div>
          )}

          {forceCategory === 'coulomb' && (
            <div className="space-y-3 p-3 rounded-xl border border-blue-500/30 bg-blue-500/5">
              <div>
                <div className={`flex justify-between font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>{lang === 'bn' ? 'মূল আধান q₁ (Source Charge):' : 'Source Charge (q₁):'}</span>
                  <span className="font-mono text-blue-500 font-bold">{(params.coulombQ1 ?? 5).toFixed(1)} C</span>
                </div>
                <input
                  type="range"
                  min="-10.0"
                  max="10.0"
                  step="0.5"
                  value={params.coulombQ1 ?? 5}
                  onChange={(e) => updateParam('coulombQ1', parseFloat(e.target.value))}
                  className="w-full accent-blue-500 bg-slate-200 dark:bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
              </div>
              <div>
                <div className={`flex justify-between font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>{lang === 'bn' ? 'পরীক্ষাধীন আধান q₂ (Test Charge):' : 'Test Charge (q₂):'}</span>
                  <span className="font-mono text-cyan-500 font-bold">{(params.coulombQ2 ?? 1).toFixed(1)} C</span>
                </div>
                <input
                  type="range"
                  min="-5.0"
                  max="5.0"
                  step="0.5"
                  value={params.coulombQ2 ?? 1}
                  onChange={(e) => updateParam('coulombQ2', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-200 dark:bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
              </div>
              <div>
                <div className={`flex justify-between font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>{lang === 'bn' ? 'কুলম্ব ধ্রুবক k_e:' : 'Coulomb Constant (k_e):'}</span>
                  <span className="font-mono text-indigo-500 font-bold">{(params.coulombKe ?? 50).toFixed(0)}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  value={params.coulombKe ?? 50}
                  onChange={(e) => updateParam('coulombKe', parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-200 dark:bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
              </div>
            </div>
          )}

          {forceCategory === 'buoyant' && (
            <div className="space-y-3 p-3 rounded-xl border border-teal-500/30 bg-teal-500/5">
              <div>
                <div className={`flex justify-between font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>{lang === 'bn' ? 'তরলের ঘনত্ব ρ_fluid:' : 'Fluid Density (ρ_fluid):'}</span>
                  <span className="font-mono text-teal-500 font-bold">{(params.fluidDensity ?? 1000).toFixed(0)} kg/m³</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="2500"
                  step="50"
                  value={params.fluidDensity ?? 1000}
                  onChange={(e) => updateParam('fluidDensity', parseFloat(e.target.value))}
                  className="w-full accent-teal-500 bg-slate-200 dark:bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
              </div>
              <div>
                <div className={`flex justify-between font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>{lang === 'bn' ? 'নিমজ্জিত আয়তন V_sub:' : 'Submerged Vol (V_sub):'}</span>
                  <span className="font-mono text-emerald-500 font-bold">{(params.submergedVolume ?? 0.01).toFixed(3)} m³</span>
                </div>
                <input
                  type="range"
                  min="0.001"
                  max="0.05"
                  step="0.001"
                  value={params.submergedVolume ?? 0.01}
                  onChange={(e) => updateParam('submergedVolume', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-200 dark:bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
              </div>
            </div>
          )}

          {forceCategory === 'quadratic_drag' && (
            <div className="space-y-3 p-3 rounded-xl border border-rose-500/30 bg-rose-500/5">
              <div>
                <div className={`flex justify-between font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>{lang === 'bn' ? 'ড্র্যাগ সহগ C_d:' : 'Drag Coeff (C_d):'}</span>
                  <span className="font-mono text-rose-500 font-bold">{(params.dragCd ?? 0.47).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.50"
                  step="0.05"
                  value={params.dragCd ?? 0.47}
                  onChange={(e) => updateParam('dragCd', parseFloat(e.target.value))}
                  className="w-full accent-rose-500 bg-slate-200 dark:bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
              </div>
              <div>
                <div className={`flex justify-between font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>{lang === 'bn' ? 'বায়ুর ঘনত্ব ρ_air:' : 'Air Density (ρ):'}</span>
                  <span className="font-mono text-amber-500 font-bold">{(params.airDensity ?? 1.225).toFixed(2)} kg/m³</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.1"
                  value={params.airDensity ?? 1.225}
                  onChange={(e) => updateParam('airDensity', parseFloat(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-200 dark:bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
              </div>
            </div>
          )}

          {forceCategory === 'induced_electric' && (
            <div className="space-y-3 p-3 rounded-xl border border-orange-500/30 bg-orange-500/5">
              <div>
                <div className={`flex justify-between font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>{lang === 'bn' ? 'ফ্লাক্স পরিবর্তনের হার dΦ_B/dt:' : 'Flux Change Rate (dB/dt):'}</span>
                  <span className="font-mono text-orange-500 font-bold">{(params.dBdt ?? 2.0).toFixed(1)} T/s</span>
                </div>
                <input
                  type="range"
                  min="-5.0"
                  max="5.0"
                  step="0.5"
                  value={params.dBdt ?? 2.0}
                  onChange={(e) => updateParam('dBdt', parseFloat(e.target.value))}
                  className="w-full accent-orange-500 bg-slate-200 dark:bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
              </div>
              <div>
                <div className={`flex justify-between font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>{lang === 'bn' ? 'কণার আধান q:' : 'Particle Charge (q):'}</span>
                  <span className="font-mono text-yellow-500 font-bold">{(params.inducedCharge ?? 1.0).toFixed(1)} C</span>
                </div>
                <input
                  type="range"
                  min="-5.0"
                  max="5.0"
                  step="0.5"
                  value={params.inducedCharge ?? 1.0}
                  onChange={(e) => updateParam('inducedCharge', parseFloat(e.target.value))}
                  className="w-full accent-yellow-500 bg-slate-200 dark:bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
              </div>
            </div>
          )}

          {forceCategory === 'magnetic_lorentz' && (
            <div className="space-y-3 p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5">
              <div>
                <div className={`flex justify-between font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>{lang === 'bn' ? 'চৌম্বক ক্ষেত্র B_z (Out-of-plane):' : 'Magnetic Field (B_z):'}</span>
                  <span className="font-mono text-indigo-500 font-bold">{(params.lorentzBz ?? 3.0).toFixed(1)} Tesla</span>
                </div>
                <input
                  type="range"
                  min="-10.0"
                  max="10.0"
                  step="0.5"
                  value={params.lorentzBz ?? 3.0}
                  onChange={(e) => updateParam('lorentzBz', parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-200 dark:bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
              </div>
              <div>
                <div className={`flex justify-between font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>{lang === 'bn' ? 'গতিশীল আধান q:' : 'Moving Charge (q):'}</span>
                  <span className="font-mono text-purple-500 font-bold">{(params.lorentzQ ?? 2.0).toFixed(1)} C</span>
                </div>
                <input
                  type="range"
                  min="-5.0"
                  max="5.0"
                  step="0.5"
                  value={params.lorentzQ ?? 2.0}
                  onChange={(e) => updateParam('lorentzQ', parseFloat(e.target.value))}
                  className="w-full accent-purple-500 bg-slate-200 dark:bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Simulation Speed */}
          <div>
            <div className={`flex justify-between font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <span>{lang === 'bn' ? 'সিমুলেশন গতি (Speed):' : 'Simulation Speed:'}</span>
              <span className="font-mono font-bold">{params.timeSpeed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2.5"
              step="0.1"
              value={params.timeSpeed}
              onChange={(e) => updateParam('timeSpeed', parseFloat(e.target.value))}
              className="w-full accent-slate-500 bg-slate-200 dark:bg-slate-800 rounded-lg h-1.5 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 5. Visualization Toggles */}
      <div>
        <h2 className={`text-sm font-bold flex items-center gap-2 mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          <Eye className="w-4 h-4 text-cyan-500" />
          <span>{lang === 'bn' ? '৪. ডিসপ্লে অপশন (Overlays)' : '4. Canvas Display Overlays'}</span>
        </h2>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <label
            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
              params.showVectors
                ? 'bg-orange-500 border-orange-600 text-white font-black shadow-sm'
                : isDark
                ? 'bg-slate-950/60 border-slate-800 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-700 font-bold'
            }`}
          >
            <input
              type="checkbox"
              checked={params.showVectors}
              onChange={(e) => updateParam('showVectors', e.target.checked)}
              className="accent-white cursor-pointer"
            />
            <span>{lang === 'bn' ? 'বল ও বেগ ভেক্টর' : 'Force & Velocity'}</span>
          </label>
          <label
            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
              params.showComponents
                ? 'bg-orange-500 border-orange-600 text-white font-black shadow-sm'
                : isDark
                ? 'bg-slate-950/60 border-slate-800 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-700 font-bold'
            }`}
          >
            <input
              type="checkbox"
              checked={params.showComponents}
              onChange={(e) => updateParam('showComponents', e.target.checked)}
              className="accent-white cursor-pointer"
            />
            <span>{lang === 'bn' ? 'উপাংশ (F_∥, F_⊥)' : 'Components'}</span>
          </label>
          <label
            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
              params.showPotentialMap
                ? 'bg-orange-500 border-orange-600 text-white font-black shadow-sm'
                : isDark
                ? 'bg-slate-950/60 border-slate-800 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-700 font-bold'
            }`}
          >
            <input
              type="checkbox"
              checked={params.showPotentialMap}
              onChange={(e) => updateParam('showPotentialMap', e.target.checked)}
              className="accent-white cursor-pointer"
            />
            <span>{lang === 'bn' ? 'বিভব ক্ষেত্র মানচিত্র' : 'Potential Contour'}</span>
          </label>
          <label
            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
              params.showTrails
                ? 'bg-orange-500 border-orange-600 text-white font-black shadow-sm'
                : isDark
                ? 'bg-slate-950/60 border-slate-800 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-700 font-bold'
            }`}
          >
            <input
              type="checkbox"
              checked={params.showTrails}
              onChange={(e) => updateParam('showTrails', e.target.checked)}
              className="accent-white cursor-pointer"
            />
            <span>{lang === 'bn' ? 'গতিপথ ট্রেইল' : 'Motion Trail'}</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export const ControlPanel = React.memo(ControlPanelComponent);
