from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.roles import require_role
from backend.app.database import get_db
from backend.app.models import AttendanceRecord, StudentProfile, User


router = APIRouter(
    prefix="/api/attendance",
    tags=["Attendance"],
)


# ============================================================
# GET MY ATTENDANCE
# ============================================================

@router.get("/my")
def get_my_attendance(
    current_user: User = Depends(require_role("STUDENT")),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Find logged-in student's profile
    # --------------------------------------------------------

    student = (
        db.query(StudentProfile)
        .filter(
            StudentProfile.user_id == current_user.user_id
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found",
        )

    # --------------------------------------------------------
    # Get active attendance records
    # --------------------------------------------------------

    records = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.student_id == student.student_id,
            AttendanceRecord.record_status == "ACTIVE",
        )
        .order_by(
            AttendanceRecord.subject_name.asc(),
            AttendanceRecord.attendance_date.desc(),
        )
        .all()
    )

    # --------------------------------------------------------
    # No attendance data
    # --------------------------------------------------------

    if not records:
        return {
            "student": {
                "student_id": student.student_id,
                "name": current_user.full_name,
                "email": current_user.email,
                "year": student.year,
                "semester": student.semester,
                "section": student.section,
            },
            "overall": {
                "classes_held": 0,
                "classes_attended": 0,
                "classes_absent": 0,
                "attendance_percentage": 0.0,
                "status": "NO DATA",
            },
            "subjects": [],
            "subjects_needing_attention": [],
        }

    # --------------------------------------------------------
    # Calculate overall attendance
    #
    # Weighted calculation:
    #
    # total classes attended
    # ---------------------- × 100
    # total classes held
    # --------------------------------------------------------

    total_classes_held = sum(
        record.classes_held
        for record in records
    )

    total_classes_attended = sum(
        record.classes_attended
        for record in records
    )

    total_classes_absent = (
        total_classes_held
        - total_classes_attended
    )

    if total_classes_held > 0:
        overall_percentage = round(
            (
                total_classes_attended
                / total_classes_held
            )
            * 100,
            2,
        )
    else:
        overall_percentage = 0.0

    # --------------------------------------------------------
    # Overall attendance status
    # --------------------------------------------------------

    if overall_percentage >= 85:
        overall_status = "GOOD"
    elif overall_percentage >= 75:
        overall_status = "WATCH"
    else:
        overall_status = "AT RISK"

    # --------------------------------------------------------
    # Group attendance by subject
    # --------------------------------------------------------

    subject_map = {}

    for record in records:

        key = record.subject_code

        if key not in subject_map:
            subject_map[key] = {
                "subject_code": record.subject_code,
                "subject_name": record.subject_name,
                "academic_year": record.academic_year,
                "semester": record.semester,
                "classes_held": 0,
                "classes_attended": 0,
                "classes_absent": 0,
                "attendance_percentage": 0.0,
                "records_count": 0,
                "latest_record_date": None,
            }

        subject_map[key]["classes_held"] += (
            record.classes_held
        )

        subject_map[key]["classes_attended"] += (
            record.classes_attended
        )

        subject_map[key]["records_count"] += 1

        if (
            subject_map[key]["latest_record_date"] is None
            or record.attendance_date
            > subject_map[key]["latest_record_date"]
        ):
            subject_map[key]["latest_record_date"] = (
                record.attendance_date
            )

    # --------------------------------------------------------
    # Calculate subject percentages
    # --------------------------------------------------------

    subjects = []

    for subject in subject_map.values():

        subject["classes_absent"] = (
            subject["classes_held"]
            - subject["classes_attended"]
        )

        if subject["classes_held"] > 0:
            subject["attendance_percentage"] = round(
                (
                    subject["classes_attended"]
                    / subject["classes_held"]
                )
                * 100,
                2,
            )

        percentage = subject["attendance_percentage"]

        if percentage >= 85:
            subject["status"] = "GOOD"
        elif percentage >= 75:
            subject["status"] = "WATCH"
        else:
            subject["status"] = "AT RISK"

        subjects.append(subject)

    # Lowest attendance first
    subjects.sort(
        key=lambda item: item["attendance_percentage"]
    )

    # --------------------------------------------------------
    # Subjects needing attention
    # --------------------------------------------------------

    subjects_needing_attention = [
        {
            "subject_code": subject["subject_code"],
            "subject_name": subject["subject_name"],
            "attendance_percentage": (
                subject["attendance_percentage"]
            ),
            "status": subject["status"],
        }
        for subject in subjects
        if subject["attendance_percentage"] < 75
    ]

    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    return {
        "student": {
            "student_id": student.student_id,
            "name": current_user.full_name,
            "email": current_user.email,
            "year": student.year,
            "semester": student.semester,
            "section": student.section,
        },
        "overall": {
            "classes_held": total_classes_held,
            "classes_attended": total_classes_attended,
            "classes_absent": total_classes_absent,
            "attendance_percentage": overall_percentage,
            "status": overall_status,
        },
        "subjects": subjects,
        "subjects_needing_attention": (
            subjects_needing_attention
        ),
    }