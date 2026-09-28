from datetime import date, datetime

from pydantic import BaseModel, Field


class LeaveCreate(BaseModel):
    leave_type_id: int
    start_date: date
    end_date: date
    reason: str = Field(min_length=10, max_length=2000)

class LeaveReject(BaseModel):
    reason: str = Field(
        min_length=5,
        max_length=1000
    )
class LeaveResponse(BaseModel):
    leave_id: int
    student_id: int
    leave_type_id: int
    start_date: date
    end_date: date
    number_of_days: int
    reason: str
    status: str
    attendance_before: float | None
    projected_attendance: float | None
    submitted_at: datetime

    model_config = {
        "from_attributes": True
    }

class MyLeaveResponse(BaseModel):
    leave_id: int
    leave_type_id: int
    leave_type_name: str
    start_date: date
    end_date: date
    number_of_days: int
    reason: str
    status: str
    rejection_reason: str | None
    attendance_before: float | None
    projected_attendance: float | None
    submitted_at: datetime