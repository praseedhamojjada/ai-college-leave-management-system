from dataclasses import dataclass


@dataclass
class AIAnalysisResult:
    reason_category: str
    urgency_score: float
    risk_score: float
    attendance_risk: float
    policy_compliance: float
    recommendation: str
    confidence: float
    explanation: str


def analyze_leave(
    reason: str,
    leave_type_name: str,
    number_of_days: int,
    attendance_before: float | None,
    projected_attendance: float | None,
) -> AIAnalysisResult:

    reason_lower = reason.lower()
    leave_type_lower = leave_type_name.lower()

    # ---------------------------------------------------------
    # 1. REASON CATEGORY
    # ---------------------------------------------------------

    if any(
        keyword in reason_lower
        for keyword in [
            "doctor",
            "medical",
            "illness",
            "fever",
            "hospital",
            "treatment",
            "sick",
        ]
    ):
        reason_category = "MEDICAL"

    elif any(
        keyword in reason_lower
        for keyword in [
            "symposium",
            "conference",
            "competition",
            "academic",
            "exam",
            "workshop",
            "college event",
        ]
    ):
        reason_category = "ACADEMIC"

    elif any(
        keyword in reason_lower
        for keyword in [
            "emergency",
            "accident",
            "urgent",
            "family emergency",
        ]
    ):
        reason_category = "EMERGENCY"

    elif any(
        keyword in reason_lower
        for keyword in [
            "personal",
            "function",
            "family",
            "commitment",
        ]
    ):
        reason_category = "PERSONAL"

    elif "on-duty" in leave_type_lower:
        reason_category = "ON_DUTY"

    else:
        reason_category = "OTHER"

    # ---------------------------------------------------------
    # 2. URGENCY SCORE
    # ---------------------------------------------------------

    urgency_score = 0.30

    if reason_category == "EMERGENCY":
        urgency_score = 0.95

    elif reason_category == "MEDICAL":
        urgency_score = 0.80

    elif reason_category == "ACADEMIC":
        urgency_score = 0.60

    elif reason_category == "PERSONAL":
        urgency_score = 0.40

    # ---------------------------------------------------------
    # 3. ATTENDANCE RISK
    # ---------------------------------------------------------

    if projected_attendance is None:
        attendance_risk = 0.50

    elif projected_attendance < 65:
        attendance_risk = 0.95

    elif projected_attendance < 75:
        attendance_risk = 0.80

    elif projected_attendance < 80:
        attendance_risk = 0.55

    elif projected_attendance < 85:
        attendance_risk = 0.35

    else:
        attendance_risk = 0.15

    # ---------------------------------------------------------
    # 4. GENERAL RISK SCORE
    # ---------------------------------------------------------

    duration_risk = min(
        number_of_days / 10,
        1.0,
    )

    risk_score = round(
        (attendance_risk * 0.70)
        + (duration_risk * 0.30),
        2,
    )

    # ---------------------------------------------------------
    # 5. POLICY COMPLIANCE
    # ---------------------------------------------------------

    policy_compliance = 1.0

    if projected_attendance is not None:
        if projected_attendance < 75:
            policy_compliance = 0.40

        elif projected_attendance < 80:
            policy_compliance = 0.65

        elif projected_attendance < 85:
            policy_compliance = 0.85

    # ---------------------------------------------------------
    # 6. RECOMMENDATION
    # ---------------------------------------------------------

    if (
        policy_compliance < 0.50
        and reason_category not in ["MEDICAL", "EMERGENCY"]
    ):
        recommendation = "REJECT"

    elif (
        attendance_risk >= 0.80
        or number_of_days >= 5
    ):
        recommendation = "REVIEW"

    elif (
        reason_category in ["MEDICAL", "EMERGENCY"]
        and policy_compliance >= 0.65
    ):
        recommendation = "APPROVE"

    elif policy_compliance >= 0.80:
        recommendation = "APPROVE"

    else:
        recommendation = "REVIEW"

    # ---------------------------------------------------------
    # 7. CONFIDENCE
    # ---------------------------------------------------------

    confidence = round(
        0.70
        + (0.10 if reason_category != "OTHER" else 0.0)
        + (0.10 if attendance_before is not None else 0.0),
        2,
    )

    confidence = min(confidence, 0.95)

    # ---------------------------------------------------------
    # 8. EXPLANATION
    # ---------------------------------------------------------

    explanation = (
        f"The request was classified as {reason_category.lower()} "
        f"with an urgency score of {urgency_score:.2f}. "
    )

    if projected_attendance is not None:
        explanation += (
            f"Projected attendance after leave is "
            f"{projected_attendance:.1f}%. "
        )

    explanation += (
        f"Attendance risk is {attendance_risk:.2f}, "
        f"policy compliance is {policy_compliance:.2f}, "
        f"and the system recommends {recommendation.lower()} "
        f"for faculty review."
    )

    return AIAnalysisResult(
        reason_category=reason_category,
        urgency_score=urgency_score,
        risk_score=risk_score,
        attendance_risk=attendance_risk,
        policy_compliance=policy_compliance,
        recommendation=recommendation,
        confidence=confidence,
        explanation=explanation,
    )