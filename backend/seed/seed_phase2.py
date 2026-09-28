from datetime import date, timedelta

from sqlalchemy import select

from backend.app.database import SessionLocal
from backend.app.models import (
    LeaveType,
    AttendanceRecord,
    LeaveRequest,
    ApprovalHistory,
    AIAnalysis,
    Notification,
    AuditLog,
    StudentProfile,
    User,
)


def seed_leave_types(db):
    print("Creating leave types...")

    leave_types = [
        LeaveType(
            type_name="Medical Leave",
            description="Leave granted for illness, medical treatment, or health-related reasons.",
            max_days_per_request=15,
            requires_document=True,
            is_active=True,
        ),
        LeaveType(
            type_name="Casual Leave",
            description="Short-duration leave for personal or routine matters.",
            max_days_per_request=3,
            requires_document=False,
            is_active=True,
        ),
        LeaveType(
            type_name="Emergency Leave",
            description="Leave requested due to unexpected family or personal emergencies.",
            max_days_per_request=7,
            requires_document=False,
            is_active=True,
        ),
        LeaveType(
            type_name="Academic Leave",
            description="Leave for academic competitions, examinations, conferences, or related activities.",
            max_days_per_request=10,
            requires_document=True,
            is_active=True,
        ),
        LeaveType(
            type_name="On-Duty Leave",
            description="Leave for approved college activities, events, internships, or official representation.",
            max_days_per_request=15,
            requires_document=True,
            is_active=True,
        ),
        LeaveType(
            type_name="Personal Leave",
            description="Leave for personal commitments that do not fall under other leave categories.",
            max_days_per_request=3,
            requires_document=False,
            is_active=True,
        ),
    ]

    db.add_all(leave_types)
    db.flush()

    return leave_types


def main():
    db = SessionLocal()

    try:
        print("Starting Phase 2 seed...")

        leave_types = seed_leave_types(db)

        db.commit()

        print("\nPhase 2A completed successfully!")
        print(f"Created {len(leave_types)} leave types.")

    except Exception as error:
        db.rollback()
        print(f"\nPhase 2 seed failed: {error}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()