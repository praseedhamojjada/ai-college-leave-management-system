from . import models
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from fastapi import FastAPI
from sqlalchemy import text

from .database import engine
from .routers.auth import router as auth_router
from .routers.leaves import router as leaves_router
from .routers.dashboard import router as dashboard_router
from .routers.ai import router as ai_router
from .routers.attendance import router as attendance_router
from backend.app.routers import ai
from backend.app.routers import notifications


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CampusLeave AI",
    description="AI-powered College Leave Management System",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(ai_router)
app.include_router(leaves_router)
app.include_router(attendance_router)
app.include_router(ai.router)
app.include_router(notifications.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to CampusLeave AI",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.get("/health/database")
def database_health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "database": "connected",
            "status": "healthy",
        }

    except Exception as e:
        return {
            "database": "disconnected",
            "status": "unhealthy",
            "error": str(e),
        }