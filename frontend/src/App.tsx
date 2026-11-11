import { useState, useMemo, useEffect } from 'react';
import rawQuestions from './data/questions.json';
import rawReports from './data/reports.json';
import rawResults from './data/results.json';
import rawBonus from './data/bonus_unreported_defects.json';

import type { QuestionItem, ReportItem, TriageResult, BonusFinding, AuditLogEntry, SurgicalEdit } from './types';
import { Header } from './components/Header';
import { EditModal } from './components/EditModal';
import { AuditDrawer } from './components/AuditDrawer';
import { BonusModal } from './components/BonusModal';

import {
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Smartphone,
  Globe,
  Apple,
  Search,
  Send,
  Check,
  Edit2,
  FileQuestion,
  BookOpen
} from 'lucide-react';

export function App() {
  const questions = rawQuestions as unknown as QuestionItem[];
  const reports = rawReports as unknown as ReportItem[];
  const results = rawResults as unknown as TriageResult[];
  const bonusFindings = rawBonus as unknown as BonusFinding[];

  // Persistent Decisions & Audit Logs
  const [decisions, setDecisions] = useState<Record<string, { status: 'APPROVED' | 'REJECTED' | 'EDITED'; edit?: SurgicalEdit }>>(() => {
    const saved = localStorage.getItem('acadza_decisions_v1');
    return saved ? JSON.parse(saved) : {};
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem('acadza_audit_v1');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('acadza_decisions_v1', JSON.stringify(decisions));
  }, [decisions]);

  useEffect(() => {
    localStorage.setItem('acadza_audit_v1', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Lookup maps
  const questionMap = useMemo(() => new Map(questions.map(q => [q._id, q])), [questions]);
  const resultsMap = useMemo(() => new Map(results.map(r => [r.reportId, r])), [results]);

  // Group reports by question
  const groupedByQuestion = useMemo(() => {
    const map = new Map<string, {
      question: QuestionItem;
      reports: ReportItem[];
      results: TriageResult[];
      urgencyScore: number;
      primaryVerdict: string;
      primaryRoute: string;
    }>();

    reports.forEach(rep => {
      const q = questionMap.get(rep.questionId);
      if (!q) return;

      const res = resultsMap.get(rep.reportId);
      const existing = map.get(rep.questionId) || {
        question: q,
        reports: [],
        results: [],
        urgencyScore: 10,
        primaryVerdict: 'no_error',
        primaryRoute: 'no_change'
      };

      existing.reports.push(rep);
      if (res) existing.results.push(res);
      map.set(rep.questionId, existing);
    });

    // Calculate Urgency Score for each question
    // "Most Urgent": Broken answer key > multiple reports > missing diagram/stem data > typos > no_error
    map.forEach((item) => {
      let score = 10;
      const verdicts = item.results.map(r => r.verdict);
      const repairs = item.results.map(r => r.repair);

      if (verdicts.includes('defect')) {
        score += 40;
        if (repairs.includes('answer_key')) score += 45; // Answer key errors hurt ALL students
        else if (repairs.includes('diagram') || repairs.includes('option_repair') || repairs.includes('stem_data')) score += 30;
        else if (repairs.includes('spelling') || repairs.includes('noise')) score += 15;
      }

      // Multiple reports boost urgency
      if (item.reports.length > 1) {
        score += item.reports.length * 10;
      }

      item.urgencyScore = Math.min(100, score);
      item.primaryVerdict = verdicts.find(v => v === 'defect') || verdicts[0] || 'no_error';
      item.primaryRoute = item.results.find(r => r.route === 'auto_apply')?.route || 
                          item.results.find(r => r.route === 'faculty_review')?.route || 'no_change';
    });

    // Sort descending by urgency
    return Array.from(map.values()).sort((a, b) => b.urgencyScore - a.urgencyScore);
  }, [reports, questionMap, resultsMap]);

  // State
  const [selectedQId, setSelectedQId] = useState<string>(groupedByQuestion[0]?.question._id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'defects' | 'review' | 'auto' | 'no_error'>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isBonusOpen, setIsBonusOpen] = useState(false);
  const [customReply, setCustomReply] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered queue
  const filteredQueue = useMemo(() => {
    return groupedByQuestion.filter(item => {
      // Filter tab
      if (filterType === 'defects' && item.primaryVerdict !== 'defect') return false;
      if (filterType === 'review' && item.primaryRoute !== 'faculty_review') return false;
      if (filterType === 'auto' && item.primaryRoute !== 'auto_apply') return false;
      if (filterType === 'no_error' && item.primaryVerdict !== 'no_error') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQid = item.question._id.toLowerCase().includes(q);
        const matchesSubj = item.question.subject.toLowerCase().includes(q);
        const matchesChap = item.question.chapter.toLowerCase().includes(q);
        const matchesComment = item.reports.some(r => r.comment.toLowerCase().includes(q));
        return matchesQid || matchesSubj || matchesChap || matchesComment;
      }

      return true;
    });
  }, [groupedByQuestion, filterType, searchQuery]);

  const activeGroup = useMemo(() => {
    return groupedByQuestion.find(g => g.question._id === selectedQId) || groupedByQuestion[0];
  }, [groupedByQuestion, selectedQId]);

  const activeResult = activeGroup?.results[0];
  const activeQuestion = activeGroup?.question;
  const activeQuestionContent = activeQuestion ? (activeQuestion[activeQuestion.questionType] || activeQuestion.scq || activeQuestion.integerQuestion || activeQuestion.mcq) : undefined;

  useEffect(() => {
    if (activeResult) {
      setCustomReply(activeResult.student_reply);
    }
  }, [activeResult]);

  // Actions
  const handleApprove = () => {
    if (!activeGroup || !activeResult) return;
    const qid = activeGroup.question._id;

    const newEntry: AuditLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      reportId: activeResult.reportId,
      questionId: qid,
      action: 'APPROVED',
      facultyName: 'Senior SME (Physics/Chem)',
      timestamp: new Date().toISOString(),
      details: `Approved proposed fix: ${activeResult.evidence}`,
      previousValue: activeResult.edit?.find,
      newValue: activeResult.edit?.replace
    };

    setDecisions(prev => ({ ...prev, [qid]: { status: 'APPROVED', edit: activeResult.edit || undefined } }));
    setAuditLogs(prev => [newEntry, ...prev]);
    showToast('Fix approved & applied to live question record!');
  };

  const handleReject = () => {
    if (!activeGroup || !activeResult) return;
    const qid = activeGroup.question._id;

    const newEntry: AuditLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      reportId: activeResult.reportId,
      questionId: qid,
      action: 'REJECTED',
      facultyName: 'Senior SME (Physics/Chem)',
      timestamp: new Date().toISOString(),
      details: `Rejected report. Content verified as correct; student misconception.`
    };

    setDecisions(prev => ({ ...prev, [qid]: { status: 'REJECTED' } }));
    setAuditLogs(prev => [newEntry, ...prev]);
    showToast('Report rejected; verified original question content.');
  };

  const handleCustomEditSave = (customEdit: SurgicalEdit) => {
    if (!activeGroup || !activeResult) return;
    const qid = activeGroup.question._id;

    const newEntry: AuditLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      reportId: activeResult.reportId,
      questionId: qid,
      action: 'EDITED_AND_APPROVED',
      facultyName: 'Senior SME (Physics/Chem)',
      timestamp: new Date().toISOString(),
      details: `Manually modified fix on field '${customEdit.field}': '${customEdit.find}' -> '${customEdit.replace}'`,
      previousValue: customEdit.find,
      newValue: customEdit.replace
    };

    setDecisions(prev => ({ ...prev, [qid]: { status: 'EDITED', edit: customEdit } }));
    setAuditLogs(prev => [newEntry, ...prev]);
    setIsEditModalOpen(false);
    showToast('Custom surgical fix saved and applied!');
  };

  const handleReset = () => {
    if (confirm('Reset all decisions to fresh baseline triage state?')) {
      setDecisions({});
      setAuditLogs([]);
      localStorage.removeItem('acadza_decisions_v1');
      localStorage.removeItem('acadza_audit_v1');
      showToast('Decisions reset to triage baseline.');
    }
  };

  // Header stats
  const stats = useMemo(() => {
    let defects = 0;
    let autoApplied = 0;
    let pending = 0;

    results.forEach(r => {
      if (r.verdict === 'defect') defects++;
      if (r.route === 'auto_apply') autoApplied++;
      if (r.route === 'faculty_review') pending++;
    });

    return {
      totalReports: reports.length,
      defectsCount: defects,
      autoAppliedCount: autoApplied,
      pendingReviewCount: pending,
      unreportedBonusCount: bonusFindings.length
    };
  }, [reports, results, bonusFindings]);

  const activeDecision = activeGroup ? decisions[activeGroup.question._id] : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        stats={stats}
        onOpenAudit={() => setIsAuditOpen(true)}
        onOpenBonus={() => setIsBonusOpen(true)}
        onReset={handleReset}
      />

      {/* Workspace Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ======================================================== */}
        {/* LEFT COLUMN: Urgency Queue (4 cols)                     */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 flex flex-col h-[calc(100vh-140px)] rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm overflow-hidden">
          {/* Search & Filter Header */}
          <div className="p-3.5 border-b border-slate-800 space-y-3 bg-slate-900/90">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search question, subject, comment..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer whitespace-nowrap ${
                  filterType === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({groupedByQuestion.length})
              </button>
              <button
                onClick={() => setFilterType('defects')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer whitespace-nowrap ${
                  filterType === 'defects'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                Defects
              </button>
              <button
                onClick={() => setFilterType('review')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer whitespace-nowrap ${
                  filterType === 'review'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                Needs Review
              </button>
              <button
                onClick={() => setFilterType('auto')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer whitespace-nowrap ${
                  filterType === 'auto'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                Auto-Applied
              </button>
            </div>
          </div>

          {/* Queue List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {filteredQueue.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No questions matching current filter.
              </div>
            ) : (
              filteredQueue.map(item => {
                const isSelected = item.question._id === selectedQId;
                const decision = decisions[item.question._id];
                const isDefect = item.primaryVerdict === 'defect';

                return (
                  <button
                    key={item.question._id}
                    onClick={() => setSelectedQId(item.question._id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-950/50'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.question.subject}
                        </span>
                        <span className="text-[10px] text-slate-600">•</span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {item.question.chapter}
                        </span>
                      </div>

                      {/* Urgency Badge */}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider shrink-0 ${
                          item.urgencyScore >= 80
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : item.urgencyScore >= 50
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        URGENCY {item.urgencyScore}
                      </span>
                    </div>

                    {/* Student comment preview */}
                    <p className="text-xs text-slate-200 line-clamp-1 font-medium mb-2">
                      "{item.reports[0]?.comment}"
                    </p>

                    {/* Bottom Metadata Badges */}
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        {item.reports.length > 1 && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                            {item.reports.length} Reports
                          </span>
                        )}
                        <span
                          className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold ${
                            item.primaryRoute === 'auto_apply' || decision?.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isDefect
                              ? 'bg-red-950/40 text-red-300 border border-red-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.primaryRoute === 'auto_apply' || decision?.status === 'APPROVED'
                            ? 'RESOLVED'
                            : item.primaryVerdict}
                        </span>
                      </div>

                      {/* Status indicator */}
                      {decision ? (
                        <span className="font-semibold text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> {decision.status}
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          {item.primaryRoute === 'auto_apply' ? 'Auto-Applied' : 'Pending'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Review Canvas & Decision Center (8 cols)  */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 flex flex-col h-[calc(100vh-140px)] rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm overflow-hidden">
          {activeGroup && activeQuestion && activeResult ? (
            <div className="flex-1 flex flex-col overflow-y-auto p-5 md:p-6 space-y-6">
              {/* Question Metadata Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {activeQuestion.subject}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {activeQuestion.chapter}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Level: {activeQuestion.level || 'Standard'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      Type: {activeQuestion.questionType}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Question ID: {activeQuestion._id}
                  </span>
                </div>

                {/* Stored Key & Status */}
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">STORED ANSWER KEY</span>
                    <span className="text-sm font-bold text-white font-mono">
                      {String(activeQuestionContent?.answer ?? 'N/A')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rendered Question HTML / MathML */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <FileQuestion className="w-4 h-4 text-indigo-400" />
                  <span>QUESTION TEXT & OPTIONS (RENDERED NATIVE MATHML)</span>
                </div>
                <div
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-sm leading-relaxed text-slate-200 overflow-x-auto shadow-inner rendered-content"
                  dangerouslySetInnerHTML={{ __html: activeQuestionContent?.question || '<p>No question body</p>' }}
                />
              </div>

              {/* Rendered Solution (Collapsible / Preview) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span>STORED SOLUTION (GROUND EXPLANATION)</span>
                </div>
                <div
                  className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs text-slate-300 overflow-x-auto leading-relaxed rendered-content"
                  dangerouslySetInnerHTML={{ __html: activeQuestionContent?.solution || '<p>No solution recorded</p>' }}
                />
              </div>

              {/* Student Reports Received */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>STUDENT REPORTS ({activeGroup.reports.length})</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Treat comments as leads, not orders
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {activeGroup.reports.map(rep => (
                    <div
                      key={rep.reportId}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-mono text-indigo-400 font-semibold">{rep.reportId}</span>
                        <div className="flex items-center gap-1">
                          {rep.source === 'android' && <Smartphone className="w-3 h-3 text-emerald-400" />}
                          {rep.source === 'ios' && <Apple className="w-3 h-3 text-slate-300" />}
                          {rep.source === 'web' && <Globe className="w-3 h-3 text-sky-400" />}
                          <span className="capitalize">{rep.source}</span>
                        </div>
                      </div>
                      <p className="text-slate-100 font-medium italic">
                        "{rep.comment}"
                      </p>
                      <span className="text-[10px] text-slate-500 block">
                        {new Date(rep.reportedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Triage Diagnosis Card */}
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-slate-200">AI TRIAGE ASSESSMENT</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        activeResult.route === 'auto_apply' || activeDecision?.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : activeResult.verdict === 'defect'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {activeResult.route === 'auto_apply' || activeDecision?.status === 'APPROVED'
                        ? 'DEFECT (AUTO-FIXED & LIVE)'
                        : activeResult.verdict.toUpperCase()}
                    </span>
                    {activeResult.repair && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        repair: {activeResult.repair}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400">
                    Confidence: <strong className="text-white font-mono">{Math.round(activeResult.confidence * 100)}%</strong>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                  <span className="text-indigo-400 font-semibold block mb-0.5">Evidence & Solver Verification:</span>
                  {activeResult.evidence}
                </div>
              </div>

              {/* Proposed Surgical Diff (Before / After) */}
              {(activeDecision?.edit || activeResult?.edit) ? (
                <div className="rounded-xl border-2 border-indigo-500/40 bg-slate-900 p-4 shadow-xl space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs tracking-wide">SURGICAL DIFF COMPARISON</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/40">
                        field: {(activeDecision?.edit || activeResult?.edit)?.field}
                      </span>
                    </div>
                    {activeResult?.repair && (
                      <span className="text-xs text-slate-300 font-medium">
                        Repair: <strong className="text-white">{activeResult.repair}</strong>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 font-mono text-xs">
                    {/* Red Box: Remove */}
                    <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/50 space-y-1.5">
                      <div className="text-red-400 font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <span>(-) CURRENT / REMOVE (BEFORE)</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500/30 text-red-100 break-words whitespace-pre-wrap leading-relaxed">
                        {(activeDecision?.edit || activeResult?.edit)?.find || '<empty>'}
                      </div>
                    </div>

                    {/* Green Box: Insert */}
                    <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 space-y-1.5">
                      <div className="text-emerald-400 font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <span>(+) PROPOSED FIX / INSERT (AFTER)</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-100 font-bold break-words whitespace-pre-wrap leading-relaxed">
                        {(activeDecision?.edit || activeResult?.edit)?.replace || '<empty>'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-4 text-center">
                  <p className="text-xs text-slate-400 italic">
                    No surgical database modification proposed for this case (No change required).
                  </p>
                </div>
              )}

              {/* Student Reply Preview & Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-indigo-400" />
                    <span>STUDENT OUTBOUND REPLY (1-3 EMAPTHETIC SENTENCES)</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Preview what student receives</span>
                </div>
                <div className="relative">
                  <textarea
                    rows={2}
                    value={customReply}
                    onChange={(e) => setCustomReply(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                  />
                </div>
              </div>

              {/* 1-Click Action Bar */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 sticky bottom-0 bg-slate-900/95 py-3 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs">
                  {activeDecision ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Decision Recorded: {activeDecision.status}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs">
                      Route: <strong className="text-indigo-400 font-mono">{activeResult.route}</strong>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleReject}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:border-rose-500/50 border border-slate-700 text-slate-300 hover:text-rose-200 text-xs font-semibold transition cursor-pointer"
                  >
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Reject / No Error</span>
                  </button>

                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4 text-indigo-400" />
                    <span>Edit Fix</span>
                  </button>

                  {activeResult.route === 'auto_apply' && !activeDecision ? (
                    <button
                      onClick={handleApprove}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Auto-Applied (Live in DB)</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleApprove}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>1-Click Approve & Apply</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Select a question from the urgency queue to begin review.
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EditModal
        isOpen={isEditModalOpen}
        initialEdit={activeDecision?.edit || activeResult?.edit || null}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleCustomEditSave}
      />

      {/* Audit Drawer */}
      <AuditDrawer
        isOpen={isAuditOpen}
        logs={auditLogs}
        onClose={() => setIsAuditOpen(false)}
      />

      {/* Bonus Modal */}
      <BonusModal
        isOpen={isBonusOpen}
        findings={bonusFindings}
        onClose={() => setIsBonusOpen(false)}
      />
    </div>
  );
}

export default App;
