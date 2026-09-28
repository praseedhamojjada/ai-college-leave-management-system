from datetime import date

from backend.app.database import SessionLocal
from backend.app.models import (
    LeaveRequest,
    LeaveType,
    StudentProfile,
    User,
)


def seed_leave_requests(db):
    print("Creating leave requests...")

    students = {
        user.registration_number: user
        for user in db.query(User)
        .filter(User.role == "STUDENT")
        .all()
    }

    leave_types = {
        leave_type.type_name: leave_type
        for leave_type in db.query(LeaveType).all()
    }

    if not leave_types:
        raise ValueError("No leave types found. Run Phase 2A first.")

    student_profiles = (
        db.query(StudentProfile)
        .join(User, StudentProfile.user_id == User.user_id)
        .all()
    )

    if len(student_profiles) < 3:
        raise ValueError("Expected at least 3 student profiles.")

    priya = next(
        profile for profile in student_profiles
        if profile.user.email == "priya.student@campusleave.edu"
    )

    arjun = next(
        profile for profile in student_profiles
        if profile.user.email == "arjun.student@campusleave.edu"
    )

    sneha = next(
        profile for profile in student_profiles
        if profile.user.email == "sneha.student@campusleave.edu"
    )

    requests = [
        LeaveRequest(
            student_id=priya.student_id,
            leave_type_id=leave_types["Medical Leave"].leave_type_id,
            start_date=date(2026, 8, 3),
            end_date=date(2026, 8, 5),
            number_of_days=3,
            reason=(
                "I was experiencing a viral fever and was advised by the "
                "doctor to take rest for three days."
            ),
            attachment_url="/uploads/medical_certificate_priya.pdf",
            status="APPROVED",
            attendance_before=84.5,
            projected_attendance=82.1,
        ),

        LeaveRequest(
            student_id=priya.student_id,
            leave_type_id=leave_types["Academic Leave"].leave_type_id,
            start_date=date(2026, 8, 18),
            end_date=date(2026, 8, 19),
            number_of_days=2,
            reason=(
                "I have been selected to participate in an inter-college "
                "technical symposium and need leave to represent the college."
            ),
            attachment_url="/uploads/symposium_invitation_priya.pdf",
            status="PENDING",
            attendance_before=84.5,
            projected_attendance=82.9,
        ),

        LeaveRequest(
            student_id=arjun.student_id,
            leave_type_id=leave_types["Medical Leave"].leave_type_id,
            start_date=date(2026, 8, 10),
            end_date=date(2026, 8, 14),
            number_of_days=5,
            reason=(
                "I have been unwell for several days and require medical "
                "rest and treatment. I am requesting five days of leave."
            ),
            attachment_url="/uploads/medical_certificate_arjun.pdf",
            status="PENDING",
            attendance_before=78.2,
            projected_attendance=73.6,
        ),

        LeaveRequest(
            student_id=arjun.student_id,
            leave_type_id=leave_types["Casual Leave"].leave_type_id,
            start_date=date(2026, 8, 20),
            end_date=date(2026, 8, 23),
            number_of_days=4,
            reason=(
                "I need to attend a personal function at home and request "
                "leave for four days."
            ),
            attachment_url=None,
            status="REJECTED",
            attendance_before=78.2,
            projected_attendance=74.8,
            rejection_reason=(
                "Requested duration exceeds the maximum allowed days "
                "for Casual Leave."
            ),
        ),

        LeaveRequest(
            student_id=sneha.student_id,
            leave_type_id=leave_types["On-Duty Leave"].leave_type_id,
            start_date=date(2026, 8, 12),
            end_date=date(2026, 8, 13),
            number_of_days=2,
            reason=(
                "I am representing the college in an approved technical "
                "competition and require on-duty leave."
            ),
            attachment_url="/uploads/event_permission_sneha.pdf",
            status="APPROVED",
            attendance_before=91.4,
            projected_attendance=90.1,
        ),

        LeaveRequest(
            student_id=sneha.student_id,
            leave_type_id=leave_types["Personal Leave"].leave_type_id,
            start_date=date(2026, 8, 25),
            end_date=date(2026, 8, 26),
            number_of_days=2,
            reason=(
                "I need to take leave due to an important personal "
                "commitment and request two days of leave."
            ),
            attachment_url=None,
            status="PENDING",
            attendance_before=91.4,
            projected_attendance=90.2,
        ),
    ]

    db.add_all(requests)
    db.flush()

    return requests


def main():
    db = SessionLocal()

    try:
        print("Starting Phase 2C seed...")

        requests = seed_leave_requests(db)

        db.commit()

        print("\nPhase 2C completed successfully!")
        print(f"Created {len(requests)} leave requests.")

    except Exception as error:
        db.rollback()
        print(f"\nLeave request seed failed: {error}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()