from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class LeaveType(Base):
    __tablename__ = "leave_types"

    leave_type_id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    type_name: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    max_days_per_request: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    requires_document: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    leave_requests = relationship(
        "LeaveRequest",
        back_populates="leave_type"
    )