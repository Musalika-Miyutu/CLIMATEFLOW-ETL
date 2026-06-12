import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.models import (
    InfrastructureAsset, WeatherObservation,
    RiskAssessment, Alert, PipelineRun, PipelineLog
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ── Risk Thresholds ───────────────────────────────────────────
# These are based on Zambia Copperbelt climate conditions
RISK_THRESHOLDS = {
    "rainfall_mm": {
        1: 0,    # No risk      — 0mm
        2: 10,   # Low risk     — 10mm+
        3: 25,   # Medium risk  — 25mm+
        4: 50,   # High risk    — 50mm+
        5: 100   # Critical     — 100mm+
    },
    "wind_speed_ms": {
        1: 0,    # No risk      — 0 m/s
        2: 5,    # Low risk     — 5 m/s+
        3: 10,   # Medium risk  — 10 m/s+
        4: 15,   # High risk    — 15 m/s+
        5: 20    # Critical     — 20 m/s+
    },
    "temperature_c": {
        1: 0,    # No risk      — normal
        2: 35,   # Low risk     — 35°C+
        3: 38,   # Medium risk  — 38°C+
        4: 40,   # High risk    — 40°C+
        5: 42    # Critical     — 42°C+
    }
}

# Asset type multipliers — bridges are more vulnerable than roads
ASSET_TYPE_MULTIPLIERS = {
    "bridge":   1.5,
    "road":     1.0,
    "drainage": 1.2
}

# Alert severity mapping
SEVERITY_MAP = {
    1: None,       # No alert
    2: None,       # No alert
    3: "medium",   # Medium risk triggers alert
    4: "high",     # High risk triggers alert
    5: "critical"  # Critical triggers alert
}


# ── Risk Calculation ──────────────────────────────────────────
def calculate_risk_score(
    observation: WeatherObservation,
    asset: InfrastructureAsset
) -> int:
    """
    Calculate risk level (1-5) for an infrastructure asset
    based on weather observation data.

    Formula:
    1. Calculate individual risk scores for each weather parameter
    2. Take the maximum risk score across all parameters
    3. Apply asset type multiplier
    4. Compare against asset's own risk threshold
    """
    scores = []

    # Rainfall risk
    if observation.rainfall_mm is not None:
        for level in [5, 4, 3, 2, 1]:
            if observation.rainfall_mm >= RISK_THRESHOLDS["rainfall_mm"][level]:
                scores.append(level)
                break

    # Wind speed risk
    if observation.wind_speed_ms is not None:
        for level in [5, 4, 3, 2, 1]:
            if observation.wind_speed_ms >= RISK_THRESHOLDS["wind_speed_ms"][level]:
                scores.append(level)
                break

    # Temperature risk
    if observation.temperature_c is not None:
        for level in [5, 4, 3, 2, 1]:
            if observation.temperature_c >= RISK_THRESHOLDS["temperature_c"][level]:
                scores.append(level)
                break

    if not scores:
        return 1

    # Take the maximum risk across all parameters
    base_risk = max(scores)

    # Apply asset type multiplier
    multiplier = ASSET_TYPE_MULTIPLIERS.get(asset.asset_type, 1.0)
    adjusted_risk = base_risk * multiplier

    # Cap at 5 and floor at 1
    final_risk = max(1, min(5, round(adjusted_risk)))

    return final_risk


def generate_alert_message(
    asset: InfrastructureAsset,
    observation: WeatherObservation,
    risk_level: int
) -> str:
    """
    Generate a human readable alert message for every alert.
    """
    severity = SEVERITY_MAP.get(risk_level)
    if not severity:
        return None

    conditions = []

    if observation.rainfall_mm is not None:
        conditions.append(f"rainfall: {observation.rainfall_mm}mm")

    if observation.wind_speed_ms is not None:
        conditions.append(f"wind speed: {observation.wind_speed_ms}m/s")

    if observation.temperature_c is not None:
        conditions.append(f"temperature: {observation.temperature_c}°C")

    if observation.humidity_pct is not None:
        conditions.append(f"humidity: {observation.humidity_pct}%")

    conditions_str = ", ".join(conditions) if conditions else "weather conditions recorded"

    return (
        f"RISK LEVEL {risk_level} ({severity.upper()}): "
        f"{asset.asset_name} ({asset.asset_type.upper()}) is at {severity} risk. "
        f"Observed conditions on {observation.observed_at.strftime('%Y-%m-%d %H:%M')}: "
        f"{conditions_str}. "
        f"Asset risk threshold: {asset.risk_threshold}. "
        f"Immediate inspection and mitigation recommended."
    )


# ── Main Engine ───────────────────────────────────────────────
def run_risk_assessment_engine():
    """
    Main risk assessment engine.
    For each infrastructure asset, evaluates the latest weather
    observations and calculates risk levels.
    Creates alerts for risk level 3 and above.
    """
    db = SessionLocal()

    # Create pipeline run record
    pipeline_run = PipelineRun(
        pipeline_name="risk_assessment_engine",
        status="running",
        started_at=datetime.utcnow()
    )
    db.add(pipeline_run)
    db.commit()
    db.refresh(pipeline_run)
    run_id = pipeline_run.run_id

    logger.info(f"Risk Assessment Engine started: {run_id}")

    def log(level, message):
        log_entry = PipelineLog(
            run_id=run_id,
            log_level=level,
            message=message,
            logged_at=datetime.utcnow()
        )
        db.add(log_entry)
        db.commit()

    try:
        assets = db.query(InfrastructureAsset).all()
        if not assets:
            log("WARNING", "No infrastructure assets found")
            pipeline_run.status   = "failed"
            pipeline_run.ended_at = datetime.utcnow()
            db.commit()
            return

        log("INFO", f"Evaluating {len(assets)} infrastructure assets")

        observations = db.query(WeatherObservation)\
            .order_by(WeatherObservation.observed_at.desc())\
            .limit(50)\
            .all()

        if not observations:
            log("WARNING", "No weather observations found")
            pipeline_run.status   = "failed"
            pipeline_run.ended_at = datetime.utcnow()
            db.commit()
            return

        log("INFO", f"Using {len(observations)} recent weather observations")

        assessments_created = 0
        alerts_created      = 0

        for asset in assets:
            for observation in observations:

                # Check if assessment already exists
                existing = db.query(RiskAssessment).filter(
                    RiskAssessment.asset_id       == asset.asset_id,
                    RiskAssessment.observation_id == observation.observation_id
                ).first()

                if existing:
                    continue

                # Calculate risk level
                risk_level = calculate_risk_score(observation, asset)

                # Determine if alert should be triggered
                alert_triggered = risk_level >= 3

                # Create risk assessment
                assessment = RiskAssessment(
                    asset_id          =asset.asset_id,
                    observation_id    =observation.observation_id,
                    risk_level        =risk_level,
                    alert_triggered   =alert_triggered,
                    mitigation_status ="none",
                    notes             =f"Auto-generated by Risk Assessment Engine. "
                                       f"Asset type: {asset.asset_type}, "
                                       f"Multiplier: {ASSET_TYPE_MULTIPLIERS.get(asset.asset_type, 1.0)}",
                    assessed_at       =datetime.utcnow()
                )
                db.add(assessment)
                db.commit()
                db.refresh(assessment)
                assessments_created += 1

                # Create alert if risk level is 3 or above
                if alert_triggered:
                    severity = SEVERITY_MAP.get(risk_level)
                    message  = generate_alert_message(asset, observation, risk_level)

                    if message:
                        alert = Alert(
                            assessment_id =assessment.assessment_id,
                            severity      =severity,
                            message       =message,
                            acknowledged  =False,
                            triggered_at  =datetime.utcnow()
                        )
                        db.add(alert)
                        db.commit()
                        alerts_created += 1

        log("INFO", f"Created {assessments_created} risk assessments")
        log("INFO", f"Created {alerts_created} alerts")

        pipeline_run.status            = "success"
        pipeline_run.records_processed = assessments_created
        pipeline_run.ended_at          = datetime.utcnow()
        db.commit()

        logger.info(
            f"Risk Assessment Engine completed. "
            f"{assessments_created} assessments, {alerts_created} alerts created."
        )

    except Exception as e:
        logger.error(f"Risk Assessment Engine failed: {e}")
        log("ERROR", f"Risk Assessment Engine failed: {e}")
        pipeline_run.status   = "failed"
        pipeline_run.ended_at = datetime.utcnow()
        db.commit()

    finally:
        db.close()


if __name__ == "__main__":
    run_risk_assessment_engine()