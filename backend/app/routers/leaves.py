from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.roles import require_role
from backend.app.database import get_db
from backend.app.models import (
    ApprovalHistory,
    AuditLog,
    LeaveRequest,
    LeaveType,
    Notification,
    StudentProfile,
    User,
)
from backend.app.schemas.leave import (
    LeaveCreate,
    LeaveReject,
    LeaveResponse,
    MyLeaveResponse,
)


router = APIRouter(
    prefix="/api/leaves",
    tags=["Leaves"],
)


# ============================================================
# CREATE LEAVE
# ============================================================

@router.post(
    "",
    response_model=LeaveResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_leave(
    leave_data: LeaveCreate,
    current_user: User = Depends(require_role("STUDENT")),
    db: Session = Depends(get_db),
):
    # 1. Find the student's profile
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

    # 2. Validate the leave type
    leave_type = (
        db.query(LeaveType)
        .filter(
            LeaveType.leave_type_id == leave_data.leave_type_id,
            LeaveType.is_active.is_(True),
        )
        .first()
    )

    if not leave_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave type not found or inactive",
        )

    # 3. Validate dates
    if leave_data.end_date < leave_data.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date cannot be before start date",
        )

    # 4. Calculate number of days
    number_of_days = (
        leave_data.end_date - leave_data.start_date
    ).days + 1

    # 5. Check maximum allowed days
    if (
        leave_type.max_days_per_request is not None
        and number_of_days > leave_type.max_days_per_request
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"{leave_type.type_name} allows a maximum of "
                f"{leave_type.max_days_per_request} days per request"
            ),
        )

    # 6. Prevent overlapping pending/approved leave
    overlapping_leave = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.student_id == student.student_id,
            LeaveRequest.status.in_(["PENDING", "APPROVED"]),
            LeaveRequest.start_date <= leave_data.end_date,
            LeaveRequest.end_date >= leave_data.start_date,
        )
        .first()
    )

    if overlapping_leave:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "You already have a pending or approved leave "
                "during these dates"
            ),
        )

    # 7. Get current attendance
    attendance_before = student.total_attendance

    # 8. Calculate projected attendance
    # Temporary calculation.
    # We will improve this later using attendance_records.
    projected_attendance = max(
        0.0,
        attendance_before - (number_of_days * 1.0),
    )

    # 9. Create leave request
    new_leave = LeaveRequest(
        student_id=student.student_id,
        leave_type_id=leave_data.leave_type_id,
        start_date=leave_data.start_date,
        end_date=leave_data.end_date,
        number_of_days=number_of_days,
        reason=leave_data.reason,
        status="PENDING",
        attendance_before=attendance_before,
        projected_attendance=projected_attendance,
    )

    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)

    return new_leave


# ============================================================
# GET MY LEAVES
# ============================================================

@router.get(
    "/my",
    response_model=list[MyLeaveResponse],
)
def get_my_leaves(
    current_user: User = Depends(require_role("STUDENT")),
    db: Session = Depends(get_db),
):
    # Find the student's profile
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

    # Get all leaves belonging to this student
    leaves = (
        db.query(LeaveRequest, LeaveType)
        .join(
            LeaveType,
            LeaveRequest.leave_type_id == LeaveType.leave_type_id,
        )
        .filter(
            LeaveRequest.student_id == student.student_id
        )
        .order_by(
            LeaveRequest.submitted_at.desc()
        )
        .all()
    )

    return [
        MyLeaveResponse(
            leave_id=leave.leave_id,
            leave_type_id=leave.leave_type_id,
            leave_type_name=leave_type.type_name,
            start_date=leave.start_date,
            end_date=leave.end_date,
            number_of_days=leave.number_of_days,
            reason=leave.reason,
            status=leave.status,
            rejection_reason=leave.rejection_reason,
            attendance_before=leave.attendance_before,
            projected_attendance=leave.projected_attendance,
            submitted_at=leave.submitted_at,
        )
        for leave, leave_type in leaves
    ]


