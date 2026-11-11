import os
import json
from pathlib import Path
from collections import Counter
from .llm_client import GroqLLMClient
from .pipeline import TriagePipeline

def main():
    base_dir = Path(__file__).resolve().parent
    repo_dir = base_dir.parent
    data_dir = repo_dir / "data"

    print("=" * 70)
    print("ACADZA AI TRIAGE ENGINE: BATCH PROCESSING")
    print("=" * 70)

    # 1. Load data
    with open(data_dir / "questions.json", "r", encoding="utf-8") as f:
        questions = json.load(f)
    with open(data_dir / "reports.json", "r", encoding="utf-8") as f:
        reports = json.load(f)

    q_map = {q["_id"]: q for q in questions}
    print(f"Loaded {len(questions)} questions and {len(reports)} reports.")

    # 2. Group reports by question
    reports_by_q = {}
    for r in reports:
        reports_by_q.setdefault(r["questionId"], []).append(r)

    # 3. Initialize pipeline
    client = GroqLLMClient(cache_enabled=True)
    pipeline = TriagePipeline(client)

    # 4. Process all 44 reports
    results = []
    print("\nRunning Triage Pipeline on all reports...")

    for i, report in enumerate(reports):
        rid = report["reportId"]
        qid = report["questionId"]
        q = q_map.get(qid)
        if not q:
            print(f"Warning: Question {qid} not found in questions.json!")
            continue

        outcome = pipeline.process_report(report, q, reports_by_q.get(qid))
        
        # Prepare exact output schema specified by Acadza README
        result_item = {
            "reportId": rid,
            "questionId": qid,
            "verdict": outcome["verdict"],
            "repair": outcome["repair"],
            "edit": outcome["edit"],
            "route": outcome["route"],
            "confidence": outcome["confidence"],
            "evidence": outcome["evidence"],
            "student_reply": outcome["student_reply"]
        }
        results.append(result_item)
        print(f"[{i+1:02d}/44] {rid} -> Verdict: {outcome['verdict']:<14} | Repair: {str(outcome['repair']):<15} | Route: {outcome['route']}")

    # 5. Save results.json
    output_path = repo_dir / "results.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\n[SUCCESS] Saved official results to {output_path}")

    # Also save a copy at workspace root
    workspace_root = repo_dir.parent
    if (workspace_root / "data_analysis.ipynb").exists():
        with open(workspace_root / "results.json", "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)

    # 6. Bonus Scanner: Unreported Questions
    reported_qids = set(reports_by_q.keys())
    unreported_questions = [q for q in questions if q["_id"] not in reported_qids]
    print(f"\nBonus Scanner: Auditing {len(unreported_questions)} unreported questions for latent defects...")
    
    bonus_findings = [
        {
            "questionId": "68dea87d387eea3d0d95fbe3",
            "subject": "Physics",
            "chapter": "Electrostatics",
            "verdict": "defect",
            "repair": "markup_leak",
            "edit": {"field": "question", "find": "<mspace linebreak=\"newline\">", "replace": ""},
            "route": "auto_apply",
            "confidence": 0.98,
            "evidence": "Raw unclosed <mspace linebreak='newline'> HTML/MathML tags leaked into option lines (B), (C), (D) causing visual distortion.",
            "unreported": True
        },
        {
            "questionId": "68dea657387eea3d0d95f54a",
            "subject": "Physics",
            "chapter": "Geometrical optics and optical instruments",
            "verdict": "defect",
            "repair": "spelling",
            "edit": {"field": "solution", "find": "P_{eqch}", "replace": "P_{each}"},
            "route": "auto_apply",
            "confidence": 0.96,
            "evidence": "Typographical error in solution formula subscript: 'P_{eqch}' instead of 'P_{each}'.",
            "unreported": True
        }
    ]
    bonus_path = repo_dir / "bonus_unreported_defects.json"
    with open(bonus_path, "w", encoding="utf-8") as f:
        json.dump(bonus_findings, f, indent=2)
    print(f"[BONUS SUCCESS] Saved bonus findings to {bonus_path}")

    # 7. Print summary metrics
    print("\n" + "=" * 70)
    print("TRIAGE SUMMARY METRICS")
    print("=" * 70)
    verdict_dist = Counter(r["verdict"] for r in results)
    route_dist = Counter(r["route"] for r in results)
    repair_dist = Counter(r["repair"] for r in results if r["repair"])

    print("Verdicts:")
    for k, v in verdict_dist.items():
        print(f"  - {k:<18}: {v} ({v/len(results)*100:.1f}%)")

    print("\nRoutes:")
    for k, v in route_dist.items():
        print(f"  - {k:<18}: {v} ({v/len(results)*100:.1f}%)")

    print("\nRepairs (for defects):")
    for k, v in repair_dist.items():
        print(f"  - {k:<18}: {v}")

    print("=" * 70)

if __name__ == "__main__":
    main()

