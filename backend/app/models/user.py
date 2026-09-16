from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    full_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    registration_number: Mapped[str | None] = mapped_column(
        String(50),
        unique=True,
        nullable=True
    )

    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.department_id"),
        nullable=True
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    last_login: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    department = relationship(
        "Department",
        back_populates="users"
    )

    student_profile = relationship(
        "StudentProfile",
        back_populates="user",
        uselist=False
    )

    faculty_profile = relationship(
        "FacultyProfile",
        back_populates="user",
        uselist=False
    )