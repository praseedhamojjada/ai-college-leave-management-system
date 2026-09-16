from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    attendance_id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    student_id: Mapped[int] = mapped_column(
        ForeignKey("student_profiles.student_id"),
        nullable=False
    )

    subject_code: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    subject_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    attendance_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    academic_year: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    semester: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    classes_held: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    classes_attended: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    attendance_percentage: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    record_status: Mapped[str] = mapped_column(
        String(20),
        default="ACTIVE",
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    student = relationship(
        "StudentProfile",
        back_populates="attendance_records"
    )