export type QuestionType = 'scq' | 'mcq' | 'integerQuestion';

export interface QuestionContent {
  question: string;
  solution: string;
  answer: string | number | string[];
  quesImages: string[];
  solutionImages: string[];
}

export interface QuestionItem {
  _id: string;
  qid?: string | null;
  questionType: QuestionType;
  subject: string;
  chapter: string;
  concept?: string | null;
  subConcept?: string | null;
  level: string;
  error?: number;
  scq?: QuestionContent;
  mcq?: QuestionContent;
  integerQuestion?: QuestionContent;
}

export interface ReportItem {
  reportId: string;
  questionId: string;
  studentId: string;
  source: 'web' | 'android' | 'ios' | string;
  reportedAt: string;
  comment: string;
}

export interface SurgicalEdit {
  field: string;
  find: string;
  replace: string;
}

export interface TriageResult {
  reportId: string;
  questionId: string;
  verdict: 'defect' | 'no_error' | 'display_issue' | 'app_issue' | 'language_mode' | 'already_fixed' | 'not_actionable';
  repair: string | null;
  edit: SurgicalEdit | null;
  route: 'auto_apply' | 'faculty_review' | 'no_change';
  confidence: number;
  evidence: string;
  student_reply: string;
}

export interface BonusFinding {
  questionId: string;
  subject: string;
  chapter: string;
  verdict: string;
  repair: string;
  edit: SurgicalEdit;
  route: string;
  confidence: number;
  evidence: string;
  unreported: boolean;
}

export interface AuditLogEntry {
  id: string;
  reportId: string;
  questionId: string;
  action: 'APPROVED' | 'REJECTED' | 'EDITED_AND_APPROVED' | 'AUTO_APPLIED';
  facultyName: string;
  timestamp: string;
  details: string;
  previousValue?: string;
  newValue?: string;
}

