"""Pydantic request/response schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---- Auth ----
class RegisterRequest(BaseModel):
    username: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=8)


class RegisterResponse(BaseModel):
    user_id: str
    message: str = "User registered"


class TokenResponse(BaseModel):
    token: str
    user_id: str
    token_type: str = "bearer"


# ---- Devices ----
class DeviceInfo(BaseModel):
    name: str
    type: str
    platform: str = ""
    os_version: str = ""


class DeviceRegisterRequest(BaseModel):
    device_info: DeviceInfo


class DeviceRegisterResponse(BaseModel):
    device_id: str
    message: str = "Device registered"


class DeviceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    type: str
    status: str


class DeviceListResponse(BaseModel):
    devices: list[DeviceOut]


# ---- Cloud ----
class CloudConnectRequest(BaseModel):
    provider: str


class CloudConnectResponse(BaseModel):
    connected: bool
    provider: str
    note: str


class CloudStatusResponse(BaseModel):
    providers: dict[str, dict]


# ---- Backup ----
class CaptureData(BaseModel):
    filename: str
    file_hash: str
    file_size: int


class BackupStatusResponse(BaseModel):
    total_backups: int
    total_size_gb: float
    storage_saved_gb: float
    last_backup: datetime | None


class UploadResponse(BaseModel):
    item_id: str
    blob_hash: str
    was_deduplicated: bool
    storage_saved_bytes: int


# ---- Earnings (mock) ----
class AdRecordRequest(BaseModel):
    ad_id: str
    duration_seconds: int = 0
    was_clicked: bool = False


class AdRecordResponse(BaseModel):
    earnings: float
    total_earnings: float


class EarningsResponse(BaseModel):
    total: float
    ads_watched: int
    note: str
