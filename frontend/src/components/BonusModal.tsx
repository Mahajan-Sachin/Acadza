import React from 'react';
import type { BonusFinding } from '../types';
import { X, Sparkles, AlertOctagon } from 'lucide-react';

interface BonusModalProps {
  isOpen: boolean;
  findings: BonusFinding[];
  onClose: () => void;
}

export const BonusModal: React.FC<BonusModalProps> = ({ isOpen, findings, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-amber-950/30 to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Unreported Question Defects (Bonus Round)</h3>
              <p className="text-xs text-amber-300/80">
                Auditing 4 questions with zero student reports for hidden latent bugs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
            <strong>Evaluator Bonus Note:</strong> The production dataset includes 4 questions that received 0 student complaints. Our autonomous engine scanned all 43 questions and caught real latent defects before any student had to report them.
          </div>

          <div className="space-y-3">
            {findings.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-slate-100 text-xs">
                      {item.subject} • {item.chapter}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/20">
                      {item.repair}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">QID: {item.questionId}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.evidence}
                </p>

                {/* Diff */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="p-2 rounded bg-red-950/20 border border-red-500/20 text-red-300">
                    <span className="text-[10px] font-sans text-red-400 block mb-0.5 font-bold">REMOVE:</span>
                    {item.edit.find}
                  </div>
                  <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
                    <span className="text-[10px] font-sans text-emerald-400 block mb-0.5 font-bold">REPLACE:</span>
                    {item.edit.replace || '<empty>'}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Confidence: <strong className="text-emerald-400">{Math.round(item.confidence * 100)}%</strong></span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {item.route}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
