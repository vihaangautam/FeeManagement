from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from datetime import datetime
from typing import Optional

from app.database import get_database
from app.models import StudentCreate, StudentUpdate, StudentResponse

router = APIRouter(prefix="/api/students", tags=["students"])


async def student_doc_to_response(doc: dict) -> dict:
    db = get_database()
    batch_name = ""
    if doc.get("batch_id"):
        try:
            batch = await db.batches.find_one({"_id": ObjectId(doc["batch_id"])})
            if batch:
                batch_name = batch["name"]
        except Exception:
            pass
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "batch_id": doc.get("batch_id", ""),
        "batch_name": batch_name,
        "phone": doc.get("phone", ""),
        "monthly_fee": doc.get("monthly_fee", 0),
        "joining_date": doc.get("joining_date", doc.get("created_at", datetime.utcnow())),
        "created_at": doc.get("created_at", datetime.utcnow()),
    }


@router.get("")
async def list_students(batch_id: Optional[str] = Query(None)):
    db = get_database()
    query = {}
    if batch_id:
        query["batch_id"] = batch_id
    students = await db.students.find(query).sort("name", 1).to_list(500)
    result = []
    for s in students:
        result.append(await student_doc_to_response(s))
    return result


@router.get("/{student_id}")
async def get_student(student_id: str):
    db = get_database()
    try:
        student = await db.students.find_one({"_id": ObjectId(student_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID")
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    response = await student_doc_to_response(student)
    # Include payment history
    payments = await db.fee_records.find({"student_id": student_id}).sort(
        [("fee_year", -1), ("fee_month", -1)]
    ).to_list(200)
    response["payments"] = [
        {
            "id": str(p["_id"]),
            "amount_paid": p["amount_paid"],
            "date_paid": p["date_paid"].isoformat() if isinstance(p["date_paid"], datetime) else str(p["date_paid"]),
            "fee_month": p["fee_month"],
            "fee_year": p["fee_year"],
            "note": p.get("note", ""),
            "created_at": p.get("created_at", datetime.utcnow()),
        }
        for p in payments
    ]
    return response


@router.post("", status_code=201)
async def create_student(data: StudentCreate):
    db = get_database()
    # Verify batch exists
    try:
        batch = await db.batches.find_one({"_id": ObjectId(data.batch_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid batch ID")
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    doc = {
        "name": data.name,
        "batch_id": data.batch_id,
        "phone": data.phone,
        "monthly_fee": data.monthly_fee,
        "joining_date": datetime.utcnow(),
        "created_at": datetime.utcnow(),
    }
    result = await db.students.insert_one(doc)
    doc["_id"] = result.inserted_id
    return await student_doc_to_response(doc)


@router.put("/{student_id}")
async def update_student(student_id: str, data: StudentUpdate):
    db = get_database()
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    # Verify batch if being updated
    if "batch_id" in update_data:
        try:
            batch = await db.batches.find_one({"_id": ObjectId(update_data["batch_id"])})
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid batch ID")
        if not batch:
            raise HTTPException(status_code=404, detail="Batch not found")
    try:
        result = await db.students.update_one(
            {"_id": ObjectId(student_id)}, {"$set": update_data}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID")
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    student = await db.students.find_one({"_id": ObjectId(student_id)})
    return await student_doc_to_response(student)


@router.delete("/{student_id}")
async def delete_student(student_id: str):
    db = get_database()
    try:
        # Delete all fee records for this student
        await db.fee_records.delete_many({"student_id": student_id})
        result = await db.students.delete_one({"_id": ObjectId(student_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student deleted successfully"}
