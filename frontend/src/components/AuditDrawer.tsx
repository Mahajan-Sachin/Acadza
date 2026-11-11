import React from 'react';
import type { AuditLogEntry } from '../types';
import { X, History, Download, CheckCircle, XCircle, Edit2, ShieldAlert } from 'lucide-react';

interface AuditDrawerProps {
  isOpen: boolean;
  logs: AuditLogEntry[];
  onClose: () => void;
}

export const AuditDrawer: React.FC<AuditDrawerProps> = ({ isOpen, logs, onClose }) => {
  if (!isOpen) return null;

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acadza_audit_trail_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'EDITED_AND_APPROVED':
        return <Edit2 className="w-4 h-4 text-indigo-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Faculty Audit Trail</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {logs.length} Actions
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleExport}
                title="Export Audit Logs as JSON"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Logs List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No faculty actions recorded yet in this session.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs font-mono"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {getActionIcon(log.action)}
                      <span className="font-bold text-slate-200">{log.action}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-sans">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-slate-400 font-sans text-[11px] leading-relaxed">
                    {log.details}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-850 text-[10px] text-slate-500 font-mono">
                    <span>QID: {log.questionId.slice(0, 8)}...</span>
                    <span>By: {log.facultyName}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
