from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.roles import require_role
from backend.app.database import get_db
from backend.app.models import AIAnalysis, LeaveRequest, LeaveType, StudentProfile, User
from backend.app.services.attendance_service import get_student_attendance_summary

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Insights"],
)


# ============================================================
# GET MY AI INSIGHTS
# Student-safe endpoint.
# Returns only analyses belonging to the logged-in student.
# ============================================================

@router.get("/my")
def get_my_ai_insights(
    current_user: User = Depends(require_role("STUDENT")),
    db: Session = Depends(get_db),
):
    student = (
        db.query(StudentProfile)
        .filter(StudentProfile.user_id == current_user.user_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found",
        )

    rows = (
        db.query(AIAnalysis, LeaveRequest, LeaveType)
        .join(
            LeaveRequest,
            AIAnalysis.leave_id == LeaveRequest.leave_id,
        )
        .join(
            LeaveType,
            LeaveRequest.leave_type_id == LeaveType.leave_type_id,
        )
        .filter(
            LeaveRequest.student_id == student.student_id,
        )
        .order_by(
            AIAnalysis.created_at.desc(),
        )
        .all()
    )

    attendance_summary = get_student_attendance_summary(
        db,
        student.student_id,
    )

    return {
        "student": {
            "student_id": student.student_id,
            "name": current_user.full_name,
            "email": current_user.email,
            "attendance": attendance_summary["attendance_percentage"],
            "classes_held": attendance_summary["classes_held"],
            "classes_attended": attendance_summary["classes_attended"],
            "classes_absent": attendance_summary["classes_absent"],
        },
        "count": len(rows),
        "insights": [
            {
                "analysis_id": analysis.analysis_id,
                "leave_id": leave.leave_id,
                "leave_type": leave_type.type_name,
                "start_date": leave.start_date,
                "end_date": leave.end_date,
                "number_of_days": leave.number_of_days,
                "leave_status": leave.status,
                "reason": leave.reason,
                "attendance_before": leave.attendance_before,
                "projected_attendance": leave.projected_attendance,
                "model_name": analysis.model_name,
                "reason_category": analysis.reason_category,
                "urgency_score": analysis.urgency_score,
                "risk_score": analysis.risk_score,
                "attendance_risk": analysis.attendance_risk,
                "policy_compliance": analysis.policy_compliance,
                "recommendation": analysis.recommendation,
                "confidence": analysis.confidence,
                "explanation": analysis.explanation,
                "created_at": analysis.created_at,
            }
            for analysis, leave, leave_type in rows
        ],
        "disclaimer": (
            "AI recommendations are decision-support information. "
            "Final leave decisions remain with authorized college staff."
        ),
    }


# ============================================================
# GET ONE OF MY AI INSIGHTS
# Useful for a future leave-details page.
# ============================================================

@router.get("/my/{leave_id}")
def get_my_ai_insight(
    leave_id: int,
    current_user: User = Depends(require_role("STUDENT")),
    db: Session = Depends(get_db),
):
    student = (
        db.query(StudentProfile)
        .filter(StudentProfile.user_id == current_user.user_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found",
        )

    row = (
        db.query(AIAnalysis, LeaveRequest, LeaveType)
        .join(
            LeaveRequest,
            AIAnalysis.leave_id == LeaveRequest.leave_id,
        )
        .join(
            LeaveType,
            LeaveRequest.leave_type_id == LeaveType.leave_type_id,
        )
        .filter(
            LeaveRequest.leave_id == leave_id,
            LeaveRequest.student_id == student.student_id,
        )
        .order_by(AIAnalysis.created_at.desc())
        .first()
    )

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI analysis not found for this leave request",
        )

    analysis, leave, leave_type = row

    return {
        "analysis_id": analysis.analysis_id,
        "leave_id": leave.leave_id,
        "leave_type": leave_type.type_name,
        "start_date": leave.start_date,
        "end_date": leave.end_date,
        "number_of_days": leave.number_of_days,
        "leave_status": leave.status,
        "reason": leave.reason,
        "attendance_before": leave.attendance_before,
        "projected_attendance": leave.projected_attendance,
        "model_name": analysis.model_name,
        "reason_category": analysis.reason_category,
        "urgency_score": analysis.urgency_score,
        "risk_score": analysis.risk_score,
        "attendance_risk": analysis.attendance_risk,
        "policy_compliance": analysis.policy_compliance,
        "recommendation": analysis.recommendation,
        "confidence": analysis.confidence,
        "explanation": analysis.explanation,
        "created_at": analysis.created_at,
        "disclaimer": (
            "AI recommendations are decision-support information. "
            "Final leave decisions remain with authorized college staff."
        ),
    }
