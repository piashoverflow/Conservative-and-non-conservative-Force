import React, { useEffect } from 'react';
import { X, GraduationCap, BookOpen } from 'lucide-react';
import { ForceCategory, Language, SimulationParams, ForceAnalysis } from '../types';
import { MathProofSolver } from './MathProofSolver';

interface MathProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  forceCategory: ForceCategory;
  params: SimulationParams;
  forceAnalysis: ForceAnalysis;
  theme?: 'dark' | 'light';
}

export const MathProofModal: React.FC<MathProofModalProps> = ({
  isOpen,
  onClose,
  lang,
  forceCategory,
  params,
  forceAnalysis,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className={`max-w-3xl w-full max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col transition-colors duration-200 ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-300 text-slate-900 shadow-xl'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isDark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-100/80'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {lang === 'bn'
                  ? 'ধাপভিত্তিক গাণিতিক প্রমাণ ও ভেক্টর ক্যালকুলাস'
                  : 'Step-by-Step Mathematical Proof & Vector Calculus'}
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {lang === 'bn'
                  ? 'কার্ল (∇ × F), লাইন ইন্টিগ্রাল এবং শক্তির নিত্যতা প্রতিপাদন'
                  : 'Curl Analysis (∇ × F), Line Integrals & Conservation Derivation'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-all active:scale-95 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300'
            }`}
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Render MathProofSolver */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <MathProofSolver
            lang={lang}
            forceCategory={forceCategory}
            params={params}
            forceAnalysis={forceAnalysis}
            theme={theme}
          />
        </div>

        {/* Modal Footer */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-between text-xs font-mono ${
            isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-cyan-500" />
            {lang === 'bn' ? 'HSC ও প্রকৌশল পদার্থবিজ্ঞান ক্যালকুলাস মানদণ্ড' : 'Calculus Standard for Engineering Mechanics'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-xs shadow-md hover:brightness-110 active:scale-95"
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
