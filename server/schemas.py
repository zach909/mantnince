"""Request shapes and validation — plain dataclasses, no pydantic.

Each ``parse_*`` function validates a decoded JSON ``dict`` and returns a
small dataclass, raising :class:`server.core.http.ValidationError` (HTTP 422,
mirroring FastAPI's default) on malformed input. No test in this project
asserts on the exact status code for malformed input, so 422 is a judgment
call made for parity with the previous FastAPI behavior.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from server.core.http import ValidationError

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _require_str(data: dict, key: str, *, min_length: int = 0) -> str:
    value = data.get(key)
    if not isinstance(value, str) or len(value) < min_length:
        raise ValidationError(f"'{key}' must be a string with length >= {min_length}")
    return value


def _optional_str(data: dict, key: str, default: str = "") -> str:
    value = data.get(key, default)
    if value is None:
        return default
    if not isinstance(value, str):
        raise ValidationError(f"'{key}' must be a string")
    return value


# ---- Auth ----


@dataclass
class RegisterRequest:
    username: str
    email: str
    password: str


def parse_register_request(data: dict) -> RegisterRequest:
    username = _require_str(data, "username", min_length=1)
    email = _require_str(data, "email", min_length=1)
    if not _EMAIL_RE.match(email):
        raise ValidationError("'email' must be a valid email address")
    password = _require_str(data, "password", min_length=8)
    return RegisterRequest(username=username, email=email, password=password)


# ---- Devices ----


@dataclass
class DeviceInfo:
    name: str
    type: str
    platform: str = ""
    os_version: str = ""


def parse_device_register_request(data: dict) -> DeviceInfo:
    info = data.get("device_info")
    if not isinstance(info, dict):
        raise ValidationError("'device_info' is required and must be an object")
    name = _require_str(info, "name", min_length=1)
    type_ = _require_str(info, "type", min_length=1)
    platform = _optional_str(info, "platform")
    os_version = _optional_str(info, "os_version")
    return DeviceInfo(name=name, type=type_, platform=platform, os_version=os_version)


# ---- Cloud ----


def parse_cloud_connect_request(data: dict) -> str:
    return _require_str(data, "provider", min_length=1)


# ---- Earnings (mock) ----


@dataclass
class AdRecordRequest:
    ad_id: str
    duration_seconds: int = 0
    was_clicked: bool = False


def parse_ad_record_request(data: dict) -> AdRecordRequest:
    ad_id = _require_str(data, "ad_id", min_length=1)

    duration = data.get("duration_seconds", 0)
    if isinstance(duration, bool) or not isinstance(duration, int):
        raise ValidationError("'duration_seconds' must be an integer")

    was_clicked = data.get("was_clicked", False)
    if not isinstance(was_clicked, bool):
        raise ValidationError("'was_clicked' must be a boolean")

    return AdRecordRequest(ad_id=ad_id, duration_seconds=duration, was_clicked=was_clicked)
