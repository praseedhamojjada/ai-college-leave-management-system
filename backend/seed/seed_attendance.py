from datetime import date, timedelta

from backend.app.database import SessionLocal
from backend.app.models import AttendanceRecord, StudentProfile


SUBJECTS = [
    ("CS401", "Data Mining"),
    ("CS402", "Machine Learning"),
    ("CS403", "Computer Networks"),
    ("CS404", "Cloud Computing"),
    ("CS405", "Software Project Management"),
    ("CS406", "Cryptography and Network Security"),
]


def calculate_percentage(attended, held):
    return round((attended / held) * 100, 2)


def seed_attendance(db):
    print("Creating attendance records...")

    students = db.query(StudentProfile).order_by(
        StudentProfile.student_id
    ).all()

    if not students:
        raise ValueError("No student profiles found.")

    records = []

    # Different attendance patterns for realistic AI analysis
    attendance_patterns = {
        0: [  # Student 1 - healthy attendance
            (46, 50),
            (44, 50),
            (43, 50),
            (45, 50),
            (42, 50),
            (47, 50),
        ],
        1: [  # Student 2 - borderline attendance
            (40, 50),
            (38, 50),
            (37, 50),
            (39, 50),
            (36, 50),
            (41, 50),
        ],
        2: [  # Student 3 - high attendance
            (48, 50),
            (47, 50),
            (46, 50),
            (49, 50),
            (45, 50),
            (48, 50),
        ],
    }

    start_date = date(2026, 7, 1)

    for student_index, student in enumerate(students):
        pattern = attendance_patterns.get(
            student_index,
            [(40, 50)] * len(SUBJECTS)
        )

        for subject_index, (subject_code, subject_name) in enumerate(SUBJECTS):

            attended, held = pattern[subject_index]

            records.append(
                AttendanceRecord(
                    student_id=student.student_id,
                    subject_code=subject_code,
                    subject_name=subject_name,
                    attendance_date=start_date + timedelta(
                        days=subject_index
                    ),
                    academic_year="2026-2027",
                    semester=7,
                    classes_held=held,
                    classes_attended=attended,
                    attendance_percentage=calculate_percentage(
                        attended,
                        held
                    ),
                    record_status="ACTIVE",
                )
            )

    db.add_all(records)
    db.flush()

    return records


def main():
    db = SessionLocal()

    try:
        print("Starting Phase 2B seed...")

        records = seed_attendance(db)

        db.commit()

        print("\nPhase 2B completed successfully!")
        print(f"Created {len(records)} attendance records.")

    except Exception as error:
        db.rollback()
        print(f"\nAttendance seed failed: {error}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()