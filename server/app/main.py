from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import connect_to_mongo, close_mongo_connection
from app.routes import batches, students, fee_records, dashboard

app = FastAPI(
    title="TuitionTracker API",
    description="Student & Fee Management for Tuition Teachers",
    version="1.0.0",
)

# CORS — allow frontend dev server and deployed frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await connect_to_mongo()


@app.on_event("shutdown")
async def shutdown():
    await close_mongo_connection()


# Register route modules
app.include_router(batches.router)
app.include_router(students.router)
app.include_router(fee_records.router)
app.include_router(dashboard.router)


@app.get("/")
async def root():
    return {"message": "TuitionTracker API is running"}


@app.get("/health")
async def health():
    return {"status": "ok"}
