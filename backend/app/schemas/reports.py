from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class BookingReportItem(BaseModel):
    date: str
    total_bookings: int
    total_tickets: int

class RevenueReportItem(BaseModel):
    date: str
    total_revenue: float
    total_discount: float

class EventReportSummary(BaseModel):
    event_id: int
    event_title: str
    total_bookings: int
    total_revenue: float
    total_tickets_sold: int

class OverallReportResponse(BaseModel):
    total_bookings_all_time: int
    total_revenue_all_time: float
    bookings_by_date: List[BookingReportItem]
    revenue_by_date: List[RevenueReportItem]
    events_summary: List[EventReportSummary]
