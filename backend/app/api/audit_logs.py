from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit_log import AuditLogListResponse
from app.api.deps import require_admin

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=AuditLogListResponse)
def get_audit_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    query = db.query(AuditLog)
    total = query.count()
    logs = query.order_by(desc(AuditLog.created_at)).offset((page - 1) * per_page).limit(per_page).all()
    
    # Map user emails manually if loaded
    formatted_logs = []
    for log in logs:
        log_dict = log.__dict__.copy()
        log_dict["user_email"] = log.user.email if log.user else "Anonymous"
        formatted_logs.append(log_dict)
        
    return AuditLogListResponse(
        items=formatted_logs,
        total=total,
        page=page,
        per_page=per_page
    )
