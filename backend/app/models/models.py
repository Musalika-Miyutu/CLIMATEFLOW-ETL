from sqlalchemy import Column, String, Float, Integer, Boolean, Text, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime

class WeatherStation(Base):
    __tablename__ = "weather_station"

    station_id   = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    station_name = Column(String(150), nullable=False)
    latitude     = Column(Float, nullable=False)
    longitude    = Column(Float, nullable=False)
    source_api   = Column(String(100))
    created_at   = Column(DateTime, default=datetime.utcnow)

    observations = relationship("WeatherObservation", back_populates="station")


class WeatherObservation(Base):
    __tablename__ = "weather_observation"

    observation_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    station_id     = Column(UUID(as_uuid=True), ForeignKey("weather_station.station_id", ondelete="CASCADE"), nullable=False)
    temperature_c  = Column(Float)
    rainfall_mm    = Column(Float)
    wind_speed_ms  = Column(Float)
    humidity_pct   = Column(Float)
    raw_format     = Column(String(20), default="JSON")
    observed_at    = Column(DateTime, nullable=False)
    ingested_at    = Column(DateTime, default=datetime.utcnow)

    station     = relationship("WeatherStation", back_populates="observations")
    assessments = relationship("RiskAssessment", back_populates="observation")


class InfrastructureAsset(Base):
    __tablename__ = "infrastructure_asset"

    asset_id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_name       = Column(String(200), nullable=False)
    asset_type       = Column(String(50), nullable=False)
    latitude         = Column(Float, nullable=False)
    longitude        = Column(Float, nullable=False)
    risk_threshold   = Column(Float, default=3.0)
    condition_status = Column(String(50), default="good")
    last_inspected   = Column(DateTime)
    created_at       = Column(DateTime, default=datetime.utcnow)

    assessments = relationship("RiskAssessment", back_populates="asset")


class RiskAssessment(Base):
    __tablename__ = "risk_assessment"

    assessment_id     = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id          = Column(UUID(as_uuid=True), ForeignKey("infrastructure_asset.asset_id", ondelete="CASCADE"), nullable=False)
    observation_id    = Column(UUID(as_uuid=True), ForeignKey("weather_observation.observation_id", ondelete="CASCADE"), nullable=False)
    risk_level        = Column(Integer, nullable=False)
    alert_triggered   = Column(Boolean, default=False)
    mitigation_status = Column(String(50), default="none")
    notes             = Column(Text)
    assessed_at       = Column(DateTime, default=datetime.utcnow)

    asset       = relationship("InfrastructureAsset", back_populates="assessments")
    observation = relationship("WeatherObservation", back_populates="assessments")
    alerts      = relationship("Alert", back_populates="assessment")


class Alert(Base):
    __tablename__ = "alert"

    alert_id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id    = Column(UUID(as_uuid=True), ForeignKey("risk_assessment.assessment_id", ondelete="CASCADE"), nullable=False)
    severity         = Column(String(20), nullable=False)
    message          = Column(Text, nullable=False)
    acknowledged     = Column(Boolean, default=False)
    triggered_at     = Column(DateTime, default=datetime.utcnow)
    acknowledged_at  = Column(DateTime)

    assessment = relationship("RiskAssessment", back_populates="alerts")


class AppUser(Base):
    __tablename__ = "app_user"

    user_id       = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username      = Column(String(100), unique=True, nullable=False)
    email         = Column(String(200), unique=True, nullable=False)
    role          = Column(String(30), default="analyst")
    password_hash = Column(String(255), nullable=False)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)


class PipelineRun(Base):
    __tablename__ = "pipeline_run"

    run_id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pipeline_name     = Column(String(150), nullable=False)
    status            = Column(String(30), default="running")
    records_processed = Column(Integer, default=0)
    started_at        = Column(DateTime, default=datetime.utcnow)
    ended_at          = Column(DateTime)

    logs = relationship("PipelineLog", back_populates="run")


class PipelineLog(Base):
    __tablename__ = "pipeline_log"

    log_id    = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id    = Column(UUID(as_uuid=True), ForeignKey("pipeline_run.run_id", ondelete="CASCADE"), nullable=False)
    log_level = Column(String(20), default="INFO")
    message   = Column(Text, nullable=False)
    logged_at = Column(DateTime, default=datetime.utcnow)

    run = relationship("PipelineRun", back_populates="logs")