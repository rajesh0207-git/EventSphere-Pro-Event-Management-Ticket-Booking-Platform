from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
import json
from fastapi import Request

def log_audit(
    db: Session,
    action: str,
    user_id: int = None,
    resource_type: str = None,
    resource_id: int = None,
    details: str = None,
    request: Request = None
):
    ip_address = None
    if request:
        # Simplistic way to get IP, might need adjustments based on proxy setup
        ip_address = request.client.host if request.client else None
        
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address
    )
    db.add(audit_log)
    db.commit()
    return audit_log
