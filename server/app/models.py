from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date


# ── Batch Models ──────────────────────────────────────────────

class BatchCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., pattern="^(coaching|home)$")
    location: str = Field("", max_length=200)
    timing: str = Field("", max_length=200)


class BatchUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[str] = Field(None, pattern="^(coaching|home)$")
    location: Optional[str] = Field(None, max_length=200)
    timing: Optional[str] = Field(None, max_length=200)


class BatchResponse(BaseModel):
    id: str
    name: str
    type: str
    location: str
    timing: str = ""
    student_count: int = 0
    created_at: datetime


# ── Student Models ────────────────────────────────────────────

class StudentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    batch_id: str
    phone: str = Field("", max_length=15)
    monthly_fee: float = Field(0, ge=0)


class StudentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    batch_id: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=15)
    monthly_fee: Optional[float] = Field(None, ge=0)


class StudentResponse(BaseModel):
    id: str
    name: str
    batch_id: str
    batch_name: str = ""
    phone: str
    monthly_fee: float
    joining_date: datetime
    created_at: datetime


# ── Fee Record Models ─────────────────────────────────────────

class FeeRecordCreate(BaseModel):
    student_id: str
    amount_paid: float = Field(..., gt=0)
    date_paid: date = Field(default_factory=date.today)
    fee_month: int = Field(..., ge=1, le=12)
    fee_year: int = Field(..., ge=2020, le=2100)
    note: str = ""


class FeeRecordResponse(BaseModel):
    id: str
    student_id: str
    student_name: str = ""
    batch_name: str = ""
    amount_paid: float
    date_paid: date
    fee_month: int
    fee_year: int
    note: str
    created_at: datetime


# ── Dashboard Models ──────────────────────────────────────────

class DashboardStats(BaseModel):
    total_students: int
    total_batches: int
    collected_this_month: float
    pending_this_month: float
    expected_this_month: float
    recent_payments: list[FeeRecordResponse]
