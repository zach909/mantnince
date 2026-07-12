"""Device registration and listing."""

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from server.core.database import get_db
from server.core.security import get_current_user
from server.models import Device, User
from server.schemas import (
    DeviceListResponse,
    DeviceOut,
    DeviceRegisterRequest,
    DeviceRegisterResponse,
)

router = APIRouter(prefix="/api/devices", tags=["devices"])


@router.post("/register", response_model=DeviceRegisterResponse, status_code=status.HTTP_201_CREATED)
def register_device(
    payload: DeviceRegisterRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DeviceRegisterResponse:
    info = payload.device_info
    device = Device(
        user_id=user.id,
        name=info.name,
        type=info.type,
        platform=info.platform,
        os_version=info.os_version,
        status="online",
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return DeviceRegisterResponse(device_id=device.id)


@router.get("", response_model=DeviceListResponse)
def list_devices(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DeviceListResponse:
    devices = db.scalars(select(Device).where(Device.user_id == user.id)).all()
    return DeviceListResponse(devices=[DeviceOut.model_validate(d) for d in devices])
