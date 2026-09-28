from datetime import date, datetime

from sqlalchemy import delete

from backend.app.database import SessionLocal
from backend.app.models import (
    AIAnalysis,
    ApprovalHistory,
    AttendanceRecord,
    AuditLog,
    Department,
    FacultyProfile,
    LeaveRequest,
    LeaveType,
    Notification,
    StudentProfile,
    User,
)


def clear_database(db):
    """Remove development seed data in dependency-safe order."""
    db.execute(delete(AuditLog))
    db.execute(delete(Notification))
    db.execute(delete(AIAnalysis))
    db.execute(delete(ApprovalHistory))
    db.execute(delete(AttendanceRecord))
    db.execute(delete(LeaveRequest))
    db.execute(delete(StudentProfile))
    db.execute(delete(FacultyProfile))
    db.execute(delete(User))
    db.execute(delete(LeaveType))
    db.execute(delete(Department))
    db.commit()


def seed_departments(db):
    departments = [
        Department(
            department_code="CSE",
            department_name="Computer Science and Engineering",
            description="Department of Computer Science and Engineering",
            hod_name="Dr. Rajesh Kumar",
        ),
        Department(
            department_code="ECE",
            department_name="Electronics and Communication Engineering",
            description="Department of Electronics and Communication Engineering",
            hod_name="Dr. Anitha Rao",
        ),
        Department(
            department_code="EEE",
            department_name="Electrical and Electronics Engineering",
            description="Department of Electrical and Electronics Engineering",
            hod_name="Dr. Suresh Reddy",
        ),
        Department(
            department_code="MECH",
            department_name="Mechanical Engineering",
            description="Department of Mechanical Engineering",
            hod_name="Dr. Vijay Sharma",
        ),
    ]

    db.add_all(departments)
    db.flush()

    return departments


def seed_users(db, departments):
    cse = departments[0]
    ece = departments[1]

    users = [
        # Students
        User(
            full_name="Priya Sharma",
            email="priya.student@campusleave.edu",
            password_hash="DEMO_HASH_PRiya",
            role="STUDENT",
            phone="9000000001",
            registration_number="CSE2022A001",
            department_id=cse.department_id,
        ),
        User(
            full_name="Arjun Reddy",
            email="arjun.student@campusleave.edu",
            password_hash="DEMO_HASH_Arjun",
            role="STUDENT",
            phone="9000000002",
            registration_number="CSE2022A002",
            department_id=cse.department_id,
        ),
        User(
            full_name="Sneha Rao",
            email="sneha.student@campusleave.edu",
            password_hash="DEMO_HASH_Sneha",
            role="STUDENT",
            phone="9000000003",
            registration_number="ECE2022A001",
            department_id=ece.department_id,
        ),

        # Faculty
        User(
            full_name="Dr. Meera Nair",
            email="meera.faculty@campusleave.edu",
            password_hash="DEMO_HASH_Meera",
            role="FACULTY",
            phone="9000000010",
            department_id=cse.department_id,
        ),
        User(
            full_name="Dr. Kiran Rao",
            email="kiran.faculty@campusleave.edu",
            password_hash="DEMO_HASH_Kiran",
            role="FACULTY",
            phone="9000000011",
            department_id=ece.department_id,
        ),

        # HOD
        User(
            full_name="Dr. Rajesh Kumar",
            email="rajesh.hod@campusleave.edu",
            password_hash="DEMO_HASH_Rajesh",
            role="HOD",
            phone="9000000020",
            department_id=cse.department_id,
        ),

        # Administrator
        User(
            full_name="Campus Administrator",
            email="admin@campusleave.edu",
            password_hash="DEMO_HASH_Admin",
            role="ADMIN",
            phone="9000000030",
        ),
    ]

    db.add_all(users)
    db.flush()

    return users


def seed_student_profiles(db, users):
    students = [user for user in users if user.role == "STUDENT"]
    faculty = [user for user in users if user.role == "FACULTY"]

    profiles = [
        StudentProfile(
            user_id=students[0].user_id,
            date_of_birth=date(2005, 4, 12),
            gender="Female",
            year=4,
            semester=7,
            section="A",
            batch="2022-2026",
            mentor_id=faculty[0].user_id,
            current_cgpa=8.42,
            total_attendance=84.5,
            emergency_contact_name="Anil Sharma",
            emergency_contact_phone="9111111111",
        ),
        StudentProfile(
            user_id=students[1].user_id,
            date_of_birth=date(2004, 11, 8),
            gender="Male",
            year=4,
            semester=7,
            section="A",
            batch="2022-2026",
            mentor_id=faculty[0].user_id,
            current_cgpa=7.86,
            total_attendance=78.2,
            emergency_contact_name="Ramesh Reddy",
            emergency_contact_phone="9111111112",
        ),
        StudentProfile(
            user_id=students[2].user_id,
            date_of_birth=date(2005, 1, 20),
            gender="Female",
            year=4,
            semester=7,
            section="B",
            batch="2022-2026",
            mentor_id=faculty[1].user_id,
            current_cgpa=8.91,
            total_attendance=91.4,
            emergency_contact_name="Srinivas Rao",
            emergency_contact_phone="9111111113",
        ),
    ]

    db.add_all(profiles)
    db.flush()

    return profiles


def seed_faculty_profiles(db, users):
    faculty = [user for user in users if user.role == "FACULTY"]
    hod = next(user for user in users if user.role == "HOD")

    profiles = [
        FacultyProfile(
            user_id=faculty[0].user_id,
            employee_id="FAC-CSE-001",
            designation="Assistant Professor",
            specialization="Artificial Intelligence and Machine Learning",
            office_location="CSE Block - Room 204",
        ),
        FacultyProfile(
            user_id=faculty[1].user_id,
            employee_id="FAC-ECE-001",
            designation="Associate Professor",
            specialization="Embedded Systems",
            office_location="ECE Block - Room 301",
        ),
        FacultyProfile(
            user_id=hod.user_id,
            employee_id="HOD-CSE-001",
            designation="Head of Department",
            specialization="Computer Science",
            office_location="CSE Block - HOD Office",
        ),
    ]

    db.add_all(profiles)
    db.flush()

    return profiles


def main():
    db = SessionLocal()

    try:
        print("Clearing existing development data...")
        clear_database(db)

        print("Creating departments...")
        departments = seed_departments(db)

        print("Creating users...")
        users = seed_users(db, departments)

        print("Creating student profiles...")
        seed_student_profiles(db, users)

        print("Creating faculty profiles...")
        seed_faculty_profiles(db, users)

        db.commit()

        print("\nFoundation data seeded successfully!")

    except Exception as error:
        db.rollback()
        print(f"\nSeed failed: {error}")
        raise

    finally:
        db.close()

if __name__ == "__main__":
    main()