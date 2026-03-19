from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime

from app.database import get_database
from app.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register", status_code=201)
async def register(data: RegisterRequest):
    db = get_database()

    # Check if email already exists
    existing = await db.users.find_one({"email": data.email.lower().strip()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user_doc = {
        "name": data.name.strip(),
        "email": data.email.lower().strip(),
        "password_hash": hash_password(data.password),
        "created_at": datetime.utcnow(),
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Return token
    token = create_access_token(user_id, user_doc["name"])
    return {
        "token": token,
        "user": {"id": user_id, "name": user_doc["name"], "email": user_doc["email"]},
    }


@router.post("/login")
async def login(data: LoginRequest):
    db = get_database()

    user = await db.users.find_one({"email": data.email.lower().strip()})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])
    token = create_access_token(user_id, user["name"])
    return {
        "token": token,
        "user": {"id": user_id, "name": user["name"], "email": user["email"]},
    }


@router.get("/me")
async def get_me():
    """Used by frontend to validate token — actual auth check happens in middleware."""
    # This will only be reached if the middleware passes (token valid)
    # The middleware doesn't inject user info yet, so we return a simple ack
    return {"status": "authenticated"}
