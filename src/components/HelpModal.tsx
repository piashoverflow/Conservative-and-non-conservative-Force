import React from 'react';
import { X, BookOpen, CheckCircle2, AlertTriangle, Atom, HelpCircle, Sparkles } from 'lucide-react';
import { Language } from '../types';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel max-w-2xl w-full max-h-[85vh] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Atom className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {lang === 'bn'
                  ? 'পদার্থবিজ্ঞান ল্যাব নির্দেশিকা ও সহায়িকা'
                  : 'Physics Lab Guide & HSC Theory Manual'}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'bn' ? 'সংরক্ষণশীল বনাম অসংরক্ষণশীল বলের মূলনীতি' : 'Conservative vs Non-Conservative Forces'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-300">
          {/* Section 1: Core Definitions */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <h3 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              {lang === 'bn' ? '১. সংরক্ষণশীল বল (Conservative Force)' : '1. Conservative Force'}
            </h3>
            <p>
              {lang === 'bn'
                ? 'যে বল দ্বারা কোনো বস্তুকে এক স্থান থেকে অন্য স্থানে নিয়ে গেলে সম্পাদিত কাজ কেবল আদি ও শেষ অবস্থানের ওপর নির্ভর করে, কিন্তু গতির পথের ওপর নির্ভর করে না, তাকে সংরক্ষণশীল বল বলে।'
                : 'A force is conservative if the work done in moving an object between two points is strictly independent of the path taken.'}
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 font-mono text-[11px] pt-1">
              <li>
                {lang === 'bn' ? 'আবদ্ধ চক্রে মোট কৃতকাজ শূন্য: W_closed = ∮ F⃗ · dr⃗ = 0' : 'Closed Loop Work is strictly zero: W_closed = ∮ F⃗ · dr⃗ = 0'}
              </li>
              <li>
                {lang === 'bn' ? 'বল ক্ষেত্রের কার্ল শূন্য: ∇ × F⃗ = 0' : 'Vector Field Curl is zero: ∇ × F⃗ = 0'}
              </li>
              <li>
                {lang === 'bn' ? 'উদাহরণ: মহাকর্ষ বল, স্প্রিং বল, স্থিরতড়িৎ বল' : 'Examples: Gravity, Spring Restoring Force, Electrostatic Field'}
              </li>
            </ul>
          </div>

          {/* Section 2: Non-Conservative Forces */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <h3 className="font-bold text-sm text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              {lang === 'bn' ? '২. অসংরক্ষণশীল বল (Non-Conservative Force)' : '2. Non-Conservative Force'}
            </h3>
            <p>
              {lang === 'bn'
                ? 'যে বল দ্বারা কোনো বস্তুকে স্থানান্তরিত করলে কৃতকাজ অতিক্রান্ত পথের দৈর্ঘ্যের ওপর নির্ভর করে এবং আবদ্ধ পথ অতিক্রম করলে মোট কাজের মান শূন্য হয় না, তাকে অসংরক্ষণশীল বল বলে।'
                : 'A force is non-conservative if work depends on the total distance traveled, continuously dissipating mechanical energy into heat.'}
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 font-mono text-[11px] pt-1">
              <li>
                {lang === 'bn' ? 'আবদ্ধ চক্রে কাজ অ-শূন্য (ঋণাত্মক): W_closed < 0' : 'Closed Loop Work is non-zero (thermal loss): W_closed < 0'}
              </li>
              <li>
                {lang === 'bn' ? 'বল ক্ষেত্রের কার্ল অ-শূন্য: ∇ × F⃗ ≠ 0' : 'Vector Field Curl is non-zero: ∇ × F⃗ ≠ 0'}
              </li>
              <li>
                {lang === 'bn' ? 'উদাহরণ: ঘর্ষণ বল, সান্দ্র বল, বায়ুর বাধা' : 'Examples: Kinetic Friction, Viscous Fluid Resistance'}
              </li>
            </ul>
          </div>

          {/* Section 3: How to Use this Simulator */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <h3 className="font-bold text-sm text-emerald-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {lang === 'bn' ? '৩. ল্যাব সিমুলেটর কীভাবে ব্যবহার করবেন?' : '3. How to Use this Simulator'}
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>
                {lang === 'bn'
                  ? 'বামপাশের কಂಟ্রোল প্যানেল থেকে বলের ক্যাটাগরি (মহাকর্ষ, স্প্রিং, ঘর্ষণ, সান্দ্রতা বা কাস্টম) নির্বাচন করুন।'
                  : 'Select a Force Field category from the left control panel.'}
              </li>
              <li>
                {lang === 'bn'
                  ? 'ক্যানভাসে বিন্দু A এবং B ড্র্যাগ করে নতুন গতিপথ তৈরি করুন এবং সিমুলেট চালু করুন।'
                  : 'Drag handle points A & B directly on the canvas to customize trajectory.'}
              </li>
              <li>
                {lang === 'bn'
                  ? 'আবদ্ধ চক্র টেস্টের জন্য Closed Loop পথ নির্বাচন করুন এবং W_loop এর মান দেখুন।'
                  : 'Select Closed Loop path to verify W_loop = 0 for conservative forces.'}
              </li>
              <li>
                {lang === 'bn'
                  ? 'ডানপাশের প্যানেলে ক্যালকুলাস সমাধান ও সরাসরি স্টেপ-বাই-স্টেপ প্রমাণ লক্ষ্য করুন।'
                  : 'Inspect step-by-step calculus proofs and curl verification on the right panel.'}
              </li>
            </ol>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:brightness-110 transition-all"
          >
            {lang === 'bn' ? 'বুঝেছি (Start Lab)' : 'Got it! Launch Lab'}
          </button>
        </div>
      </div>
    </div>
  );
};
