from fastapi import APIRouter
from bson import ObjectId
from datetime import datetime

from app.database import get_database

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
async def get_dashboard_stats():
    db = get_database()
    now = datetime.utcnow()
    current_month = now.month
    current_year = now.year

    total_students = await db.students.count_documents({})
    total_batches = await db.batches.count_documents({})

    # Calculate collected this month
    month_payments = await db.fee_records.find({
        "fee_month": current_month,
        "fee_year": current_year,
    }).to_list(5000)
    collected = sum(p.get("amount_paid", 0) for p in month_payments)

    # Calculate expected this month (sum of all students' monthly fees)
    students = await db.students.find().to_list(500)
    expected = sum(s.get("monthly_fee", 0) for s in students)
    pending = max(0, expected - collected)

    # Recent payments (last 15)
    recent = await db.fee_records.find().sort("created_at", -1).to_list(15)
    recent_list = []
    for r in recent:
        student_name = ""
        batch_name = ""
        if r.get("student_id"):
            try:
                student = await db.students.find_one({"_id": ObjectId(r["student_id"])})
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
        date_paid = r.get("date_paid", datetime.utcnow())
        if isinstance(date_paid, str):
            date_paid = datetime.fromisoformat(date_paid).date()
        elif isinstance(date_paid, datetime):
            date_paid = date_paid.date()
        recent_list.append({
            "id": str(r["_id"]),
            "student_id": r.get("student_id", ""),
            "student_name": student_name,
            "batch_name": batch_name,
            "amount_paid": r.get("amount_paid", 0),
            "date_paid": date_paid,
            "fee_month": r.get("fee_month", 1),
            "fee_year": r.get("fee_year", 2026),
            "note": r.get("note", ""),
            "created_at": r.get("created_at", datetime.utcnow()),
        })

    return {
        "total_students": total_students,
        "total_batches": total_batches,
        "collected_this_month": collected,
        "expected_this_month": expected,
        "pending_this_month": pending,
        "recent_payments": recent_list,
    }
