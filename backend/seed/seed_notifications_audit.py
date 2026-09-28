from datetime import datetime

from backend.app.database import SessionLocal
from backend.app.models import (
    AuditLog,
    LeaveRequest,
    Notification,
    User,
)


def seed_notifications(db, leave_requests):
    print("Creating notifications...")

    students = (
        db.query(User)
        .filter(User.role == "STUDENT")
        .all()
    )

    student_by_email = {
        student.email: student
        for student in students
    }

    faculty = (
        db.query(User)
        .filter(User.email == "meera.faculty@campusleave.edu")
        .first()
    )

    hod = (
        db.query(User)
        .filter(User.email == "rajesh.hod@campusleave.edu")
        .first()
    )

    if not faculty or not hod:
        raise ValueError("Required faculty/HOD users not found.")

    notifications = [
        Notification(
            user_id=student_by_email[
                "priya.student@campusleave.edu"
            ].user_id,
            leave_id=leave_requests[0].leave_id,
            notification_type="LEAVE_APPROVED",
            title="Medical Leave Approved",
            message=(
                "Your medical leave request from 3 August to 5 August "
                "2026 has been approved by the faculty."
            ),
            is_read=True,
            created_at=datetime(2026, 8, 2, 10, 35),
        ),

        Notification(
            user_id=student_by_email[
                "priya.student@campusleave.edu"
            ].user_id,
            leave_id=leave_requests[1].leave_id,
            notification_type="LEAVE_PENDING",
            title="Leave Request Under Review",
            message=(
                "Your academic leave request from 18 August to 19 August "
                "2026 is currently awaiting faculty review."
            ),
            is_read=False,
            created_at=datetime(2026, 8, 17, 9, 15),
        ),

        Notification(
            user_id=student_by_email[
                "arjun.student@campusleave.edu"
            ].user_id,
            leave_id=leave_requests[2].leave_id,
            notification_type="AI_REVIEW_REQUIRED",
            title="Additional Review Required",
            message=(
                "Your medical leave request requires additional review "
                "because of its potential attendance impact."
            ),
            is_read=False,
            created_at=datetime(2026, 8, 9, 16, 20),
        ),

        Notification(
            user_id=student_by_email[
                "arjun.student@campusleave.edu"
            ].user_id,
            leave_id=leave_requests[3].leave_id,
            notification_type="LEAVE_REJECTED",
            title="Leave Request Rejected",
            message=(
                "Your Casual Leave request was rejected because the "
                "requested duration exceeds the allowed limit."
            ),
            is_read=True,
            created_at=datetime(2026, 8, 19, 14, 20),
        ),

        Notification(
            user_id=student_by_email[
                "sneha.student@campusleave.edu"
            ].user_id,
            leave_id=leave_requests[4].leave_id,
            notification_type="LEAVE_APPROVED",
            title="On-Duty Leave Approved",
            message=(
                "Your On-Duty Leave request for the approved college "
                "technical competition has been approved."
            ),
            is_read=True,
            created_at=datetime(2026, 8, 11, 11, 5),
        ),

        Notification(
            user_id=student_by_email[
                "sneha.student@campusleave.edu"
            ].user_id,
            leave_id=leave_requests[5].leave_id,
            notification_type="LEAVE_PENDING",
            title="Personal Leave Under Review",
            message=(
                "Your personal leave request is currently awaiting "
                "faculty review."
            ),
            is_read=False,
            created_at=datetime(2026, 8, 24, 10, 0),
        ),

        Notification(
            user_id=faculty.user_id,
            leave_id=leave_requests[1].leave_id,
            notification_type="NEW_LEAVE_REQUEST",
            title="New Leave Request",
            message=(
                "Priya Sharma has submitted an academic leave request "
                "requiring your review."
            ),
            is_read=False,
            created_at=datetime(2026, 8, 17, 9, 10),
        ),

        Notification(
            user_id=faculty.user_id,
            leave_id=leave_requests[2].leave_id,
            notification_type="AI_RISK_ALERT",
            title="Attendance Risk Alert",
            message=(
                "Arjun Reddy's medical leave request has been flagged "
                "for attendance-risk review."
            ),
            is_read=False,
            created_at=datetime(2026, 8, 9, 16, 15),
        ),

        Notification(
            user_id=hod.user_id,
            leave_id=leave_requests[4].leave_id,
            notification_type="LEAVE_APPROVED",
            title="On-Duty Leave Processed",
            message=(
                "The On-Duty Leave request submitted by Sneha Rao "
                "has been approved."
            ),
            is_read=True,
            created_at=datetime(2026, 8, 11, 11, 10),
        ),
    ]

    db.add_all(notifications)
    db.flush()

    return notifications


