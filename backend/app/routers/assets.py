from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import InfrastructureAsset
from app.schemas.schemas import InfrastructureAssetCreate, InfrastructureAssetResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/assets", tags=["Infrastructure Assets"])


@router.get("/", response_model=List[InfrastructureAssetResponse])
def get_all_assets(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(InfrastructureAsset).all()


@router.get("/{asset_id}", response_model=InfrastructureAssetResponse)
def get_asset(asset_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    asset = db.query(InfrastructureAsset).filter(InfrastructureAsset.asset_id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.post("/", response_model=InfrastructureAssetResponse)
def create_asset(asset: InfrastructureAssetCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    new_asset = InfrastructureAsset(**asset.dict())
    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)
    return new_asset


@router.delete("/{asset_id}")
def delete_asset(asset_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    asset = db.query(InfrastructureAsset).filter(InfrastructureAsset.asset_id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    db.delete(asset)
    db.commit()
    return {"message": "Asset deleted successfully"}