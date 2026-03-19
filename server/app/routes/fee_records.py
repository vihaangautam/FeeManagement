from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from datetime import datetime
from typing import Optional

from app.database import get_database
from app.models import FeeRecordCreate, FeeRecordResponse

router = APIRouter(prefix="/api/fees", tags=["fees"])


async def fee_doc_to_response(doc: dict) -> dict:
    db = get_database()
    student_name = ""
    batch_name = ""
    if doc.get("student_id"):
        try:
            student = await db.students.find_one({"_id": ObjectId(doc["student_id"])})
            if student:
                student_name = student["name"]
                if student.get("batch_id"):
                    try:
                        batch = await db.batches.find_one({"_id": ObjectId(student["batch_id"])})
                        if batch:
                            batch_name = batch["name"]
                    except Exception:
                        pass
        except Exception:
            pass

    date_paid = doc.get("date_paid", datetime.utcnow())
    if isinstance(date_paid, str):
        date_paid = datetime.fromisoformat(date_paid).date()
    elif isinstance(date_paid, datetime):
        date_paid = date_paid.date()

    return {
        "id": str(doc["_id"]),
        "student_id": doc.get("student_id", ""),
        "student_name": student_name,
        "batch_name": batch_name,
        "amount_paid": doc.get("amount_paid", 0),
        "date_paid": date_paid,
        "fee_month": doc.get("fee_month", 1),
        "fee_year": doc.get("fee_year", 2026),
        "note": doc.get("note", ""),
        "created_at": doc.get("created_at", datetime.utcnow()),
    }


@router.get("/")
async def list_fee_records(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2100),
):
    db = get_database()
    query = {}
    if month is not None:
        query["fee_month"] = month
    if year is not None:
        query["fee_year"] = year
    records = await db.fee_records.find(query).sort("created_at", -1).to_list(1000)
    result = []
    for r in records:
        result.append(await fee_doc_to_response(r))
    return result


@router.get("/status")
async def get_fee_status(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020, le=2100),
):
    """Returns per-student fee status for a given month: paid, pending, partial."""
    db = get_database()
    students = await db.students.find().sort("name", 1).to_list(500)
    result = []
    for student in students:
        sid = str(student["_id"])
        # Get batch name
        batch_name = ""
        if student.get("batch_id"):
            try:
                batch = await db.batches.find_one({"_id": ObjectId(student["batch_id"])})
                if batch:
                    batch_name = batch["name"]
            except Exception:
                pass
        # Sum payments for this month
        payments = await db.fee_records.find({
            "student_id": sid,
            "fee_month": month,
            "fee_year": year,
        }).to_list(50)
        total_paid = sum(p.get("amount_paid", 0) for p in payments)
        expected = student.get("monthly_fee", 0)
        if expected <= 0:
            status = "no_fee"
        elif total_paid >= expected:
            status = "paid"
        elif total_paid > 0:
            status = "partial"
        else:
            status = "pending"
        result.append({
            "student_id": sid,
            "student_name": student["name"],
            "batch_id": student.get("batch_id", ""),
            "batch_name": batch_name,
            "monthly_fee": expected,
            "total_paid": total_paid,
            "status": status,
            "payments": [
                {
                    "id": str(p["_id"]),
                    "amount_paid": p["amount_paid"],
                    "date_paid": p["date_paid"].isoformat() if isinstance(p["date_paid"], (datetime,)) else str(p["date_paid"]),
                    "note": p.get("note", ""),
                }
                for p in payments
            ],
        })
    return result


@router.get("/student/{student_id}")
async def get_student_fees(student_id: str):
    db = get_database()
    records = await db.fee_records.find({"student_id": student_id}).sort(
        [("fee_year", -1), ("fee_month", -1)]
    ).to_list(200)
    result = []
    for r in records:
        result.append(await fee_doc_to_response(r))
    return result


@router.get("/export")
async def export_fees(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020, le=2100),
):
    """Returns structured data for Excel export of a given month."""
    db = get_database()
    students = await db.students.find().sort("name", 1).to_list(500)
    rows = []
    for student in students:
        sid = str(student["_id"])
        batch_name = ""
        if student.get("batch_id"):
            try:
                batch = await db.batches.find_one({"_id": ObjectId(student["batch_id"])})
                if batch:
                    batch_name = batch["name"]
            except Exception:
                pass
        payments = await db.fee_records.find({
            "student_id": sid,
            "fee_month": month,
            "fee_year": year,
        }).to_list(50)
        total_paid = sum(p.get("amount_paid", 0) for p in payments)
        expected = student.get("monthly_fee", 0)
        payment_dates = ", ".join(
            p["date_paid"].strftime("%d/%m/%Y") if isinstance(p["date_paid"], datetime) else str(p["date_paid"])
            for p in payments
        )
        rows.append({
            "Student Name": student["name"],
            "Batch": batch_name,
            "Phone": student.get("phone", ""),
            "Monthly Fee (₹)": expected,
            "Paid (₹)": total_paid,
            "Pending (₹)": max(0, expected - total_paid),
            "Status": "Paid" if total_paid >= expected else ("Partial" if total_paid > 0 else "Pending"),
            "Payment Date(s)": payment_dates,
        })
    return {"month": month, "year": year, "data": rows}


@router.post("/", status_code=201)
async def create_fee_record(data: FeeRecordCreate):
    db = get_database()
    # Verify student exists
    try:
        student = await db.students.find_one({"_id": ObjectId(data.student_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID")
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    doc = {
        "student_id": data.student_id,
        "amount_paid": data.amount_paid,
        "date_paid": datetime.combine(data.date_paid, datetime.min.time()),
        "fee_month": data.fee_month,
        "fee_year": data.fee_year,
        "note": data.note,
        "created_at": datetime.utcnow(),
    }
    result = await db.fee_records.insert_one(doc)
    doc["_id"] = result.inserted_id
    return await fee_doc_to_response(doc)


@router.delete("/{fee_id}")
async def delete_fee_record(fee_id: str):
    db = get_database()
    try:
        result = await db.fee_records.delete_one({"_id": ObjectId(fee_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid fee record ID")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Fee record not found")
    return {"message": "Fee record deleted successfully"}