# ============================================================
# GET PENDING LEAVES
# IMPORTANT: THIS MUST COME BEFORE /{leave_id}
# ============================================================

@router.get(
    "/pending",
)
def get_pending_leaves(
    current_user: User = Depends(
        require_role("FACULTY", "HOD", "ADMIN")
    ),
    db: Session = Depends(get_db),
):
    pending_leaves = (
        db.query(
            LeaveRequest,
            LeaveType,
            StudentProfile,
            User,
        )
        .join(
            LeaveType,
            LeaveRequest.leave_type_id == LeaveType.leave_type_id,
        )
        .join(
            StudentProfile,
            LeaveRequest.student_id == StudentProfile.student_id,
        )
        .join(
            User,
            StudentProfile.user_id == User.user_id,
        )
        .filter(
            LeaveRequest.status == "PENDING"
        )
        .order_by(
            LeaveRequest.submitted_at.asc()
        )
        .all()
    )

    return [
        {
            "leave_id": leave.leave_id,
            "student_id": student.student_id,
            "student_name": student_user.full_name,
            "student_email": student_user.email,
            "leave_type": leave_type.type_name,
            "start_date": leave.start_date,
            "end_date": leave.end_date,
            "number_of_days": leave.number_of_days,
            "reason": leave.reason,
            "status": leave.status,
            "attendance_before": leave.attendance_before,
            "projected_attendance": leave.projected_attendance,
            "submitted_at": leave.submitted_at,
        }
        for leave, leave_type, student, student_user
        in pending_leaves
    ]


