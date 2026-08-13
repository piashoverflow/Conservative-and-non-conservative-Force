import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  GraduationCap,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { ForceCategory, Language, SimulationParams, ForceAnalysis } from '../types';

interface MathProofSolverProps {
  lang: Language;
  forceCategory: ForceCategory;
  params: SimulationParams;
  forceAnalysis: ForceAnalysis;
  theme?: 'dark' | 'light';
}

// Inline KaTeX Renderer Component
const MathTex: React.FC<{ math: string; display?: boolean }> = React.memo(
  ({ math, display = false }) => {
    const spanRef = useRef<HTMLSpanElement | null>(null);

    useEffect(() => {
      if (spanRef.current) {
        try {
          katex.render(math, spanRef.current, {
            displayMode: display,
            throwOnError: false,
          });
        } catch {
          if (spanRef.current) spanRef.current.innerText = math;
        }
      }
    }, [math, display]);

    return <span ref={spanRef} className={display ? 'my-1 block text-center overflow-x-auto' : 'inline-block'} />;
  },
  (prev, next) => prev.math === next.math && prev.display === next.display
);

const MathProofSolverComponent: React.FC<MathProofSolverProps> = ({
  lang,
  forceCategory,
  params,
  forceAnalysis,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`rounded-2xl p-4 border shadow-2xl flex flex-col gap-3 transition-colors duration-200 ${
        isDark
          ? 'bg-slate-900/80 border-slate-800 text-slate-100 backdrop-blur-md'
          : 'bg-white/90 border-slate-200 text-slate-900 shadow-lg'
      }`}
    >
      {/* Proof Header */}
      <div className={`flex items-center justify-between border-b pb-2.5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h2 className={`text-xs sm:text-sm font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              <span>
                {lang === 'bn'
                  ? 'ধাপভিত্তিক গাণিতিক প্রমাণ ও ক্যালকুলাস'
                  : 'Step-by-Step Calculus Proof'}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              {lang === 'bn'
                ? 'লাইন ইন্টিগ্রাল, কার্ল (∇ × F) এবং স্টকসের উপপাদ্য'
                : 'Line Integrals, Curl Verification & Stokes Theorem'}
            </p>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1 ${
            forceAnalysis.isConservative
              ? isDark
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-emerald-100 text-slate-950 border-emerald-500 shadow-sm'
              : isDark
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-amber-100 text-slate-950 border-amber-500 shadow-sm'
          }`}
        >
          {forceAnalysis.isConservative ? (
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-500" />
          ) : (
            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-500" />
          )}
          {forceAnalysis.isConservative
            ? lang === 'bn'
              ? 'সংরক্ষণশীল (∇ × F = 0)'
              : 'Conservative Field'
            : lang === 'bn'
            ? 'অসংরক্ষণশীল (∇ × F ≠ 0)'
            : 'Non-Conservative Field'}
        </span>
      </div>

      {/* Dynamic Calculus Proof Steps */}
      <div className="flex flex-col gap-2.5 text-xs">
        {/* Step 1: Vector Field Definition */}
        <div className={`p-3 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100/80 border-slate-300 shadow-sm'}`}>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`font-extrabold flex items-center gap-1 text-[11px] ${isDark ? 'text-cyan-300' : 'text-cyan-950'}`}>
                <ChevronRight className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-500" />
                {lang === 'bn' ? 'ধাপ ১: বল ভেক্টরের রূপ' : 'Step 1: Force Vector Definition'}
              </span>
              <span className={`text-[10px] font-mono font-extrabold ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>F(x, y)</span>
            </div>
            <div className={`p-2 rounded-lg border font-mono font-extrabold ${isDark ? 'bg-slate-900 border-slate-800 text-cyan-300' : 'bg-white border-slate-300 text-slate-950 shadow-sm'}`}>
              {forceCategory === 'gravity' && <MathTex math="\vec{F}(x,y) = -m g \hat{j}" display />}
              {forceCategory === 'spring' && <MathTex math="\vec{F}(x,y) = -k x \hat{i} - k y \hat{j}" display />}
              {(forceCategory === 'coulomb' || forceCategory === 'electrostatic') && (
                <MathTex math="\vec{F}_e(r) = \frac{1}{4\pi\epsilon_0} \frac{q_1 q_2}{r^2} \hat{r} = \frac{k_e q_1 q_2}{r^2} \hat{r}" display />
              )}
              {forceCategory === 'buoyant' && <MathTex math="\vec{F}_b = \rho_{\text{fluid}} V_{\text{sub}} g \hat{j}" display />}
              {forceCategory === 'friction' && <MathTex math="\vec{F}_k = -\mu_k N \frac{\vec{v}}{|\vec{v}|}" display />}
              {forceCategory === 'viscous' && <MathTex math="\vec{F}_v = -b v_x \hat{i} - b v_y \hat{j}" display />}
              {forceCategory === 'quadratic_drag' && <MathTex math="\vec{F}_d = -\frac{1}{2}\rho C_d A v^2 \hat{v}" display />}
              {forceCategory === 'induced_electric' && <MathTex math="\vec{F}_{\text{ind}} = q \vec{E}_{\text{ind}} = q \left(-\frac{y}{2}\frac{dB}{dt}\hat{i} + \frac{x}{2}\frac{dB}{dt}\hat{j}\right)" display />}
              {forceCategory === 'magnetic_lorentz' && <MathTex math="\vec{F}_m = q (\vec{v} \times \vec{B}) = q B_z (v_y \hat{i} - v_x \hat{j})" display />}
              {forceCategory === 'custom' && (
                <MathTex math={`\\vec{F} = (${params.customFx}) \\hat{i} + (${params.customFy}) \\hat{j}`} display />
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Curl Condition Test (∇ × F) */}
        <div className={`p-3 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100/80 border-slate-300 shadow-sm'}`}>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`font-extrabold flex items-center gap-1 text-[11px] ${isDark ? 'text-purple-300' : 'text-purple-950'}`}>
                <ChevronRight className="w-3.5 h-3.5 text-purple-600 dark:text-purple-500" />
                {lang === 'bn' ? 'ধাপ ২: বলের কার্ল (Curl Test)' : 'Step 2: Vector Curl Test'}
              </span>
              <span className={`text-[10px] font-mono font-extrabold ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>∇ × F = 0</span>
            </div>
            <div className={`p-2 rounded-lg border font-mono font-extrabold text-center ${isDark ? 'bg-slate-900 border-slate-800 text-purple-300' : 'bg-white border-slate-300 text-slate-950 shadow-sm'}`}>
              <MathTex math="\nabla \times \vec{F} = \left(\frac{\partial F_y}{\partial x} - \frac{\partial F_x}{\partial y}\right) \hat{k}" display />
              <div className={`text-[10px] pt-1 border-t mt-1 ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-800'}`}>
                {forceAnalysis.isConservative ? (
                  <span className="text-emerald-800 dark:text-emerald-400 font-extrabold flex items-center justify-center gap-1">
                    ✓ <MathTex math="\frac{\partial F_y}{\partial x} = \frac{\partial F_x}{\partial y} \implies \text{Curl } = 0" />
                  </span>
                ) : (
                  <span className="text-amber-800 dark:text-amber-400 font-extrabold flex items-center justify-center gap-1">
                    ⚠ <MathTex math="\frac{\partial F_y}{\partial x} \neq \frac{\partial F_x}{\partial y} \implies \text{Curl } \neq 0" />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Line Integral & Closed Loop Theorem */}
        <div className={`p-3 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100/80 border-slate-300 shadow-sm'}`}>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`font-extrabold flex items-center gap-1 text-[11px] ${isDark ? 'text-emerald-300' : 'text-emerald-950'}`}>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                {lang === 'bn' ? 'ধাপ ৩: আবদ্ধ পথ ও বিভব শক্তি' : 'Step 3: Line Integral & Potential U'}
              </span>
              <span className={`text-[10px] font-mono font-extrabold ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>∮ F·dr</span>
            </div>
            <div className={`p-2 rounded-lg border font-mono font-extrabold text-center ${isDark ? 'bg-slate-900 border-slate-800 text-emerald-300' : 'bg-white border-slate-300 text-slate-950 shadow-sm'}`}>
              <MathTex math="W_{\text{loop}} = \oint_C \vec{F} \cdot d\vec{r} = \iint_S (\nabla \times \vec{F}) \cdot d\vec{A}" display />
              <div className={`text-[10px] pt-1 border-t mt-1 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <span className="text-slate-900 dark:text-slate-400 font-extrabold">
                  {lang === 'bn' ? 'বিভব রাশি: ' : 'Potential Function: '}
                </span>
                <MathTex math={forceAnalysis.potentialExpr} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conceptual Summary Box */}
      <div className={`p-3 rounded-xl border flex flex-col gap-2 ${isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-300 shadow-sm'}`}>
        <div className="flex items-start gap-2">
          <BookOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-500 shrink-0 mt-0.5" />
          <div>
            <h3 className={`font-extrabold text-xs mb-0.5 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              {lang === 'bn' ? 'পদার্থবিজ্ঞান মূলভাব ও পরীক্ষার সিদ্ধান্ত:' : 'Physics Conceptual Summary:'}
            </h3>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-900 font-semibold'}`}>
              {lang === 'bn' ? forceAnalysis.explanationBn : forceAnalysis.explanationEn}
            </p>
          </div>
        </div>

        <div className={`p-2 rounded-lg border text-[11px] font-mono flex justify-between items-center ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-950 font-bold shadow-sm'}`}>
          <span className="text-cyan-700 dark:text-cyan-400 font-extrabold">Energy Law:</span>
          <span className="font-extrabold">E_k + E_p + Q_heat = Constant</span>
        </div>
      </div>
    </div>
  );
};

export const MathProofSolver = React.memo(MathProofSolverComponent);
