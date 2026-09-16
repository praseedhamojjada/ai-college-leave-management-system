from datetime import date

from sqlalchemy import Date, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    student_id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id"),
        unique=True,
        nullable=False
    )

    date_of_birth: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )

    gender: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    year: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    semester: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    section: Mapped[str | None] = mapped_column(
        String(10),
        nullable=True
    )

    batch: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    mentor_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.user_id"),
        nullable=True
    )

    current_cgpa: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    total_attendance: Mapped[float] = mapped_column(
        Float,
        default=0.0
    )

    emergency_contact_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    emergency_contact_phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    user = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="student_profile"
    )

    mentor = relationship(
        "User",
        foreign_keys=[mentor_id]
    )
    leave_requests = relationship(
        "LeaveRequest",
        back_populates="student"
    )
    attendance_records = relationship(
        "AttendanceRecord",
        back_populates="student"
    )