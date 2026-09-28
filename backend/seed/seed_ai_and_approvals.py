from datetime import datetime, timedelta

from backend.app.database import SessionLocal
from backend.app.models import (
    AIAnalysis,
    ApprovalHistory,
    LeaveRequest,
    User,
)


def seed_ai_analysis(db, leave_requests):
    print("Creating AI analysis records...")

    analyses = [
        AIAnalysis(
            leave_id=leave_requests[0].leave_id,
            model_name="CampusLeave-AI-v1",
            reason_category="MEDICAL",
            urgency_score=0.82,
            risk_score=0.18,
            attendance_risk=0.21,
            policy_compliance=0.94,
            recommendation="APPROVE",
            confidence=0.91,
            explanation=(
                "The request indicates a medical condition and includes "
                "supporting documentation. The requested duration is within "
                "the permitted medical leave limit and the projected "
                "attendance remains above the configured threshold."
            ),
        ),

        AIAnalysis(
            leave_id=leave_requests[1].leave_id,
            model_name="CampusLeave-AI-v1",
            reason_category="ACADEMIC",
            urgency_score=0.68,
            risk_score=0.12,
            attendance_risk=0.19,
            policy_compliance=0.91,
            recommendation="REVIEW",
            confidence=0.88,
            explanation=(
                "The reason appears related to an academic event and the "
                "requested duration is within the academic leave policy. "
                "Faculty verification of the event documentation is recommended."
            ),
        ),

        AIAnalysis(
            leave_id=leave_requests[2].leave_id,
            model_name="CampusLeave-AI-v1",
            reason_category="MEDICAL",
            urgency_score=0.89,
            risk_score=0.67,
            attendance_risk=0.91,
            policy_compliance=0.73,
            recommendation="REVIEW",
            confidence=0.86,
            explanation=(
                "The medical reason appears plausible, but the student's "
                "projected attendance is significantly reduced after the "
                "requested leave. Human review is recommended before approval."
            ),
        ),

        AIAnalysis(
            leave_id=leave_requests[3].leave_id,
            model_name="CampusLeave-AI-v1",
            reason_category="PERSONAL",
            urgency_score=0.45,
            risk_score=0.79,
            attendance_risk=0.82,
            policy_compliance=0.32,
            recommendation="REJECT",
            confidence=0.95,
            explanation=(
                "The requested four-day duration exceeds the configured "
                "three-day maximum for Casual Leave. The request also creates "
                "additional attendance risk."
            ),
        ),

        AIAnalysis(
            leave_id=leave_requests[4].leave_id,
            model_name="CampusLeave-AI-v1",
            reason_category="ON_DUTY",
            urgency_score=0.76,
            risk_score=0.08,
            attendance_risk=0.10,
            policy_compliance=0.97,
            recommendation="APPROVE",
            confidence=0.94,
            explanation=(
                "The request is associated with an approved college activity. "
                "The requested duration is within the configured On-Duty limit "
                "and the student's projected attendance remains healthy."
            ),
        ),

        AIAnalysis(
            leave_id=leave_requests[5].leave_id,
            model_name="CampusLeave-AI-v1",
            reason_category="PERSONAL",
            urgency_score=0.42,
            risk_score=0.14,
            attendance_risk=0.11,
            policy_compliance=0.90,
            recommendation="REVIEW",
            confidence=0.84,
            explanation=(
                "The request is within the permitted duration and does not "
                "create significant attendance risk. Faculty review is still "
                "required because the reason is personal."
            ),
        ),
    ]

    db.add_all(analyses)
    db.flush()

    return analyses


def seed_approval_history(db, leave_requests):
    print("Creating approval history...")

    faculty = (
        db.query(User)
        .filter(
            User.email == "meera.faculty@campusleave.edu"
        )
        .first()
    )

    hod = (
        db.query(User)
        .filter(
            User.email == "rajesh.hod@campusleave.edu"
        )
        .first()
    )

    if not faculty or not hod:
        raise ValueError("Required faculty/HOD users not found.")

    history = [
        ApprovalHistory(
            leave_id=leave_requests[0].leave_id,
            reviewer_id=faculty.user_id,
            reviewer_role="FACULTY",
            action="APPROVED",
            comments=(
                "Medical documentation verified. Leave approved."
            ),
            action_timestamp=datetime(2026, 8, 2, 10, 30),
        ),

        ApprovalHistory(
            leave_id=leave_requests[3].leave_id,
            reviewer_id=faculty.user_id,
            reviewer_role="FACULTY",
            action="REJECTED",
            comments=(
                "Casual Leave request exceeds the maximum allowed duration."
            ),
            action_timestamp=datetime(2026, 8, 19, 14, 15),
        ),

        ApprovalHistory(
            leave_id=leave_requests[4].leave_id,
            reviewer_id=hod.user_id,
            reviewer_role="HOD",
            action="APPROVED",
            comments=(
                "College activity verified. On-Duty leave approved."
            ),
            action_timestamp=datetime(2026, 8, 11, 11, 0),
        ),
    ]

    db.add_all(history)
    db.flush()

    return history


def main():
    db = SessionLocal()

    try:
        print("Starting Phase 2D seed...")

        leave_requests = (
            db.query(LeaveRequest)
            .order_by(LeaveRequest.leave_id)
            .all()
        )

        if len(leave_requests) != 6:
            raise ValueError(
                f"Expected 6 leave requests, found {len(leave_requests)}."
            )

        analyses = seed_ai_analysis(db, leave_requests)
        history = seed_approval_history(db, leave_requests)

        db.commit()

        print("\nPhase 2D completed successfully!")
        print(f"Created {len(analyses)} AI analysis records.")
        print(f"Created {len(history)} approval history records.")

    except Exception as error:
        db.rollback()
        print(f"\nPhase 2D seed failed: {error}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()