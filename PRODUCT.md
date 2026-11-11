# PRODUCT STRATEGY MEMO: THE "REPORT → FIX" LOOP

**Author:** Sachin  
**Role:** Acadza AI Intern Build Round  
**Scope:** Content Integrity, Student Trust & Fault-Tolerant Automation at Scale  

---

### 1. Who loses the most when a question is broken, and how our design reflects that?

The biggest loser is **the diligent, borderline-rank student preparing for JEE/NEET**.

When a topper meets a broken question, they possess the confidence to say *"the question has a typo"* and move on. When a student who didn't study encounters it, they guess randomly. 

**The student who loses everything is the earnest aspirant who studied for 6 hours, solved it correctly, got the right answer, but saw the system mark them wrong.** 
- They don't blame the question; they doubt themselves. 
- They spend 45 minutes re-deriving the problem in frustration, lose momentum, develop imposter syndrome, and lose 5 ranks in the mock test.
- Every hour a faulty question remains live in Acadza’s ~8 lakh question bank, dozens of sincere students suffer this silent psychological tax.

**How our design reflects that:**
1. **Urgency-Ranked Queue:** Broken answer keys on high-traffic mock questions are assigned maximum urgency score (95+) and surfaced to the very top of the faculty queue.
2. **Empathetic Pedagogical Replies:** When students are correct, we validate their effort instantly (*"You're spot on! We updated the key to (D). Thanks for keeping Acadza sharp."*). When they made a conceptual error, we teach rather than dismiss.
3. **Double-Blind Solving:** Protects students from both false negatives (dismissing real defects) and false positives (accepting student misconceptions).

---

### 2. What would you NEVER let the AI auto-apply, and why?

We would **NEVER** auto-apply any change where **the original pedagogical intent must be newly authored or re-framed**:

1. **Missing or Corrupted Diagrams (`diagram`):** An AI cannot invent an author's intended circuit, geometry, or biological specimen. Synthesising an artificial diagram risks introducing subtle geometric or sign conventions that invalidate the question.
2. **Unsound Questions / Ambiguous Stems (`unsound`):** If a question has two correct options in an SCQ, or contradictory initial conditions, an automated edit cannot decide the examination policy. A subject matter expert must decide whether to re-frame the stem, replace distractors, or declare bonus marks.
3. **Syllabus Drops (`syllabus`):** NMC and NTA frequently prune the JEE/NEET syllabus (e.g. Earthworm in NEET biology, or Potentiometer in JEE Physics). Auto-deleting or reclassifying content without academic committee consensus risks misaligning mock tests with official blueprints.

**Rule:** AI is permitted to perform **surgical repair of verified mechanical flaws** (spelling, stray OCR noise, verified calculation typos); **human faculty must retain absolute stewardship over authored educational content.**

---

### 3. The One Metric to Watch in Week 1

**"Defect Half-Life" ($T_{1/2}$ of Active Defect Exposure)**

$$\text{Defect Half-Life} = \text{Time elapsed between the FIRST student report of a defect and its verified fix in production}$$

* **Why this metric matters:** Today, broken questions linger for weeks because faculty are overwhelmed by noise (70% false alarms). If $T_{1/2}$ drops from 7 days to **under 15 minutes** (via auto-apply for mechanical defects + prioritized 1-click faculty review for critical keys), the number of subsequent students exposed to that defect collapses to near-zero.
* **Guardrail Counter-Metric:** **"Rollback Rate" (< 0.5%)** — ensuring speed never comes at the expense of regression.

---

### 4. One Idea Beyond This Brief: The "Ghost Test" Proactive Immune System

Instead of waiting for students to report errors, we deploy **The Ghost Test Runner**:

Every night, before a scheduled test series goes live to 200,000 students, autonomous AI agents run a **simulated synthetic mock test**:
1. Three specialized solver agents (LLM reasoning engines with symbolic math solvers like SymPy) solve every question under timed constraints.
2. **Discrepancy Trigger:** If any question produces disagreement between the solver and the stored answer, or flags missing variables, it is immediately quarantined into the Faculty Review Console *before a single real student ever sees it*.
3. **Result:** Acadza shifts from **reactive post-incident triage** to **proactive zero-defect content reliability**.

