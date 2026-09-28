from datetime import datetime

from pydantic import BaseModel


class AIAnalysisResponse(BaseModel):
    analysis_id: int
    leave_id: int
    reason_category: str
    urgency_score: float
    risk_score: float
    attendance_risk: float
    policy_compliance: float
    recommendation: str
    confidence: float
    explanation: str
    created_at: datetime

    model_config = {"from_attributes": True}