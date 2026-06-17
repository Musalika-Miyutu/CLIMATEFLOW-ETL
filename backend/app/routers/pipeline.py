from datetime import datetime
from fastapi import APIRouter, Depends, BackgroundTasks
from app.routers.auth import get_current_user
from app.etl.pipeline_runner import run_nasa_power_pipeline, run_openweather_pipeline, run_era5_pipeline
from app.etl.risk_engine import run_risk_assessment_engine
from app.database import SessionLocal
from app.models.models import PipelineRun, PipelineLog
from app.schemas.schemas import PipelineRunResponse
from sqlalchemy.orm import Session
from app.database import get_db
from typing import List
from fastapi.responses import StreamingResponse
from app.reports.pdf_generator import generate_infrastructure_report
from app.models.models import InfrastructureAsset, RiskAssessment, Alert, WeatherStation, WeatherObservation

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

@router.post("/run/risk-assessment")
def trigger_risk_assessment(
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user)
):
    """
    Trigger the Risk Assessment Engine.
    Evaluates all infrastructure assets against latest weather observations.
    """
    background_tasks.add_task(run_risk_assessment_engine)
    return {
        "message": "Risk Assessment Engine triggered successfully",
        "status":  "running in background"
    }

@router.get("/schedule")
def get_schedule(current_user=Depends(get_current_user)):
    """Get the status and next run times of all scheduled pipelines."""
    from app.scheduler import get_scheduler_status
    return get_scheduler_status()

@router.get("/report/pdf")
def download_pdf_report(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Generate and download a PDF report of the current infrastructure status."""

    assets_query      = db.query(InfrastructureAsset).all()
    assessments_query = db.query(RiskAssessment).order_by(RiskAssessment.assessed_at.desc()).limit(100).all()
    alerts_query      = db.query(Alert).filter(Alert.acknowledged == False).order_by(Alert.triggered_at.desc()).all()

    assets = [{
        "asset_name":       a.asset_name,
        "asset_type":       a.asset_type,
        "condition_status": a.condition_status,
        "risk_threshold":   a.risk_threshold
    } for a in assets_query]

    assessments = [{"risk_level": a.risk_level} for a in assessments_query]

    alerts = [{
        "severity": a.severity,
        "message":  a.message
    } for a in alerts_query]

    sources = ["NASA POWER", "OpenWeather", "ERA5"]
    sources_summary = []
    for source in sources:
        stations = db.query(WeatherStation).filter(WeatherStation.source_api == source).all()
        station_ids = [s.station_id for s in stations]
        total_obs = db.query(WeatherObservation).filter(
            WeatherObservation.station_id.in_(station_ids)
        ).count() if station_ids else 0

        sources_summary.append({
            "source": source,
            "total_stations": len(stations),
            "total_observations": total_obs
        })

    pdf_buffer = generate_infrastructure_report(assets, assessments, alerts, sources_summary)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=climateflow_report_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.pdf"
        }
    )