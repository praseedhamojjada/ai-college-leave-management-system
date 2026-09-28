from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.roles import require_role
from backend.app.database import get_db
from backend.app.models import (
    LeaveRequest,
    Notification,
    StudentProfile,
    User,
)

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get("/student")
def get_student_dashboard(
    current_user: User = Depends(require_role("STUDENT")),
    db: Session = Depends(get_db),
):
    # Find student profile
    student = (
        db.query(StudentProfile)
        .filter(
            StudentProfile.user_id == current_user.user_id
        )
        .first()
    )

    if not student:
        return {
            "error": "Student profile not found"
        }

    # Get all leave requests
    leaves = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.student_id == student.student_id
        )
        .order_by(
            LeaveRequest.submitted_at.desc()
        )
        .all()
    )

    # Leave statistics
    total_leaves = len(leaves)

    pending_leaves = sum(
        1 for leave in leaves
        if leave.status == "PENDING"
    )

    approved_leaves = sum(
        1 for leave in leaves
        if leave.status == "APPROVED"
    )

    rejected_leaves = sum(
        1 for leave in leaves
        if leave.status == "REJECTED"
    )

    cancelled_leaves = sum(
        1 for leave in leaves
        if leave.status == "CANCELLED"
    )

    # Recent leaves
    recent_leaves = [
        {
            "leave_id": leave.leave_id,
            "leave_type_id": leave.leave_type_id,
            "start_date": leave.start_date,
            "end_date": leave.end_date,
            "number_of_days": leave.number_of_days,
            "reason": leave.reason,
            "status": leave.status,
            "attendance_before": leave.attendance_before,
            "projected_attendance": leave.projected_attendance,
            "submitted_at": leave.submitted_at,
        }
        for leave in leaves[:5]
    ]

    # Unread notifications
    notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.user_id,
            Notification.is_read.is_(False),
        )
        .order_by(
            Notification.created_at.desc()
        )
        .limit(5)
        .all()
    )

    unread_notifications = [
        {
            "notification_id": notification.notification_id,
            "leave_id": notification.leave_id,
            "notification_type": notification.notification_type,
            "title": notification.title,
            "message": notification.message,
            "created_at": notification.created_at,
        }
        for notification in notifications
    ]

    return {
        "student": {
            "user_id": current_user.user_id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "department_id": current_user.department_id,
            "year": student.year,
            "semester": student.semester,
            "section": student.section,
            "batch": student.batch,
            "current_cgpa": student.current_cgpa,
            "total_attendance": student.total_attendance,
        },
        "leave_summary": {
            "total": total_leaves,
            "pending": pending_leaves,
            "approved": approved_leaves,
            "rejected": rejected_leaves,
            "cancelled": cancelled_leaves,
        },
        "recent_leaves": recent_leaves,
        "unread_notifications": unread_notifications,
    }

# FACULTY DASHBOARD
@router.get("/faculty")
def get_faculty_dashboard(
    current_user: User = Depends(
        require_role("FACULTY")
    ),
    db: Session = Depends(get_db),
):
    # Get all leave requests
    leaves = (
        db.query(LeaveRequest)
        .order_by(
            LeaveRequest.submitted_at.desc()
        )
        .all()
    )

    # Leave statistics
    total_leaves = len(leaves)

    pending_leaves = sum(
        1 for leave in leaves
        if leave.status == "PENDING"
    )

    approved_leaves = sum(
        1 for leave in leaves
        if leave.status == "APPROVED"
    )

    rejected_leaves = sum(
        1 for leave in leaves
        if leave.status == "REJECTED"
    )

    cancelled_leaves = sum(
        1 for leave in leaves
        if leave.status == "CANCELLED"
    )

    # Get recent requests
    recent_leaves = (
        db.query(
            LeaveRequest,
            StudentProfile,
            User,
        )
        .join(
            StudentProfile,
            LeaveRequest.student_id == StudentProfile.student_id,
        )
        .join(
            User,
            StudentProfile.user_id == User.user_id,
        )
        .order_by(
            LeaveRequest.submitted_at.desc()
        )
        .limit(10)
        .all()
    )

    recent_requests = [
        {
            "leave_id": leave.leave_id,
            "student_id": student.student_id,
            "student_name": student_user.full_name,
            "student_email": student_user.email,
            "leave_type_id": leave.leave_type_id,
            "start_date": leave.start_date,
            "end_date": leave.end_date,
            "number_of_days": leave.number_of_days,
            "reason": leave.reason,
            "status": leave.status,
            "attendance_before": leave.attendance_before,
            "projected_attendance": leave.projected_attendance,
            "submitted_at": leave.submitted_at,
        }
        for leave, student, student_user in recent_leaves
    ]

    # Attendance-risk requests
    risk_requests = [
        {
            "leave_id": leave.leave_id,
            "student_id": leave.student_id,
            "attendance_before": leave.attendance_before,
            "projected_attendance": leave.projected_attendance,
            "status": leave.status,
        }
        for leave in leaves
        if (
            leave.projected_attendance is not None
            and leave.projected_attendance < 75
        )
    ]

    # Faculty notifications
    notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.user_id,
            Notification.is_read.is_(False),
        )
        .order_by(
            Notification.created_at.desc()
        )
        .limit(5)
        .all()
    )

    unread_notifications = [
        {
            "notification_id": notification.notification_id,
            "leave_id": notification.leave_id,
            "notification_type": notification.notification_type,
            "title": notification.title,
            "message": notification.message,
            "created_at": notification.created_at,
        }
        for notification in notifications
    ]

    return {
        "faculty": {
            "user_id": current_user.user_id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "department_id": current_user.department_id,
        },
        "leave_summary": {
            "total": total_leaves,
            "pending": pending_leaves,
            "approved": approved_leaves,
            "rejected": rejected_leaves,
            "cancelled": cancelled_leaves,
        },
        "recent_requests": recent_requests,
        "attendance_risk_requests": risk_requests,
        "unread_notifications": unread_notifications,
    }