import React from 'react';
import { ShieldCheck, History, Sparkles, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface HeaderProps {
  stats: {
    totalReports: number;
    defectsCount: number;
    autoAppliedCount: number;
    pendingReviewCount: number;
    unreportedBonusCount: number;
  };
  onOpenAudit: () => void;
  onOpenBonus: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ stats, onOpenAudit, onOpenBonus, onReset }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">Acadza Review Console</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                10 PM SME Mode
              </span>
            </div>
            <p className="text-xs text-slate-400">
              JEE/NEET Error Triage & Surgical Repair System (~8 Lakh Questions)
            </p>
          </div>
        </div>

        {/* Quick KPI Stats */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <span className="font-semibold text-white">{stats.totalReports}</span> Reports
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="font-semibold">{stats.defectsCount}</span> Defects
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <span className="font-semibold">{stats.pendingReviewCount}</span> Needs Review
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="font-semibold">{stats.autoAppliedCount}</span> Auto-Applied
          </div>

          {/* Action Buttons */}
          <div className="h-4 w-[1px] bg-slate-700 mx-1 hidden md:block" />

          <button
            onClick={onOpenBonus}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-300 border border-amber-500/30 transition shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium">Bonus: Unreported ({stats.unreportedBonusCount})</span>
          </button>

          <button
            onClick={onOpenAudit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>Audit Trail</span>
          </button>

          <button
            onClick={onReset}
            title="Reset decisions to fresh triage baseline"
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

