from fastapi import FastAPI
from sqlalchemy import text

from .database import engine


app = FastAPI(
    title="CampusLeave AI",
    description="AI-powered College Leave Management System",
    version="1.0.0",
)


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