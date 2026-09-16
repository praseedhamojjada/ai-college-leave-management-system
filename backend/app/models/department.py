from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class Department(Base):
    __tablename__ = "departments"

    department_id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    department_code: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False
    )

    department_name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    hod_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    users = relationship(
        "User",
        back_populates="department"
    )