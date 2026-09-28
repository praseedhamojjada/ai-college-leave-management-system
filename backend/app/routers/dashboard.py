from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.roles import require_role
from backend.app.database import get_db
from backend.app.models import (
    AIAnalysis,
    AuditLog,
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
# MANAGEMENT DASHBOARD
@router.get("/management")
def get_management_dashboard(
    current_user: User = Depends(
        require_role("HOD", "ADMIN")
    ),
    db: Session = Depends(get_db),
):
    # ---------------------------------------------------------
    # USER STATISTICS
    # ---------------------------------------------------------

    total_students = (
        db.query(User)
        .filter(User.role == "STUDENT")
        .count()
    )

    total_faculty = (
        db.query(User)
        .filter(User.role == "FACULTY")
        .count()
    )

    total_users = db.query(User).count()

    # ---------------------------------------------------------
    # LEAVE STATISTICS
    # ---------------------------------------------------------

    total_leaves = db.query(LeaveRequest).count()

    pending_leaves = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.status == "PENDING")
        .count()
    )

    approved_leaves = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.status == "APPROVED")
        .count()
    )

    rejected_leaves = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.status == "REJECTED")
        .count()
    )

    cancelled_leaves = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.status == "CANCELLED")
        .count()
    )

    # ---------------------------------------------------------
    # ATTENDANCE OVERVIEW
    # ---------------------------------------------------------

    students = (
        db.query(StudentProfile)
        .all()
    )

    if students:
        average_attendance = round(
            sum(
                student.total_attendance
                for student in students
            ) / len(students),
            2,
        )
    else:
        average_attendance = 0.0

    low_attendance_students = [
        {
            "student_id": student.student_id,
            "user_id": student.user_id,
            "attendance": student.total_attendance,
        }
        for student in students
        if student.total_attendance < 75
    ]

    # ---------------------------------------------------------
    # DEPARTMENT-WISE LEAVE STATISTICS
    # ---------------------------------------------------------

    department_stats = {}

    leave_records = (
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
        .all()
    )

    for leave, student, student_user in leave_records:
        department_id = student_user.department_id

        if department_id not in department_stats:
            department_stats[department_id] = {
                "department_id": department_id,
                "total_leaves": 0,
                "pending": 0,
                "approved": 0,
                "rejected": 0,
                "cancelled": 0,
            }

        stats = department_stats[department_id]

        stats["total_leaves"] += 1

        if leave.status == "PENDING":
            stats["pending"] += 1

        elif leave.status == "APPROVED":
            stats["approved"] += 1

        elif leave.status == "REJECTED":
            stats["rejected"] += 1

        elif leave.status == "CANCELLED":
            stats["cancelled"] += 1

    # ---------------------------------------------------------
    # AI ANALYSIS STATISTICS
    # ---------------------------------------------------------

    total_ai_analyses = db.query(AIAnalysis).count()

    review_required = (
        db.query(AIAnalysis)
        .filter(
            AIAnalysis.recommendation == "REVIEW"
        )
        .count()
    )

    ai_approve_recommendations = (
        db.query(AIAnalysis)
        .filter(
            AIAnalysis.recommendation == "APPROVE"
        )
        .count()
    )

    ai_reject_recommendations = (
        db.query(AIAnalysis)
        .filter(
            AIAnalysis.recommendation == "REJECT"
        )
        .count()
    )

    # ---------------------------------------------------------
    # RECENT AUDIT ACTIVITY
    # ---------------------------------------------------------

    recent_audits = (
        db.query(AuditLog)
        .order_by(
            AuditLog.created_at.desc()
        )
        .limit(10)
        .all()
    )

    recent_activity = [
        {
            "audit_id": audit.audit_id,
            "user_id": audit.user_id,
            "action": audit.action,
            "entity_type": audit.entity_type,
            "entity_id": audit.entity_id,
            "old_value": audit.old_value,
            "new_value": audit.new_value,
            "created_at": audit.created_at,
        }
        for audit in recent_audits
    ]

    # ---------------------------------------------------------
    # FINAL RESPONSE
    # ---------------------------------------------------------

    return {
        "management": {
            "user_id": current_user.user_id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "role": current_user.role,
            "department_id": current_user.department_id,
        },

        "user_summary": {
            "total_users": total_users,
            "total_students": total_students,
            "total_faculty": total_faculty,
        },

        "leave_summary": {
            "total": total_leaves,
            "pending": pending_leaves,
            "approved": approved_leaves,
            "rejected": rejected_leaves,
            "cancelled": cancelled_leaves,
        },

        "attendance_summary": {
            "average_attendance": average_attendance,
            "low_attendance_students": low_attendance_students,
        },

        "department_statistics": list(
            department_stats.values()
        ),

        "ai_summary": {
            "total_analyses": total_ai_analyses,
            "review_required": review_required,
            "approve_recommendations": ai_approve_recommendations,
            "reject_recommendations": ai_reject_recommendations,
        },

        "recent_activity": recent_activity,
    }