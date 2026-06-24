import csv
import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.database import get_db
from app.models.booking import Booking
from app.models.payment import Payment
from app.models.event import Event
from app.schemas.reports import OverallReportResponse, BookingReportItem, RevenueReportItem, EventReportSummary
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/reports", tags=["Reports & Exports"])

@router.get("/dashboard", response_model=OverallReportResponse)
def get_reports_dashboard(event_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Calculate overall booking and revenue
    # Assuming the current_user is an organizer and we want stats for their events
    # Or admin who gets stats for all
    
    events_query = db.query(Event)
    if current_user.role.value != "ADMIN":
        events_query = events_query.filter(Event.organizer_id == current_user.id)
    
    if event_id:
        events_query = events_query.filter(Event.id == event_id)
        
    my_events = events_query.all()
    my_event_ids = [e.id for e in my_events]

    if not my_event_ids:
        return OverallReportResponse(
            total_bookings_all_time=0,
            total_revenue_all_time=0.0,
            bookings_by_date=[],
            revenue_by_date=[],
            events_summary=[]
        )

    # 1. Total Bookings (CONFIRMED + ATTENDED both count as valid paid bookings)
    valid_statuses = ["CONFIRMED", "ATTENDED"]
    bookings_query = db.query(Booking).filter(
        Booking.event_id.in_(my_event_ids),
        Booking.status.in_(valid_statuses)
    )
    total_bookings = bookings_query.count()
    
    # 2. Total Revenue — use booking total_amount as primary source (always populated)
    # Also try payments table with status SUCCESS (not COMPLETED)
    total_revenue_from_bookings = db.query(func.sum(Booking.total_amount)).filter(
        Booking.event_id.in_(my_event_ids),
        Booking.status.in_(valid_statuses)
    ).scalar() or 0.0

    total_revenue_from_payments = db.query(func.sum(Payment.amount)).join(Booking).filter(
        Booking.event_id.in_(my_event_ids),
        Payment.status == "SUCCESS"
    ).scalar() or 0.0

    # Use whichever is higher (bookings total_amount is always populated)
    total_revenue = max(float(total_revenue_from_bookings), float(total_revenue_from_payments))

    # 3. Bookings by date (group by date of booked_at)
    bookings_by_date_raw = db.query(
        func.date(Booking.booked_at).label('date'),
        func.count(Booking.id).label('total_bookings'),
        func.sum(Booking.quantity).label('total_tickets')
    ).filter(
        Booking.event_id.in_(my_event_ids),
        Booking.status.in_(valid_statuses)
    ).group_by(func.date(Booking.booked_at)).order_by(func.date(Booking.booked_at)).all()
    
    bookings_by_date = [
        BookingReportItem(
            date=str(r.date),
            total_bookings=r.total_bookings,
            total_tickets=int(r.total_tickets or 0)
        ) for r in bookings_by_date_raw
    ]

    # 4. Revenue by date — use booking total_amount grouped by date (reliable source)
    revenue_by_date_raw = db.query(
        func.date(Booking.booked_at).label('date'),
        func.sum(Booking.total_amount).label('total_revenue')
    ).filter(
        Booking.event_id.in_(my_event_ids),
        Booking.status.in_(valid_statuses)
    ).group_by(func.date(Booking.booked_at)).order_by(func.date(Booking.booked_at)).all()

    revenue_by_date = [
        RevenueReportItem(
            date=str(r.date),
            total_revenue=float(r.total_revenue or 0),
            total_discount=0.0
        ) for r in revenue_by_date_raw
    ]

    # 5. Events Summary
    events_summary = []
    for e in my_events:
        e_total_bookings = db.query(Booking).filter(
            Booking.event_id == e.id, Booking.status.in_(valid_statuses)
        ).count()
        e_total_tickets = db.query(func.sum(Booking.quantity)).filter(
            Booking.event_id == e.id, Booking.status.in_(valid_statuses)
        ).scalar() or 0
        # Use booking total_amount as revenue (always populated)
        e_revenue = db.query(func.sum(Booking.total_amount)).filter(
            Booking.event_id == e.id, Booking.status.in_(valid_statuses)
        ).scalar() or 0.0
        
        events_summary.append(EventReportSummary(
            event_id=e.id,
            event_title=e.title,
            total_bookings=e_total_bookings,
            total_revenue=float(e_revenue),
            total_tickets_sold=int(e_total_tickets)
        ))

    return OverallReportResponse(
        total_bookings_all_time=total_bookings,
        total_revenue_all_time=float(total_revenue),
        bookings_by_date=bookings_by_date,
        revenue_by_date=revenue_by_date,
        events_summary=events_summary
    )


@router.get("/export/csv")
def export_reports_csv(event_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    events_query = db.query(Event)
    if current_user.role.value != "ADMIN":
        events_query = events_query.filter(Event.organizer_id == current_user.id)
    
    if event_id:
        events_query = events_query.filter(Event.id == event_id)
        
    my_events = events_query.all()
    my_event_ids = [e.id for e in my_events]

    if not my_event_ids:
        raise HTTPException(status_code=404, detail="No events found for export")

    valid_statuses = ["CONFIRMED", "ATTENDED"]
    # Fetch all valid bookings for CSV
    bookings = db.query(Booking).filter(
        Booking.event_id.in_(my_event_ids),
        Booking.status.in_(valid_statuses)
    ).all()

    # Create CSV in memory
    stream = io.StringIO()
    csv_writer = csv.writer(stream)
    
    # Write header
    csv_writer.writerow(["Booking ID", "Event Title", "User Email", "Quantity", "Total Amount", "Booking Date"])

    for b in bookings:
        event_title = b.event.title if b.event else "N/A"
        user_email = b.user.email if b.user else "N/A"
        date_str = b.booked_at.strftime("%Y-%m-%d %H:%M:%S") if b.booked_at else "N/A"
        
        csv_writer.writerow([
            b.id,
            event_title,
            user_email,
            b.quantity,
            f"{b.total_amount:.2f}",
            date_str
        ])

    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=booking_reports.csv"
    return response