def seed_audit_logs(db, leave_requests):
    print("Creating audit logs...")

    priya = (
        db.query(User)
        .filter(User.email == "priya.student@campusleave.edu")
        .first()
    )

    arjun = (
        db.query(User)
        .filter(User.email == "arjun.student@campusleave.edu")
        .first()
    )

    sneha = (
        db.query(User)
        .filter(User.email == "sneha.student@campusleave.edu")
        .first()
    )

    faculty = (
        db.query(User)
        .filter(User.email == "meera.faculty@campusleave.edu")
        .first()
    )

    hod = (
        db.query(User)
        .filter(User.email == "rajesh.hod@campusleave.edu")
        .first()
    )

    if not all([priya, arjun, sneha, faculty, hod]):
        raise ValueError("Required users not found.")

    logs = [
        AuditLog(
            user_id=priya.user_id,
            action="LEAVE_SUBMITTED",
            entity_type="LEAVE_REQUEST",
            entity_id=leave_requests[0].leave_id,
            old_value=None,
            new_value="PENDING",
            ip_address="192.168.1.101",
            created_at=datetime(2026, 8, 1, 9, 30),
        ),

        AuditLog(
            user_id=faculty.user_id,
            action="LEAVE_APPROVED",
            entity_type="LEAVE_REQUEST",
            entity_id=leave_requests[0].leave_id,
            old_value="PENDING",
            new_value="APPROVED",
            ip_address="192.168.1.110",
            created_at=datetime(2026, 8, 2, 10, 30),
        ),

        AuditLog(
            user_id=priya.user_id,
            action="LEAVE_SUBMITTED",
            entity_type="LEAVE_REQUEST",
            entity_id=leave_requests[1].leave_id,
            old_value=None,
            new_value="PENDING",
            ip_address="192.168.1.101",
            created_at=datetime(2026, 8, 17, 9, 10),
        ),

        AuditLog(
            user_id=arjun.user_id,
            action="LEAVE_SUBMITTED",
            entity_type="LEAVE_REQUEST",
            entity_id=leave_requests[2].leave_id,
            old_value=None,
            new_value="PENDING",
            ip_address="192.168.1.102",
            created_at=datetime(2026, 8, 9, 16, 0),
        ),

        AuditLog(
            user_id=faculty.user_id,
            action="AI_REVIEW_TRIGGERED",
            entity_type="LEAVE_REQUEST",
            entity_id=leave_requests[2].leave_id,
            old_value=None,
            new_value="REVIEW_REQUIRED",
            ip_address="192.168.1.110",
            created_at=datetime(2026, 8, 9, 16, 15),
        ),

        AuditLog(
            user_id=faculty.user_id,
            action="LEAVE_REJECTED",
            entity_type="LEAVE_REQUEST",
            entity_id=leave_requests[3].leave_id,
            old_value="PENDING",
            new_value="REJECTED",
            ip_address="192.168.1.110",
            created_at=datetime(2026, 8, 19, 14, 15),
        ),

        AuditLog(
            user_id=sneha.user_id,
            action="LEAVE_SUBMITTED",
            entity_type="LEAVE_REQUEST",
            entity_id=leave_requests[4].leave_id,
            old_value=None,
            new_value="PENDING",
            ip_address="192.168.1.103",
            created_at=datetime(2026, 8, 11, 10, 30),
        ),

        AuditLog(
            user_id=hod.user_id,
            action="LEAVE_APPROVED",
            entity_type="LEAVE_REQUEST",
            entity_id=leave_requests[4].leave_id,
            old_value="PENDING",
            new_value="APPROVED",
            ip_address="192.168.1.120",
            created_at=datetime(2026, 8, 11, 11, 0),
        ),

        AuditLog(
            user_id=sneha.user_id,
            action="LEAVE_SUBMITTED",
            entity_type="LEAVE_REQUEST",
            entity_id=leave_requests[5].leave_id,
            old_value=None,
            new_value="PENDING",
            ip_address="192.168.1.103",
            created_at=datetime(2026, 8, 24, 9, 55),
        ),

        AuditLog(
            user_id=faculty.user_id,
            action="AI_ANALYSIS_CREATED",
            entity_type="AI_ANALYSIS",
            entity_id=3,
            old_value=None,
            new_value="REVIEW",
            ip_address="192.168.1.110",
            created_at=datetime(2026, 8, 9, 16, 10),
        ),
    ]

    db.add_all(logs)
    db.flush()

    return logs


def main():
    db = SessionLocal()

    try:
        print("Starting Phase 2E seed...")

        leave_requests = (
            db.query(LeaveRequest)
            .order_by(LeaveRequest.leave_id)
            .all()
        )

        if len(leave_requests) != 6:
            raise ValueError(
                f"Expected 6 leave requests, found {len(leave_requests)}."
            )

        notifications = seed_notifications(
            db,
            leave_requests
        )

        audit_logs = seed_audit_logs(
            db,
            leave_requests
        )

        db.commit()

        print("\nPhase 2E completed successfully!")
        print(f"Created {len(notifications)} notifications.")
        print(f"Created {len(audit_logs)} audit logs.")

    except Exception as error:
        db.rollback()
        print(f"\nPhase 2E seed failed: {error}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()