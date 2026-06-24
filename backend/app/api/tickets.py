from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.event import Event
from app.models.ticket import Ticket
from app.schemas.ticket import TicketCreate, TicketUpdate, TicketResponse
from app.models.user import User
from app.api.deps import require_organizer_or_admin

router = APIRouter(tags=["Tickets"])


@router.get("/api/events/{event_id}/tickets", response_model=list[TicketResponse])
def list_tickets(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return db.query(Ticket).filter(Ticket.event_id == event_id).all()


@router.post("/api/events/{event_id}/tickets", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    event_id: int,
    data: TicketCreate,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.organizer_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")

    ticket = Ticket(
        event_id=event_id,
        name=data.name,
        type=data.type,
        price=data.price,
        quantity=data.quantity,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.put("/api/tickets/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: int,
    data: TicketUpdate,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    event = db.query(Event).filter(Event.id == ticket.event_id).first()
    if event.organizer_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(ticket, key, value)

    db.commit()
    db.refresh(ticket)
    return ticket


@router.delete("/api/tickets/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(
    ticket_id: int,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    event = db.query(Event).filter(Event.id == ticket.event_id).first()
    if event.organizer_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(ticket)
    db.commit()
