import React, { useState } from 'react';
import type { SurgicalEdit } from '../types';
import { X, Check, Edit3 } from 'lucide-react';

interface EditModalProps {
  isOpen: boolean;
  initialEdit: SurgicalEdit | null;
  onClose: () => void;
  onSave: (edited: SurgicalEdit) => void;
}

export const EditModal: React.FC<EditModalProps> = ({ isOpen, initialEdit, onClose, onSave }) => {
  const [field, setField] = useState(initialEdit?.field || 'answer');
  const [find, setFind] = useState(initialEdit?.find || '');
  const [replace, setReplace] = useState(initialEdit?.replace || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ field, find, replace });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">Modify Surgical Edit</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Target Field
            </label>
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            >
              <option value="answer">answer (Answer Key)</option>
              <option value="question">question (Stem & Options HTML)</option>
              <option value="solution">solution (Explanation HTML)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Find (Exact string to replace)
            </label>
            <textarea
              rows={2}
              value={find}
              onChange={(e) => setFind(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/50"
              placeholder="e.g. B or 'per mere'"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Replace With (Surgical insertion)
            </label>
            <textarea
              rows={2}
              value={replace}
              onChange={(e) => setReplace(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="e.g. D or 'per metre'"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition"
            >
              <Check className="w-4 h-4" />
              Save & Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
