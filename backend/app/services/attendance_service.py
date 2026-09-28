from sqlalchemy.orm import Session

from backend.app.models import AttendanceRecord


def get_student_attendance_summary(
    db: Session,
    student_id: int,
):
    records = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.student_id == student_id
        )
        .all()
    )

    if not records:
        return {
            "classes_held": 0,
            "classes_attended": 0,
            "classes_absent": 0,
            "attendance_percentage": 0.0,
        }

    classes_held = sum(
        int(record.classes_held or 0)
        for record in records
    )

    classes_attended = sum(
        int(record.classes_attended or 0)
        for record in records
    )

    classes_absent = max(
        0,
        classes_held - classes_attended,
    )

    attendance_percentage = (
        (classes_attended / classes_held) * 100
        if classes_held > 0
        else 0.0
    )

    return {
        "classes_held": classes_held,
        "classes_attended": classes_attended,
        "classes_absent": classes_absent,
        "attendance_percentage": round(
            attendance_percentage,
            2,
        ),
    }


def calculate_projected_attendance(
    classes_held: int,
    classes_attended: int,
    leave_days: int,
):
    """
    Estimate attendance after taking leave.

    The requested leave days are treated as additional
    classes that would be missed.
    """

    if classes_held <= 0:
        return 0.0

    projected_classes_held = classes_held + max(
        leave_days,
        0,
    )

    projected_classes_attended = classes_attended

    projected_percentage = (
        projected_classes_attended
        / projected_classes_held
    ) * 100

    return round(
        max(0.0, min(100.0, projected_percentage)),
        2,
    )