# APPROVE LEAVE
@router.put(
    "/{leave_id}/approve",
)
def approve_leave(
    leave_id: int,
    current_user: User = Depends(
        require_role("FACULTY", "HOD", "ADMIN")
    ),
    db: Session = Depends(get_db),
):
    leave = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.leave_id == leave_id)
        .first()
    )

    if not leave:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found",
        )

    if leave.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Only pending leave requests can be approved. "
                f"Current status: {leave.status}"
            ),
        )

    # Update leave request
    leave.status = "APPROVED"
    leave.reviewed_by = current_user.user_id
    leave.reviewed_at = datetime.utcnow()

    # Approval history
    approval = ApprovalHistory(
        leave_id=leave.leave_id,
        reviewer_id=current_user.user_id,
        reviewer_role=current_user.role,
        action="APPROVED",
        comments="Leave request approved.",
    )

    db.add(approval)

    # Find student
    student = (
        db.query(StudentProfile)
        .filter(
            StudentProfile.student_id == leave.student_id
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found",
        )

    # Notification
    notification = Notification(
        user_id=student.user_id,
        leave_id=leave.leave_id,
        notification_type="LEAVE_APPROVED",
        title="Leave Request Approved",
        message=(
            f"Your leave request from "
            f"{leave.start_date} to {leave.end_date} "
            f"has been approved by {current_user.full_name}."
        ),
    )

    db.add(notification)

    # Audit log
    audit = AuditLog(
        user_id=current_user.user_id,
        action="APPROVE_LEAVE",
        entity_type="LEAVE_REQUEST",
        entity_id=leave.leave_id,
        old_value="PENDING",
        new_value="APPROVED",
    )

    db.add(audit)

    db.commit()
    db.refresh(leave)

    return {
        "message": "Leave request approved successfully",
        "leave_id": leave.leave_id,
        "status": leave.status,
        "reviewed_by": current_user.full_name,
        "reviewed_at": leave.reviewed_at,
    }

# REJECT LEAVE
@router.put(
    "/{leave_id}/reject",
)
def reject_leave(
    leave_id: int,
    leave_data: LeaveReject,
    current_user: User = Depends(
        require_role("FACULTY", "HOD", "ADMIN")
    ),
    db: Session = Depends(get_db),
):
    leave = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.leave_id == leave_id)
        .first()
    )

    if not leave:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found",
        )

    if leave.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Only pending leave requests can be rejected. "
                f"Current status: {leave.status}"
            ),
        )

    # Update leave request
    leave.status = "REJECTED"
    leave.reviewed_by = current_user.user_id
    leave.reviewed_at = datetime.utcnow()
    leave.rejection_reason = leave_data.reason

    # Approval history
    approval = ApprovalHistory(
        leave_id=leave.leave_id,
        reviewer_id=current_user.user_id,
        reviewer_role=current_user.role,
        action="REJECTED",
        comments=leave_data.reason,
    )

    db.add(approval)

    # Find student
    student = (
        db.query(StudentProfile)
        .filter(
            StudentProfile.student_id == leave.student_id
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found",
        )

    # Notification
    notification = Notification(
        user_id=student.user_id,
        leave_id=leave.leave_id,
        notification_type="LEAVE_REJECTED",
        title="Leave Request Rejected",
        message=(
            f"Your leave request from "
            f"{leave.start_date} to {leave.end_date} "
            f"has been rejected by {current_user.full_name}. "
            f"Reason: {leave_data.reason}"
        ),
    )

    db.add(notification)

    # Audit log
    audit = AuditLog(
        user_id=current_user.user_id,
        action="REJECT_LEAVE",
        entity_type="LEAVE_REQUEST",
        entity_id=leave.leave_id,
        old_value="PENDING",
        new_value="REJECTED",
    )

    db.add(audit)

    db.commit()
    db.refresh(leave)

    return {
        "message": "Leave request rejected successfully",
        "leave_id": leave.leave_id,
        "status": leave.status,
        "reviewed_by": current_user.full_name,
        "reviewed_at": leave.reviewed_at,
        "rejection_reason": leave.rejection_reason,
    }
# ============================================================
# GET SINGLE LEAVE
# IMPORTANT: KEEP THIS AFTER /pending
# ============================================================

@router.get(
    "/{leave_id}",
    response_model=MyLeaveResponse,
)
def get_my_leave(
    leave_id: int,
    current_user: User = Depends(require_role("STUDENT")),
    db: Session = Depends(get_db),
):
    # Find the student's profile
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

    # Find the requested leave belonging to this student
    result = (
        db.query(LeaveRequest, LeaveType)
        .join(
            LeaveType,
            LeaveRequest.leave_type_id == LeaveType.leave_type_id,
        )
        .filter(
            LeaveRequest.leave_id == leave_id,
            LeaveRequest.student_id == student.student_id,
        )
        .first()
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found",
        )

    leave, leave_type = result

    return MyLeaveResponse(
        leave_id=leave.leave_id,
        leave_type_id=leave.leave_type_id,
        leave_type_name=leave_type.type_name,
        start_date=leave.start_date,
        end_date=leave.end_date,
        number_of_days=leave.number_of_days,
        reason=leave.reason,
        status=leave.status,
        rejection_reason=leave.rejection_reason,
        attendance_before=leave.attendance_before,
        projected_attendance=leave.projected_attendance,
        submitted_at=leave.submitted_at,
    )


# ============================================================
# CANCEL LEAVE
# ============================================================

@router.delete(
    "/{leave_id}",
)
def cancel_leave(
    leave_id: int,
    current_user: User = Depends(require_role("STUDENT")),
    db: Session = Depends(get_db),
):
    # Find the student's profile
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

    # Find the student's leave
    leave = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.leave_id == leave_id,
            LeaveRequest.student_id == student.student_id,
        )
        .first()
    )

    if not leave:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found",
        )

    # Only pending leaves can be cancelled
    if leave.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Only pending leave requests can be cancelled. "
                f"Current status: {leave.status}"
            ),
        )

    # Cancel the leave
    leave.status = "CANCELLED"

    db.commit()
    db.refresh(leave)

    return {
        "message": "Leave request cancelled successfully",
        "leave_id": leave.leave_id,
        "status": leave.status,
    }