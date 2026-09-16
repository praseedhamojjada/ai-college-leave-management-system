from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class ApprovalHistory(Base):
    __tablename__ = "approval_history"

    approval_id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    leave_id: Mapped[int] = mapped_column(
        ForeignKey("leave_requests.leave_id"),
        nullable=False
    )

    reviewer_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id"),
        nullable=False
    )

    reviewer_role: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    action: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    comments: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    action_timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    leave_request = relationship(
        "LeaveRequest",
        back_populates="approval_history"
    )

    reviewer = relationship(
        "User"
    )