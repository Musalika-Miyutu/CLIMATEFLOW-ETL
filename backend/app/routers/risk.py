from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import RiskAssessment, Alert
from app.schemas.schemas import RiskAssessmentCreate, RiskAssessmentResponse, AlertCreate, AlertResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/risk", tags=["Risk Assessments"])


# ── Risk Assessments ─────────────────────────────────────────
@router.get("/", response_model=List[RiskAssessmentResponse])
def get_all_assessments(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(RiskAssessment).all()


@router.get("/{assessment_id}", response_model=RiskAssessmentResponse)
def get_assessment(assessment_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    assessment = db.query(RiskAssessment).filter(RiskAssessment.assessment_id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment


@router.post("/", response_model=RiskAssessmentResponse)
def create_assessment(assessment: RiskAssessmentCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    new_assessment = RiskAssessment(**assessment.dict())
    db.add(new_assessment)
    db.commit()
    db.refresh(new_assessment)
    return new_assessment


@router.get("/asset/{asset_id}", response_model=List[RiskAssessmentResponse])
def get_assessments_by_asset(asset_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    assessments = db.query(RiskAssessment).filter(RiskAssessment.asset_id == asset_id).all()
    if not assessments:
        raise HTTPException(status_code=404, detail="No assessments found for this asset")
    return assessments


# ── Alerts ───────────────────────────────────────────────────
@router.get("/alerts/all", response_model=List[AlertResponse])
def get_all_alerts(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Alert).all()


@router.post("/alerts", response_model=AlertResponse)
def create_alert(alert: AlertCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    new_alert = Alert(**alert.dict())
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert


@router.put("/alerts/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(alert_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    from datetime import datetime
    alert.acknowledged = True
    alert.acknowledged_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    return alert