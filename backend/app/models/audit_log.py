from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    audit_id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.user_id"),
        nullable=True
    )

    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    entity_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    entity_id: Mapped[int | None] = mapped_column(
        nullable=True
    )

    old_value: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    new_value: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    ip_address: Mapped[str | None] = mapped_column(
        String(45),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    user = relationship(
        "User"
    )