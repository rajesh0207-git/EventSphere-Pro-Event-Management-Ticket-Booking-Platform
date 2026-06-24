from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import engine, Base, SessionLocal
from app.config import get_settings

# Import all models so they get registered with Base
from app.models.user import User
from app.models.category import Category
from app.models.event import Event
from app.models.ticket import Ticket
from app.models.booking import Booking
from app.models.event_image import EventImage
from app.models.payment import Payment
from app.models.seat import Seat
from app.models.wishlist import Wishlist
from app.models.notification import Notification
from app.models.message import Message
from app.models.review import Review
from app.models.coupon import Coupon
from app.models.refund import Refund
from app.models.sponsorship import Sponsor, SponsorPackage, Sponsorship
from app.models.audit_log import AuditLog

# Import all routers
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.events import router as events_router
from app.api.tickets import router as tickets_router
from app.api.categories import router as categories_router
from app.api.bookings import router as bookings_router
from app.api.search import router as search_router
from app.api.dashboard import router as dashboard_router
from app.api.media import router as media_router
from app.api.payments import router as payments_router
from app.api.checkin import router as checkin_router
from app.api.seats import router as seats_router
from app.api.wishlist import router as wishlist_router
from app.api.notifications import router as notifications_router
from app.api.messages import router as messages_router
from app.api.reviews import router as reviews_router
from app.api.admin import router as admin_router
from app.api.coupons import router as coupons_router
from app.api.refunds import router as refunds_router
from app.api.ai_assistant import router as ai_router
from app.api.sponsorships import router as sponsorships_router
from app.api.reports import router as reports_router
from app.api.audit_logs import router as audit_logs_router


DEFAULT_CATEGORIES = [
    {"name": "Music", "description": "Concerts, festivals, and live music events"},
    {"name": "Technology", "description": "Tech conferences, hackathons, and workshops"},
    {"name": "Business", "description": "Networking, seminars, and corporate events"},
    {"name": "Sports", "description": "Tournaments, marathons, and sporting events"},
    {"name": "Education", "description": "Classes, lectures, and learning workshops"},
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    print("Database tables created/verified.")

    # Add new columns if they don't exist (create_all doesn't modify existing tables)
    with engine.connect() as conn:
        from sqlalchemy import text, inspect
        inspector = inspect(engine)
        # Add is_verified to users
        user_cols = [c["name"] for c in inspector.get_columns("users")]
        if "is_verified" not in user_cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE"))
            conn.commit()
            print("Added is_verified column to users.")
        # Add is_featured to events
        event_cols = [c["name"] for c in inspector.get_columns("events")]
        if "is_featured" not in event_cols:
            conn.execute(text("ALTER TABLE events ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE"))
            conn.commit()
            print("Added is_featured column to events.")
            
        # Add streaming fields to events
        if "stream_url" not in event_cols:
            conn.execute(text("ALTER TABLE events ADD COLUMN stream_url VARCHAR(1000) NULL"))
            conn.execute(text("ALTER TABLE events ADD COLUMN stream_platform VARCHAR(50) NULL"))
            conn.execute(text("ALTER TABLE events ADD COLUMN is_streaming_live BOOLEAN NOT NULL DEFAULT FALSE"))
            conn.commit()
            print("Added streaming columns to events.")
            
        # Add new columns to bookings table for modules 11-15
        if "bookings" in inspector.get_table_names():
            booking_cols = [c["name"] for c in inspector.get_columns("bookings")]
            if "payment_status" not in booking_cols:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING'"))
                conn.commit()
                print("Added payment_status column to bookings.")
            if "qr_code" not in booking_cols:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN qr_code VARCHAR(1000) NULL"))
                conn.commit()
                print("Added qr_code column to bookings.")
            if "checked_in_at" not in booking_cols:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN checked_in_at DATETIME NULL"))
                conn.commit()
                print("Added checked_in_at column to bookings.")
            if "seat_id" not in booking_cols:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN seat_id INTEGER NULL"))
                conn.commit()
                print("Added seat_id column to bookings.")
            if "discount_amount" not in booking_cols:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN discount_amount FLOAT NOT NULL DEFAULT 0.0"))
                conn.commit()
                print("Added discount_amount column to bookings.")

    # Seed default categories
    db = SessionLocal()
    try:
        for cat_data in DEFAULT_CATEGORIES:
            existing = db.query(Category).filter(Category.name == cat_data["name"]).first()
            if not existing:
                db.add(Category(**cat_data))
        db.commit()
        print("Default categories seeded.")
    except Exception as e:
        print(f"Category seeding error: {e}")
        db.rollback()
    finally:
        db.close()

    yield


settings = get_settings()

app = FastAPI(
    title="EventSphere Pro API",
    description="Event Management & Ticket Booking Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
import os
uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(events_router)
app.include_router(tickets_router)
app.include_router(categories_router)
app.include_router(bookings_router)
app.include_router(search_router)
app.include_router(dashboard_router)
app.include_router(media_router)
app.include_router(payments_router)
app.include_router(checkin_router)
app.include_router(seats_router)
app.include_router(wishlist_router)
app.include_router(notifications_router)
app.include_router(messages_router)
app.include_router(reviews_router)
app.include_router(admin_router)
app.include_router(coupons_router)
app.include_router(refunds_router)
app.include_router(ai_router)
app.include_router(sponsorships_router)
app.include_router(reports_router)
app.include_router(audit_logs_router)

@app.get("/")
def root():
    return {"message": "Welcome to EventSphere Pro API", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
