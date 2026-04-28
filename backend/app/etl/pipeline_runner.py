import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.models import WeatherStation, WeatherObservation, PipelineRun, PipelineLog
from app.etl.nasa_power import fetch_all_stations as fetch_nasa_stations
from app.etl.openweather import fetch_all_stations as fetch_openweather_stations
from app.etl.era5 import fetch_all_stations as fetch_era5_stations
from app.etl.harmonizer import harmonize_data, save_to_parquet

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ── Logging Helpers ───────────────────────────────────────────
def log_to_db(db: Session, run_id, level: str, message: str):
    """
    Write a log entry to the pipeline_log table.
    Satisfies Objective 1.3.2.4 - Framework Validation (auditability)
    """
    log_entry = PipelineLog(
        run_id=run_id,
        log_level=level,
        message=message,
        logged_at=datetime.utcnow()
    )
    db.add(log_entry)
    db.commit()


def get_or_create_station(db: Session, station_name: str, latitude: float, longitude: float, source_api: str):
    """
    Get existing station or create a new one if it doesn't exist.
    """
    station = db.query(WeatherStation).filter(
        WeatherStation.station_name == station_name
    ).first()

    if not station:
        station = WeatherStation(
            station_name=station_name,
            latitude=latitude,
            longitude=longitude,
            source_api=source_api
        )
        db.add(station)
        db.commit()
        db.refresh(station)
        logger.info(f"Created new station: {station_name}")

    return station


def save_observations_to_db(db: Session, df, run_id) -> int:
    """
    Save harmonized weather observations to PostgreSQL.
    Returns the number of records saved.
    """
    records_saved = 0

    for _, row in df.iterrows():
        try:
            station = get_or_create_station(
                db=db,
                station_name=row["station_name"],
                latitude=row["latitude"],
                longitude=row["longitude"],
                source_api=row["source_api"]
            )

            existing = db.query(WeatherObservation).filter(
                WeatherObservation.station_id  == station.station_id,
                WeatherObservation.observed_at == row["observed_at"],
                WeatherObservation.raw_format  == row["raw_format"]
            ).first()

            if not existing:
                observation = WeatherObservation(
                    station_id    =station.station_id,
                    temperature_c =row["temperature_c"],
                    rainfall_mm   =row["rainfall_mm"],
                    wind_speed_ms =row["wind_speed_ms"],
                    humidity_pct  =row["humidity_pct"],
                    raw_format    =row["raw_format"],
                    observed_at   =row["observed_at"],
                    ingested_at   =datetime.utcnow()
                )
                db.add(observation)
                records_saved += 1

        except Exception as e:
            logger.error(f"Error saving observation: {e}")
            log_to_db(db, run_id, "ERROR", f"Error saving observation: {e}")
            continue

    db.commit()
    return records_saved


def run_nasa_power_pipeline(days_back: int = 7):
    """
    Main ETL pipeline function for NASA POWER data.
    Satisfies Objective 1.3.2.1 - Orchestration Design
    
    Steps:
    1. Extract  — fetch data from NASA POWER API
    2. Transform — harmonize and clean the data
    3. Load     — save to PostgreSQL and Parquet
    """
    db = SessionLocal()

    # ── Create pipeline run record (audit trail) ──────────────
    pipeline_run = PipelineRun(
        pipeline_name="nasa_power_ingest",
        status="running",
        started_at=datetime.utcnow()
    )
    db.add(pipeline_run)
    db.commit()
    db.refresh(pipeline_run)
    run_id = pipeline_run.run_id

    logger.info(f"Pipeline run started: {run_id}")
    log_to_db(db, run_id, "INFO", "NASA POWER pipeline started")

    try:
        # ── Step 1: EXTRACT ───────────────────────────────────
        log_to_db(db, run_id, "INFO", f"Fetching NASA POWER data for last {days_back} days")
        raw_df = fetch_nasa_stations(days_back=days_back)

        if raw_df.empty:
            log_to_db(db, run_id, "WARNING", "No data fetched from NASA POWER API")
            pipeline_run.status   = "failed"
            pipeline_run.ended_at = datetime.utcnow()
            db.commit()
            return

        log_to_db(db, run_id, "INFO", f"Extracted {len(raw_df)} raw records from NASA POWER")

        # ── Step 2: TRANSFORM ─────────────────────────────────
        log_to_db(db, run_id, "INFO", "Starting data harmonization")
        clean_df = harmonize_data(raw_df)
        log_to_db(db, run_id, "INFO", f"Harmonization complete. {len(clean_df)} clean records")

        # ── Step 3: LOAD — Save to Parquet ────────────────────
        parquet_path = save_to_parquet(clean_df, source_name="nasa_power")
        if parquet_path:
            log_to_db(db, run_id, "INFO", f"Saved Parquet file: {parquet_path}")

        # ── Step 3: LOAD — Save to PostgreSQL ─────────────────
        log_to_db(db, run_id, "INFO", "Saving observations to PostgreSQL")
        records_saved = save_observations_to_db(db, clean_df, run_id)
        log_to_db(db, run_id, "INFO", f"Saved {records_saved} new observations to database")

        # ── Mark pipeline as successful ───────────────────────
        pipeline_run.status            = "success"
        pipeline_run.records_processed = records_saved
        pipeline_run.ended_at          = datetime.utcnow()
        db.commit()

        logger.info(f"Pipeline completed successfully. {records_saved} records saved.")
        log_to_db(db, run_id, "INFO", "NASA POWER pipeline completed successfully")

    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        log_to_db(db, run_id, "ERROR", f"Pipeline failed: {e}")
        pipeline_run.status   = "failed"
        pipeline_run.ended_at = datetime.utcnow()
        db.commit()

    finally:
        db.close()


