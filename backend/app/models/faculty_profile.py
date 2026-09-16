from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class FacultyProfile(Base):
    __tablename__ = "faculty_profiles"

    faculty_id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id"),
        unique=True,
        nullable=False
    )

    employee_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False
    )

    designation: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    specialization: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    office_location: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    user = relationship(
        "User",
        back_populates="faculty_profile"
    )