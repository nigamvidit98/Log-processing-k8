from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# Create the FastAPI application instance.
app = FastAPI(title="Log Processing Platform", version="1.0.0")

# Enable CORS so the frontend can call the API from a different origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for logs. This is reset when the server restarts.
LOG_STORE: list[dict[str, Any]] = []


class LogCreateRequest(BaseModel):
    """Request schema for creating a log entry."""

    hostname: str = Field(..., min_length=1, description="Hostname that produced the log")
    application: str = Field(..., min_length=1, description="Name of the application")
    severity: str = Field(..., min_length=1, description="Severity level such as INFO or ERROR")
    message: str = Field(..., min_length=1, description="Log message body")


@app.post("/logs", status_code=201)
def create_log(payload: LogCreateRequest) -> dict[str, Any]:
    """Accept a log payload, add a UTC timestamp, and store the entry."""
    log_entry = {
        "hostname": payload.hostname,
        "application": payload.application,
        "severity": payload.severity.upper(),
        "message": payload.message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    LOG_STORE.append(log_entry)
    return log_entry


@app.get("/logs")
def get_logs() -> list[dict[str, Any]]:
    """Return every stored log."""
    return LOG_STORE


@app.get("/logs/error")
def get_error_logs() -> list[dict[str, Any]]:
    """Return only logs whose severity is ERROR."""
    return [log for log in LOG_STORE if log["severity"].upper() == "ERROR"]


@app.get("/health")
def health() -> dict[str, str]:
    """Simple health check endpoint."""
    return {"status": "Healthy"}


@app.get("/ready")
def ready() -> dict[str, str]:
    """Readiness check endpoint."""
    return {"status": "Ready"}


# Serve the frontend directly from the FastAPI app when the assets are available.
frontend_dir = Path(__file__).resolve().parents[2] / "frontend"
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
