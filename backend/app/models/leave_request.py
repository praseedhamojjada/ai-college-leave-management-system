from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    leave_id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    student_id: Mapped[int] = mapped_column(
        ForeignKey("student_profiles.student_id"),
        nullable=False
    )

    leave_type_id: Mapped[int] = mapped_column(
        ForeignKey("leave_types.leave_type_id"),
        nullable=False
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    number_of_days: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    reason: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    attachment_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="PENDING",
        nullable=False
    )

    reviewed_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.user_id"),
        nullable=True
    )

    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    rejection_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    attendance_before: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    projected_attendance: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    student = relationship(
        "StudentProfile",
        back_populates="leave_requests"
    )

    leave_type = relationship(
        "LeaveType",
        back_populates="leave_requests"
    )

    reviewer = relationship(
        "User",
        foreign_keys=[reviewed_by]
    )
    approval_history = relationship(
        "ApprovalHistory",
        back_populates="leave_request"
    )
    ai_analyses = relationship(
        "AIAnalysis",
        back_populates="leave_request"
    )