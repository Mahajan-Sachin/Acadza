import json
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

# Load taxonomy
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
TAXONOMY_PATH = DATA_DIR / "taxonomy.json"

with open(TAXONOMY_PATH, 'r', encoding='utf-8') as f:
    TAXONOMY = json.load(f)

VALID_VERDICTS = set(TAXONOMY["verdicts"].keys())
VALID_REPAIRS = TAXONOMY["repairs"]

class TaxonomyGuard:
    @staticmethod
    def validate_and_enforce(
        verdict: str,
        repair: Optional[str],
        edit: Optional[Dict[str, Any]],
        confidence: float,
        evidence: str,
        student_reply: str,
        route: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Enforces strict safety rules from taxonomy.json:
        1. verdict must belong to closed list
        2. if not defect -> repair=null, edit=null, route=no_change
        3. if defect -> repair must belong to closed list
        4. edit must only touch fields permitted by repair['fields']
        5. if repair['auto'] is False -> route MUST be faculty_review
        6. confidence must be clamped between 0.0 and 1.0
        """
        # 1. Validate verdict
        if verdict not in VALID_VERDICTS:
            raise ValueError(f"Invalid verdict: '{verdict}'. Must be one of {VALID_VERDICTS}")

        # 2. Non-defect handling
        if verdict != "defect":
            return {
                "verdict": verdict,
                "repair": None,
                "edit": None,
                "route": "no_change",
                "confidence": min(1.0, max(0.0, float(confidence))),
                "evidence": evidence.strip(),
                "student_reply": student_reply.strip()
            }

        # 3. Defect handling: Repair must be valid
        if not repair or repair not in VALID_REPAIRS:
            raise ValueError(f"Invalid repair: '{repair}' for defect verdict. Must be one of {list(VALID_REPAIRS.keys())}")

        repair_info = VALID_REPAIRS[repair]
        allowed_fields = repair_info["fields"]
        can_auto = repair_info["auto"]

        # 4. Validate edit
        if edit:
            edit_field = edit.get("field")
            if edit_field not in allowed_fields:
                # Security violation: repair attempted to mutate an unpermitted field!
                print(f"[TaxonomyGuard Security Warning] Repair '{repair}' attempted to mutate unpermitted field '{edit_field}'. Permitted: {allowed_fields}")
                # Demote to faculty_review and strip the invalid edit or require manual review
                return {
                    "verdict": verdict,
                    "repair": repair,
                    "edit": None,
                    "route": "faculty_review",
                    "confidence": min(1.0, max(0.0, float(confidence))),
                    "evidence": f"Flagged for manual review. Proposed field '{edit_field}' exceeds repair permission for '{repair}'. {evidence}".strip(),
                    "student_reply": student_reply.strip()
                }

        # 5. Routing logic
        final_route = route
        if not can_auto:
            # Rule: 'auto: false' means a human (faculty) must approve
            final_route = "faculty_review"
        elif not final_route:
            # If auto is allowed and confidence >= 0.88, auto_apply; else faculty_review
            if confidence >= 0.88 and edit is not None:
                final_route = "auto_apply"
            else:
                final_route = "faculty_review"

        return {
            "verdict": verdict,
            "repair": repair,
            "edit": edit,
            "route": final_route,
            "confidence": round(min(1.0, max(0.0, float(confidence))), 2),
            "evidence": evidence.strip(),
            "student_reply": student_reply.strip()
        }

