from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import connect_to_mongo, close_mongo_connection
from app.auth import decode_token
from app.routes import batches, students, fee_records, dashboard, auth

app = FastAPI(
    title="TutorFlow API",
    description="Student & Fee Management for Tuition Teachers",
    version="2.0.0",
    redirect_slashes=False,
)

# CORS — allow frontend dev server and deployed frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes that don't require auth
PUBLIC_PATHS = {"/", "/health", "/api/auth/login", "/api/auth/register"}


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    # Skip auth for public paths, OPTIONS (CORS preflight)
    if request.url.path in PUBLIC_PATHS or request.method == "OPTIONS":
        return await call_next(request)

    # Check for Bearer token
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"detail": "Not authenticated"})

    token = auth_header.split("Bearer ")[1]
    payload = decode_token(token)
    if not payload:
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired token"})

    # Attach user info to request state
    request.state.user_id = payload["sub"]
    request.state.user_name = payload.get("name", "")
    return await call_next(request)


@app.on_event("startup")
async def startup():
    await connect_to_mongo()


@app.on_event("shutdown")
async def shutdown():
    await close_mongo_connection()


# Register route modules
app.include_router(auth.router)
app.include_router(batches.router)
app.include_router(students.router)
app.include_router(fee_records.router)
app.include_router(dashboard.router)


@app.get("/")
async def root():
    return {"message": "TutorFlow API is running"}


@app.get("/health")
async def health():
    return {"status": "ok"}
