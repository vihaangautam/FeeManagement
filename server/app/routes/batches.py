from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime

from app.database import get_database
from app.models import BatchCreate, BatchUpdate, BatchResponse

router = APIRouter(prefix="/api/batches", tags=["batches"])


def batch_doc_to_response(doc: dict, student_count: int = 0) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "type": doc["type"],
        "location": doc.get("location", ""),
        "timing": doc.get("timing", ""),
        "student_count": student_count,
        "created_at": doc.get("created_at", datetime.utcnow()),
    }


@router.get("")
async def list_batches():
    db = get_database()
    batches = await db.batches.find().sort("created_at", -1).to_list(100)
    result = []
    for batch in batches:
        count = await db.students.count_documents({"batch_id": str(batch["_id"])})
        result.append(batch_doc_to_response(batch, count))
    return result


@router.get("/{batch_id}")
async def get_batch(batch_id: str):
    db = get_database()
    try:
        batch = await db.batches.find_one({"_id": ObjectId(batch_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid batch ID")
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    count = await db.students.count_documents({"batch_id": batch_id})
    return batch_doc_to_response(batch, count)


@router.post("", status_code=201)
async def create_batch(data: BatchCreate):
    db = get_database()
    doc = {
        "name": data.name,
        "type": data.type,
        "location": data.location,
        "timing": data.timing,
        "created_at": datetime.utcnow(),
    }
    result = await db.batches.insert_one(doc)
    doc["_id"] = result.inserted_id
    return batch_doc_to_response(doc)


@router.put("/{batch_id}")
async def update_batch(batch_id: str, data: BatchUpdate):
    db = get_database()
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    try:
        result = await db.batches.update_one(
            {"_id": ObjectId(batch_id)}, {"$set": update_data}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid batch ID")
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Batch not found")
    batch = await db.batches.find_one({"_id": ObjectId(batch_id)})
    count = await db.students.count_documents({"batch_id": batch_id})
    return batch_doc_to_response(batch, count)


@router.delete("/{batch_id}")
async def delete_batch(batch_id: str):
    db = get_database()
    try:
        # Delete all fee records for students in this batch
        students = await db.students.find({"batch_id": batch_id}).to_list(1000)
        student_ids = [str(s["_id"]) for s in students]
        if student_ids:
            await db.fee_records.delete_many({"student_id": {"$in": student_ids}})
        # Delete all students in this batch
        await db.students.delete_many({"batch_id": batch_id})
        # Delete the batch
        result = await db.batches.delete_one({"_id": ObjectId(batch_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid batch ID")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Batch not found")
    return {"message": "Batch deleted successfully"}
