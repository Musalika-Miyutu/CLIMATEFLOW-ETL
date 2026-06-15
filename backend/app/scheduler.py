from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import logging

from app.etl.pipeline_runner import (
    run_nasa_power_pipeline,
    run_openweather_pipeline,
    run_era5_pipeline
)
from app.etl.risk_engine import run_risk_assessment_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def start_scheduler():
    """
    Schedule all ETL pipelines to run automatically.

    Schedule:
    - OpenWeather  — every 6 hours (live conditions)
    - NASA POWER   — every day at 1:00 AM (daily reanalysis)
    - ERA5         — every Monday at 2:00 AM (weekly reanalysis)
    - Risk Engine  — every day at 3:00 AM (after data is ingested)
    """

    # ── OpenWeather — every 6 hours ───────────────────────────
    scheduler.add_job(
        func=run_openweather_pipeline,
        trigger=CronTrigger(hour="0,6,12,18", minute=0),
        id="openweather_pipeline",
        name="OpenWeather Pipeline — every 6 hours",
        replace_existing=True
    )

    # ── NASA POWER — every day at 1:00 AM ────────────────────
    scheduler.add_job(
        func=lambda: run_nasa_power_pipeline(days_back=1),
        trigger=CronTrigger(hour=1, minute=0),
        id="nasa_power_pipeline",
        name="NASA POWER Pipeline — daily at 1AM",
        replace_existing=True
    )

    # ── ERA5 — every Monday at 2:00 AM ────────────────────────
    scheduler.add_job(
        func=lambda: run_era5_pipeline(days_back=7),
        trigger=CronTrigger(day_of_week="mon", hour=2, minute=0),
        id="era5_pipeline",
        name="ERA5 Pipeline — weekly on Monday at 2AM",
        replace_existing=True
    )

    # ── Risk Engine — every day at 3:00 AM ───────────────────
    scheduler.add_job(
        func=run_risk_assessment_engine,
        trigger=CronTrigger(hour=3, minute=0),
        id="risk_assessment_engine",
        name="Risk Assessment Engine — daily at 3AM",
        replace_existing=True
    )

    scheduler.start()
    logger.info("Scheduler started successfully!")
    logger.info("Scheduled jobs:")
    for job in scheduler.get_jobs():
        logger.info(f"  - {job.name}")


def stop_scheduler():
    """Stop the scheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped.")


def get_scheduler_status():
    """Return status of all scheduled jobs."""
    if not scheduler.running:
        return {"status": "stopped", "jobs": []}

    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            "id":       job.id,
            "name":     job.name,
            "next_run": str(job.next_run_time) if job.next_run_time else "N/A",
            "trigger":  str(job.trigger)
        })

    return {
        "status": "running",
        "jobs":   jobs
    }