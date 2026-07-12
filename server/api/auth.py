"""Authentication endpoints: register and token issuance."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from server.core.database import get_db
from server.core.security import create_access_token, hash_password, verify_password
from server.models import User
from server.schemas import RegisterRequest, RegisterResponse, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> RegisterResponse:
    existing = db.scalar(
        select(User).where((User.username == payload.username) | (User.email == payload.email))
    )
    if existing is not None:
        raise HTTPException(status_code=409, detail="Username or email already registered")

    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return RegisterResponse(user_id=user.id)


@router.post("/token", response_model=TokenResponse)
def token(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> TokenResponse:
    """OAuth2 password-grant token endpoint.

    ``username`` may be either the account username or email.
    """
    user = db.scalar(
        select(User).where((User.username == form.username) | (User.email == form.username))
    )
    if user is None or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return TokenResponse(token=create_access_token(user.id), user_id=user.id)
