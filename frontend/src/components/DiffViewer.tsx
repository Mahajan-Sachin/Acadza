import React from 'react';
import type { SurgicalEdit } from '../types';
import { FileEdit, MinusCircle, PlusCircle } from 'lucide-react';

interface DiffViewerProps {
  edit: SurgicalEdit | null;
  repair: string | null;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ edit, repair }) => {
  if (!edit) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-4 text-center">
        <p className="text-xs text-slate-400 italic">
          No surgical database modification proposed for this case (No change required).
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden shadow-lg">
      {/* Diff Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700 text-xs">
        <div className="flex items-center gap-2">
          <FileEdit className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-white tracking-wide">SURGICAL DIFF COMPARISON</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
            field: {edit.field}
          </span>
        </div>
        {repair && (
          <span className="text-[11px] font-medium text-slate-300">
            Repair: <span className="text-white font-bold">{repair}</span>
          </span>
        )}
      </div>

      {/* Side-by-Side Red vs Green Diff */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-950/90">
        {/* Red Box: Remove */}
        <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/40 space-y-1.5">
          <div className="flex items-center gap-1.5 text-red-400 font-sans font-bold text-xs tracking-wider">
            <MinusCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>CURRENT / REMOVE (BEFORE)</span>
          </div>
          <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/30 text-red-100 font-mono text-xs break-words whitespace-pre-wrap leading-relaxed">
            {edit.find || '<empty>'}
          </div>
        </div>

        {/* Green Box: Insert */}
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-1.5">
          <div className="flex items-center gap-1.5 text-emerald-400 font-sans font-bold text-xs tracking-wider">
            <PlusCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>PROPOSED FIX / INSERT (AFTER)</span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-100 font-mono text-xs font-bold break-words whitespace-pre-wrap leading-relaxed">
            {edit.replace || '<empty>'}
          </div>
        </div>
      </div>
    </div>
  );
};
