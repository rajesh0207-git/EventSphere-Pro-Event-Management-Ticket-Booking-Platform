from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.sponsorship import Sponsor, SponsorPackage, Sponsorship
from app.schemas.sponsorship import (
    SponsorCreate, SponsorUpdate, SponsorResponse,
    SponsorPackageCreate, SponsorPackageUpdate, SponsorPackageResponse,
    SponsorshipCreate, SponsorshipUpdate, SponsorshipResponse
)
from app.api.deps import get_current_user, require_organizer_or_admin
from app.models.user import User
from app.models.event import Event

router = APIRouter(prefix="/api/sponsorships", tags=["Sponsorships"])

# --- Sponsors ---

@router.post("/sponsors", response_model=SponsorResponse)
def create_sponsor(sponsor: SponsorCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_sponsor = Sponsor(**sponsor.model_dump(), user_id=current_user.id)
    db.add(db_sponsor)
    db.commit()
    db.refresh(db_sponsor)
    return db_sponsor

@router.get("/sponsors", response_model=List[SponsorResponse])
def get_sponsors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Sponsor).offset(skip).limit(limit).all()

@router.get("/sponsors/me", response_model=List[SponsorResponse])
def get_my_sponsors(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Sponsor).filter(Sponsor.user_id == current_user.id).all()

@router.get("/sponsors/{sponsor_id}", response_model=SponsorResponse)
def get_sponsor(sponsor_id: int, db: Session = Depends(get_db)):
    sponsor = db.query(Sponsor).filter(Sponsor.id == sponsor_id).first()
    if not sponsor:
        raise HTTPException(status_code=404, detail="Sponsor not found")
    return sponsor

@router.put("/sponsors/{sponsor_id}", response_model=SponsorResponse)
def update_sponsor(sponsor_id: int, sponsor_update: SponsorUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_sponsor = db.query(Sponsor).filter(Sponsor.id == sponsor_id).first()
    if not db_sponsor:
        raise HTTPException(status_code=404, detail="Sponsor not found")
    
    if db_sponsor.user_id != current_user.id and current_user.role.value != "ADMIN":
         raise HTTPException(status_code=403, detail="Not authorized")

    update_data = sponsor_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_sponsor, key, value)
    
    db.commit()
    db.refresh(db_sponsor)
    return db_sponsor

# --- Sponsor Packages ---

@router.post("/packages", response_model=SponsorPackageResponse)
def create_package(package: SponsorPackageCreate, db: Session = Depends(get_db), current_user: User = Depends(require_organizer_or_admin)):
    event = db.query(Event).filter(Event.id == package.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.organizer_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized to create packages for this event")

    db_package = SponsorPackage(**package.model_dump())
    db.add(db_package)
    db.commit()
    db.refresh(db_package)
    return db_package

@router.get("/packages/event/{event_id}", response_model=List[SponsorPackageResponse])
def get_packages_for_event(event_id: int, db: Session = Depends(get_db)):
    return db.query(SponsorPackage).filter(SponsorPackage.event_id == event_id).all()

@router.put("/packages/{package_id}", response_model=SponsorPackageResponse)
def update_package(package_id: int, package_update: SponsorPackageUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_organizer_or_admin)):
    db_package = db.query(SponsorPackage).filter(SponsorPackage.id == package_id).first()
    if not db_package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    event = db.query(Event).filter(Event.id == db_package.event_id).first()
    if event and event.organizer_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = package_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_package, key, value)
    
    db.commit()
    db.refresh(db_package)
    return db_package

@router.delete("/packages/{package_id}")
def delete_package(package_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_organizer_or_admin)):
    db_package = db.query(SponsorPackage).filter(SponsorPackage.id == package_id).first()
    if not db_package:
        raise HTTPException(status_code=404, detail="Package not found")

    event = db.query(Event).filter(Event.id == db_package.event_id).first()
    if event and event.organizer_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(db_package)
    db.commit()
    return {"message": "Package deleted"}

# --- Sponsorships ---

@router.post("/track", response_model=SponsorshipResponse)
def create_sponsorship(sponsorship: SponsorshipCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_sponsorship = Sponsorship(**sponsorship.model_dump())
    db.add(db_sponsorship)
    db.commit()
    db.refresh(db_sponsorship)
    return db_sponsorship

@router.get("/track/event/{event_id}", response_model=List[SponsorshipResponse])
def get_sponsorships_for_event(event_id: int, db: Session = Depends(get_db)):
    return db.query(Sponsorship).filter(Sponsorship.event_id == event_id).all()

@router.get("/track/sponsor/{sponsor_id}", response_model=List[SponsorshipResponse])
def get_sponsorships_for_sponsor(sponsor_id: int, db: Session = Depends(get_db)):
    return db.query(Sponsorship).filter(Sponsorship.sponsor_id == sponsor_id).all()

@router.get("/track/organizer/incoming", response_model=List[SponsorshipResponse])
def get_incoming_sponsorships(db: Session = Depends(get_db), current_user: User = Depends(require_organizer_or_admin)):
    # Get all sponsorships for events owned by current user
    return db.query(Sponsorship).join(Event, Sponsorship.event_id == Event.id).filter(Event.organizer_id == current_user.id).all()

@router.put("/track/{sponsorship_id}", response_model=SponsorshipResponse)
def update_sponsorship_status(sponsorship_id: int, sponsorship_update: SponsorshipUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_organizer_or_admin)):
    db_sponsorship = db.query(Sponsorship).filter(Sponsorship.id == sponsorship_id).first()
    if not db_sponsorship:
        raise HTTPException(status_code=404, detail="Sponsorship not found")

    event = db.query(Event).filter(Event.id == db_sponsorship.event_id).first()
    if event and event.organizer_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")

    if sponsorship_update.status:
        db_sponsorship.status = sponsorship_update.status
    if sponsorship_update.payment_status:
        db_sponsorship.payment_status = sponsorship_update.payment_status
        
    db.commit()
    db.refresh(db_sponsorship)
    return db_sponsorship
