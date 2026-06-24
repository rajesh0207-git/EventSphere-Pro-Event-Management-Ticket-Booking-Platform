from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import (
    UserRegister, UserLogin, TokenResponse,
    ForgotPasswordRequest, ResetPasswordRequest,
)
from app.utils.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    generate_reset_token,
)
from app.utils.email import send_reset_email
from app.utils.audit import log_audit

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Validate role
    try:
        role = UserRole(data.role.upper())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be ATTENDEE, ORGANIZER, or ADMIN",
        )

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit(db, action="USER_REGISTER", user_id=user.id, resource_type="USER", resource_id=user.id, details=f"User {user.email} registered")

    return {
        "message": "User registered successfully",
        "user_id": user.id,
        "email": user.email,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
    }


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        log_audit(db, action="LOGIN_FAILED", details=f"Failed login attempt for email {data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    if not verify_password(data.password, user.password_hash):
        log_audit(db, action="LOGIN_FAILED", user_id=user.id, details=f"Failed login attempt for user {user.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    role_val = user.role.value if hasattr(user.role, 'value') else str(user.role)
    access_token = create_access_token({"sub": str(user.id), "role": role_val})
    refresh_token = create_refresh_token({"sub": str(user.id), "role": role_val})

    log_audit(db, action="USER_LOGIN", user_id=user.id, resource_type="USER", resource_id=user.id, details=f"User {user.email} logged in")

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/forgot-password", response_model=dict)
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        # Don't reveal if email exists or not
        return {"message": "If the email exists, a reset link has been sent"}

    reset_token = generate_reset_token()
    user.reset_token = reset_token
    db.commit()

    send_reset_email(user.email, reset_token)

    return {"message": "If the email exists, a reset link has been sent"}


@router.post("/reset-password", response_model=dict)
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == data.token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    user.password_hash = hash_password(data.new_password)
    user.reset_token = None
    db.commit()

    return {"message": "Password reset successfully"}
