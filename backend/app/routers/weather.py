from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import WeatherObservation, WeatherStation
from app.schemas.schemas import WeatherObservationCreate, WeatherObservationResponse, WeatherStationCreate, WeatherStationResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/weather", tags=["Weather"])


# ── Stations ─────────────────────────────────────────────────
@router.get("/stations", response_model=List[WeatherStationResponse])
def get_stations(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(WeatherStation).all()


@router.post("/stations", response_model=WeatherStationResponse)
def create_station(station: WeatherStationCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    new_station = WeatherStation(**station.dict())
    db.add(new_station)
    db.commit()
    db.refresh(new_station)
    return new_station


# ── Observations ─────────────────────────────────────────────
@router.get("/observations", response_model=List[WeatherObservationResponse])
def get_observations(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(WeatherObservation).all()


@router.get("/observations/{observation_id}", response_model=WeatherObservationResponse)
def get_observation(observation_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    obs = db.query(WeatherObservation).filter(WeatherObservation.observation_id == observation_id).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found")
    return obs


@router.post("/observations", response_model=WeatherObservationResponse)
def create_observation(obs: WeatherObservationCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    new_obs = WeatherObservation(**obs.dict())
    db.add(new_obs)
    db.commit()
    db.refresh(new_obs)
    return new_obs


@router.get("/observations/station/{station_id}", response_model=List[WeatherObservationResponse])
def get_observations_by_station(station_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    obs = db.query(WeatherObservation).filter(WeatherObservation.station_id == station_id).all()
    if not obs:
        raise HTTPException(status_code=404, detail="No observations found for this station")
    return obs