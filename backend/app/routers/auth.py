from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.roles import require_role
from backend.app.core.dependencies import get_current_user
from backend.app.database import get_db
from backend.app.models import User
from backend.app.schemas.auth import LoginRequest, LoginResponse
from backend.app.core.security import (
    create_access_token,
    verify_password,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


@router.post(
    "/login",
    response_model=LoginResponse
)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == login_data.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    if not verify_password(
        login_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token_data = {
        "sub": str(user.user_id),
        "role": user.role,
        "email": user.email,
    }

    access_token = create_access_token(token_data)

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.user_id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
    )
@router.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return {
        "user_id": current_user.user_id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "department_id": current_user.department_id,
        "is_active": current_user.is_active,
    }
@router.get("/student-only")
def student_only(
    current_user: User = Depends(require_role("STUDENT")),
):
    return {
        "message": "Student access granted",
        "user": current_user.full_name,
        "role": current_user.role,
    }


@router.get("/faculty-only")
def faculty_only(
    current_user: User = Depends(require_role("FACULTY")),
):
    return {
        "message": "Faculty access granted",
        "user": current_user.full_name,
        "role": current_user.role,
    }


@router.get("/management-only")
def management_only(
    current_user: User = Depends(require_role("HOD", "ADMIN")),
):
    return {
        "message": "Management access granted",
        "user": current_user.full_name,
        "role": current_user.role,
    }