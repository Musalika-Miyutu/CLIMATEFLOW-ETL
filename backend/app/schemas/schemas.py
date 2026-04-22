from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import uuid

# ============================================================
# WEATHER STATION SCHEMAS
# ============================================================
class WeatherStationBase(BaseModel):
    station_name: str
    latitude: float
    longitude: float
    source_api: Optional[str] = None

class WeatherStationCreate(WeatherStationBase):
    pass

class WeatherStationResponse(WeatherStationBase):
    station_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# WEATHER OBSERVATION SCHEMAS
# ============================================================
class WeatherObservationBase(BaseModel):
    station_id: uuid.UUID
    temperature_c: Optional[float] = None
    rainfall_mm: Optional[float] = None
    wind_speed_ms: Optional[float] = None
    humidity_pct: Optional[float] = None
    raw_format: Optional[str] = "JSON"
    observed_at: datetime

class WeatherObservationCreate(WeatherObservationBase):
    pass

class WeatherObservationResponse(WeatherObservationBase):
    observation_id: uuid.UUID
    ingested_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# INFRASTRUCTURE ASSET SCHEMAS
# ============================================================
class InfrastructureAssetBase(BaseModel):
    asset_name: str
    asset_type: str
    latitude: float
    longitude: float
    risk_threshold: Optional[float] = 3.0
    condition_status: Optional[str] = "good"

class InfrastructureAssetCreate(InfrastructureAssetBase):
    pass

class InfrastructureAssetResponse(InfrastructureAssetBase):
    asset_id: uuid.UUID
    last_inspected: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# RISK ASSESSMENT SCHEMAS
# ============================================================
class RiskAssessmentBase(BaseModel):
    asset_id: uuid.UUID
    observation_id: uuid.UUID
    risk_level: int
    alert_triggered: Optional[bool] = False
    mitigation_status: Optional[str] = "none"
    notes: Optional[str] = None

class RiskAssessmentCreate(RiskAssessmentBase):
    pass

class RiskAssessmentResponse(RiskAssessmentBase):
    assessment_id: uuid.UUID
    assessed_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# ALERT SCHEMAS
# ============================================================
class AlertBase(BaseModel):
    assessment_id: uuid.UUID
    severity: str
    message: str

class AlertCreate(AlertBase):
    pass

class AlertResponse(AlertBase):
    alert_id: uuid.UUID
    acknowledged: bool
    triggered_at: datetime
    acknowledged_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================
# USER SCHEMAS
# ============================================================
class AppUserBase(BaseModel):
    username: str
    email: str
    role: Optional[str] = "analyst"

class AppUserCreate(AppUserBase):
    password: str

class AppUserResponse(AppUserBase):
    user_id: uuid.UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# AUTH SCHEMAS
# ============================================================
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None


# ============================================================
# PIPELINE SCHEMAS
# ============================================================
class PipelineRunResponse(BaseModel):
    run_id: uuid.UUID
    pipeline_name: str
    status: str
    records_processed: int
    started_at: datetime
    ended_at: Optional[datetime] = None

    class Config:
        from_attributes = True