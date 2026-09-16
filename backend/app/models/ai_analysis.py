from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class AIAnalysis(Base):
    __tablename__ = "ai_analysis"

    analysis_id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    leave_id: Mapped[int] = mapped_column(
        ForeignKey("leave_requests.leave_id"),
        nullable=False
    )

    model_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    reason_category: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    urgency_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    risk_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    attendance_risk: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    policy_compliance: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    recommendation: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    confidence: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    explanation: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    leave_request = relationship(
        "LeaveRequest",
        back_populates="ai_analyses"
    )