from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.roles import require_role
from backend.app.database import get_db
from backend.app.models import Notification, User


router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"],
)

ALLOWED_ROLES = ("STUDENT", "FACULTY", "HOD", "ADMIN")


def serialize_notification(notification: Notification):
    return {
        "notification_id": notification.notification_id,
        "user_id": notification.user_id,
        "leave_id": notification.leave_id,
        "notification_type": notification.notification_type,
        "title": notification.title,
        "message": notification.message,
        "is_read": bool(notification.is_read),
        "created_at": notification.created_at,
    }


@router.get("")
def get_notifications(
    current_user: User = Depends(require_role(*ALLOWED_ROLES)),
    db: Session = Depends(get_db),
):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    unread_count = sum(
        1 for notification in notifications
        if not notification.is_read
    )

    return {
        "count": len(notifications),
        "unread_count": unread_count,
        "notifications": [
            serialize_notification(notification)
            for notification in notifications
        ],
    }


@router.patch("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(require_role(*ALLOWED_ROLES)),
    db: Session = Depends(get_db),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.notification_id == notification_id,
            Notification.user_id == current_user.user_id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    notification.is_read = True
    db.commit()
    db.refresh(notification)

    return {
        "message": "Notification marked as read",
        "notification": serialize_notification(notification),
    }


@router.patch("/read-all")
def mark_all_notifications_as_read(
    current_user: User = Depends(require_role(*ALLOWED_ROLES)),
    db: Session = Depends(get_db),
):
    updated_count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.user_id,
            Notification.is_read.is_(False),
        )
        .update(
            {Notification.is_read: True},
            synchronize_session=False,
        )
    )

    db.commit()

    return {
        "message": "All notifications marked as read",
        "updated_count": updated_count,
        "unread_count": 0,
    }
