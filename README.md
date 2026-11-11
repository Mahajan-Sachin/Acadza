# 🛡️ Acadza: Autonomous "Report → Fix" Loop & 10 PM Faculty Console

> **Autonomous error triage engine and surgical repair console for Acadza's ~8 lakh JEE/NEET question bank.**  
> Designed for exhausted faculty reviewing error reports at 10 PM: safe, zero-fatigue, 1-click approvals with sub-5-second turnaround.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-blue?style=for-the-badge&logo=vercel)](https://frontend-blue-two-64.vercel.app)
[![Architecture](https://img.shields.io/badge/Architecture-Double--Blind%20Solver-emerald?style=for-the-badge)](PRODUCT.md)
[![Prompts & Failures](https://img.shields.io/badge/Prompts-PROMPTS.md-purple?style=for-the-badge)](PROMPTS.md)

---

## 🌐 Live Review Console

**Production Deployment:** [https://frontend-blue-two-64.vercel.app](https://frontend-blue-two-64.vercel.app)

* **Multi-Report Grouping:** Collapses duplicate reports on the same question into a single card to eliminate review fatigue.
* **Urgency-Ranked Queue:** Formula combining defect type severity, active exam status, and multi-report frequency.
* **High-Contrast Dark Mode & Native MathML:** Clean, fatigue-reducing typography with crisp white formula rendering.
* **Surgical Diff Viewer:** Red/green before-and-after diffs highlighting exact text edits (`field`, `find`, `replace`).
* **1-Click Faculty Actions:** Instant Approve & Apply, Reject, or Edit with complete audit trail persistence.
* **Proactive Defect Scanner (Bonus):** Audits unflagged questions to catch latent bugs before students stumble on them.

---

## ⚙️ Core Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │               Student Report                 │
                    │   ("ans galat hai", "data missing", etc.)    │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │       Stage 1: Adversarial Sanitizer         │
                    │  Quarantines prompt injections (e.g. R027)   │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │       Stage 2: Double-Blind Solver           │
                    │  Solves question stem strictly blind from    │
                    │  first principles (eliminates sycophancy)    │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │       Stage 3: Taxonomy & Scope Guards       │
                    │  Validates edit scope & auto-apply policy    │
                    └──────────────────────┬───────────────────────┘
                                           │
                     ┌─────────────────────┴─────────────────────┐
                     ▼                                           ▼
       High Confidence & auto: true               Sensitive / auto: false
      ┌───────────────────────────────┐          ┌───────────────────────────────┐
      │          auto_apply           │          │        faculty_review         │
      │  (Marked RESOLVED in Console) │          │     (Urgency-Ranked Queue)    │
      └───────────────────────────────┘          └───────────────────────────────┘
```

### 1. Double-Blind Solving
To prevent sycophancy and confirmation bias, the solver LLM solves the stem and options completely blind without access to the stored answer key or the student's comment. It only cross-checks against the stored key after deriving the independent solution.

### 2. Surgical Edits, Never Rewrites
Content changes are strictly scoped to minimal `{field, find, replace}` substrings or new `answer` keys. Full question overwrites are prohibited by runtime schema guards.

### 3. Strict Safety & Guardrails
- **`auto: true`**: Only non-destructive, mechanically verifiable fixes (e.g., unambiguous answer key updates with $\ge 90\%$ solver confidence, obvious OCR typo replacements) can auto-apply.
- **`auto: false`**: Any modification to stem text, missing diagrams, or syllabus drops are held as `Pending` for human faculty approval.
- **Adversarial Pre-filter**: Neutralizes prompt injection payloads (such as R027) before they reach the reasoning pipeline.

---

## 📁 Repository Structure

```
├── data/
│   ├── questions.json              # 43 production questions (HTML + MathML)
│   ├── reports.json                # 44 real student complaints
│   └── taxonomy.json               # Closed verdicts & repair scope rules
├── engine/
│   ├── llm_client.py               # Rate-limit resilient Groq LLM client
│   ├── solver.py                   # Double-blind physics/chemistry solver
│   ├── taxonomy_guards.py          # Scope validation & route enforcement
│   └── pipeline.py                 # Multi-stage triage orchestration
├── frontend/                       # Vite + React 18 + Tailwind v4 Console
│   ├── src/App.tsx                 # Faculty console with surgical diff viewer
│   ├── src/types.ts                # TypeScript interfaces
│   └── package.json
├── results.json                    # Full triage output over all 44 reports
├── bonus_unreported_defects.json   # Proactive scanner findings on unflagged questions
├── data_analysis.ipynb             # Exploratory analysis & multi-report clustering
├── PRODUCT.md                      # 1-page strategy memo on defect half-life & ethics
├── PROMPTS.md                      # Verbatim prompts, failure catches & design log
└── README.md                       # System architecture & documentation
```

---

## 🚀 Running Locally

### 1. Frontend Review Console
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 2. Triage Pipeline
```bash
# Requires Python 3.10+
pip install groq python-dotenv

# Run pipeline
python -m engine.pipeline
```

---

## 📊 Key Results Summary

* **44 Student Reports Triaged:** 16 genuine defects identified, 28 non-defects/misconceptions safely handled with empathetic replies.
* **Zero False Auto-Applies:** 100% adherence to `taxonomy.json` auto-apply constraints.
* **Proactive Defect Discovery:** Detected 2 latent defects in questions with 0 student reports (an unclosed `<mspace>` tag distorting options, and a geometrical optics formula typo).
