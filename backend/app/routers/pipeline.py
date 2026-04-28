from fastapi import APIRouter, Depends, BackgroundTasks
from app.routers.auth import get_current_user
from app.etl.pipeline_runner import run_nasa_power_pipeline, run_openweather_pipeline, run_era5_pipeline
from app.database import SessionLocal
from app.models.models import PipelineRun, PipelineLog
from app.schemas.schemas import PipelineRunResponse
from sqlalchemy.orm import Session
from app.database import get_db
from typing import List

router = APIRouter(prefix="/pipeline", tags=["ETL Pipeline"])


@router.post("/run/nasa-power")
def trigger_nasa_power_pipeline(
    background_tasks: BackgroundTasks,
    days_back: int = 7,
    current_user=Depends(get_current_user)
):
    """
    Trigger the NASA POWER ETL pipeline.
    Runs in the background so the API stays responsive.
    """
    background_tasks.add_task(run_nasa_power_pipeline, days_back=days_back)
    return {
        "message": "NASA POWER pipeline triggered successfully",
        "days_back": days_back,
        "status": "running in background"
    }


@router.get("/runs", response_model=List[PipelineRunResponse])
def get_pipeline_runs(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get all pipeline run history for audit trail."""
    return db.query(PipelineRun).order_by(PipelineRun.started_at.desc()).all()


@router.get("/runs/{run_id}/logs")
def get_pipeline_logs(
    run_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get logs for a specific pipeline run."""
    logs = db.query(PipelineLog).filter(
        PipelineLog.run_id == run_id
    ).order_by(PipelineLog.logged_at).all()
    return logs 

@router.post("/run/openweather")
def trigger_openweather_pipeline(
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user)
):
    """Trigger the OpenWeather current conditions ETL pipeline."""
    background_tasks.add_task(run_openweather_pipeline)
    return {
        "message": "OpenWeather pipeline triggered successfully",
        "status": "running in background"
    }


@router.post("/run/era5")
def trigger_era5_pipeline(
    background_tasks: BackgroundTasks,
    days_back: int = 7,
    current_user=Depends(get_current_user)
):
    """Trigger the ERA5 reanalysis ETL pipeline."""
    background_tasks.add_task(run_era5_pipeline, days_back=days_back)
    return {
        "message": "ERA5 pipeline triggered successfully",
        "days_back": days_back,
        "status": "running in background"
    }