if __name__ == "__main__":
    run_nasa_power_pipeline(days_back=7)

def run_openweather_pipeline():
    """
    ETL pipeline for OpenWeather current conditions data.
    """
    db = SessionLocal()

    pipeline_run = PipelineRun(
        pipeline_name="openweather_ingest",
        status="running",
        started_at=datetime.utcnow()
    )
    db.add(pipeline_run)
    db.commit()
    db.refresh(pipeline_run)
    run_id = pipeline_run.run_id

    logger.info(f"OpenWeather pipeline started: {run_id}")
    log_to_db(db, run_id, "INFO", "OpenWeather pipeline started")

    try:
        log_to_db(db, run_id, "INFO", "Fetching current weather from OpenWeather API")
        raw_df = fetch_openweather_stations()

        if raw_df.empty:
            log_to_db(db, run_id, "WARNING", "No data fetched from OpenWeather API")
            pipeline_run.status   = "failed"
            pipeline_run.ended_at = datetime.utcnow()
            db.commit()
            return

        log_to_db(db, run_id, "INFO", f"Extracted {len(raw_df)} raw records")

        clean_df = harmonize_data(raw_df)
        log_to_db(db, run_id, "INFO", f"Harmonization complete. {len(clean_df)} clean records")

        parquet_path = save_to_parquet(clean_df, source_name="openweather")
        if parquet_path:
            log_to_db(db, run_id, "INFO", f"Saved Parquet file: {parquet_path}")

        records_saved = save_observations_to_db(db, clean_df, run_id)
        log_to_db(db, run_id, "INFO", f"Saved {records_saved} new observations to database")

        pipeline_run.status            = "success"
        pipeline_run.records_processed = records_saved
        pipeline_run.ended_at          = datetime.utcnow()
        db.commit()

        logger.info(f"OpenWeather pipeline completed. {records_saved} records saved.")
        log_to_db(db, run_id, "INFO", "OpenWeather pipeline completed successfully")

    except Exception as e:
        logger.error(f"OpenWeather pipeline failed: {e}")
        log_to_db(db, run_id, "ERROR", f"Pipeline failed: {e}")
        pipeline_run.status   = "failed"
        pipeline_run.ended_at = datetime.utcnow()
        db.commit()

    finally:
        db.close()


def run_era5_pipeline(days_back: int = 7):
    """
    ETL pipeline for ERA5 reanalysis data.
    """
    db = SessionLocal()

    pipeline_run = PipelineRun(
        pipeline_name="era5_ingest",
        status="running",
        started_at=datetime.utcnow()
    )
    db.add(pipeline_run)
    db.commit()
    db.refresh(pipeline_run)
    run_id = pipeline_run.run_id

    logger.info(f"ERA5 pipeline started: {run_id}")
    log_to_db(db, run_id, "INFO", "ERA5 pipeline started")

    try:
        log_to_db(db, run_id, "INFO", f"Fetching ERA5 data for last {days_back} days")
        raw_df = fetch_era5_stations(days_back=days_back)

        if raw_df.empty:
            log_to_db(db, run_id, "WARNING", "No data fetched from ERA5")
            pipeline_run.status   = "failed"
            pipeline_run.ended_at = datetime.utcnow()
            db.commit()
            return

        log_to_db(db, run_id, "INFO", f"Extracted {len(raw_df)} raw ERA5 records")

        clean_df = harmonize_data(raw_df)
        log_to_db(db, run_id, "INFO", f"Harmonization complete. {len(clean_df)} clean records")

        parquet_path = save_to_parquet(clean_df, source_name="era5")
        if parquet_path:
            log_to_db(db, run_id, "INFO", f"Saved Parquet file: {parquet_path}")

        records_saved = save_observations_to_db(db, clean_df, run_id)
        log_to_db(db, run_id, "INFO", f"Saved {records_saved} new observations to database")

        pipeline_run.status            = "success"
        pipeline_run.records_processed = records_saved
        pipeline_run.ended_at          = datetime.utcnow()
        db.commit()

        logger.info(f"ERA5 pipeline completed. {records_saved} records saved.")
        log_to_db(db, run_id, "INFO", "ERA5 pipeline completed successfully")

    except Exception as e:
        logger.error(f"ERA5 pipeline failed: {e}")
        log_to_db(db, run_id, "ERROR", f"Pipeline failed: {e}")
        pipeline_run.status   = "failed"
        pipeline_run.ended_at = datetime.utcnow()
        db.commit()

    finally:
        db.close()