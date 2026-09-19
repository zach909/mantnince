"""A tiny stdlib-only HTTP framework: request/response types, a static-path
router, CORS handling, and body parsing for JSON, form-urlencoded, and
multipart/form-data — replacing FastAPI/Starlette for this project.

All routes in this project are static paths (no path parameters), so the
router is just a ``{(method, path): handler}`` dict.
"""

from __future__ import annotations

import json as json_module
import traceback
from dataclasses import dataclass, field
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Callable
from urllib.parse import parse_qsl, urlsplit

from server.core.config import Settings
from server.core.database import get_db

ALLOWED_ORIGINS = {"http://localhost:3100", "http://127.0.0.1:3100"}
ALLOWED_METHODS = "GET, POST, OPTIONS"
ALLOWED_HEADERS = "Authorization, Content-Type"


class ApiError(Exception):
    """Raised by a handler to short-circuit with an HTTP error response."""

    def __init__(self, status_code: int, detail: str, headers: dict | None = None):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail
        self.headers = headers or {}


class ValidationError(ApiError):
    """Malformed/invalid request body or fields. Mirrors FastAPI's default 422."""

    def __init__(self, detail: str):
        super().__init__(422, detail)


@dataclass
class Request:
    method: str
    path: str
    headers: Any  # email.message.Message-like: case-insensitive .get(name)
    query: dict
    body: bytes
    settings: Settings
    db: Any = None

    def json(self) -> dict:
        if not self.body:
            return {}
        try:
            data = json_module.loads(self.body.decode("utf-8"))
        except (ValueError, UnicodeDecodeError) as exc:
            raise ValidationError("Invalid JSON body") from exc
        if not isinstance(data, dict):
            raise ValidationError("JSON body must be an object")
        return data

    def form(self) -> dict:
        try:
            text = self.body.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise ValidationError("Invalid form body") from exc
        return dict(parse_qsl(text, keep_blank_values=True))

    def multipart(self) -> tuple[dict, dict]:
        content_type = self.headers.get("Content-Type", "")
        boundary = _extract_boundary(content_type)
        if boundary is None:
            raise ValidationError("Expected multipart/form-data with a boundary")
        return _parse_multipart(self.body, boundary)


# ---- multipart/form-data parsing (hand-rolled, no cgi/email dependency) ----


def _extract_boundary(content_type: str) -> str | None:
    if not content_type or "multipart/form-data" not in content_type:
        return None
    for part in content_type.split(";"):
        part = part.strip()
        if part.startswith("boundary="):
            boundary = part[len("boundary="):]
            return _strip_quotes(boundary)
    return None


def _strip_quotes(value: str) -> str:
    if len(value) >= 2 and value[0] == '"' and value[-1] == '"':
        return value[1:-1]
    return value


def _parse_part_headers(blob: bytes) -> dict:
    text = blob.decode("utf-8", errors="replace")
    headers: dict[str, str] = {}
    for line in text.replace("\r\n", "\n").split("\n"):
        if not line.strip() or ":" not in line:
            continue
        key, value = line.split(":", 1)
        headers[key.strip().lower()] = value.strip()
    return headers


def _parse_content_disposition(value: str) -> tuple[str | None, str | None]:
    name: str | None = None
    filename: str | None = None
    for part in value.split(";"):
        part = part.strip()
        if part.startswith("name="):
            name = _strip_quotes(part[len("name="):])
        elif part.startswith("filename="):
            filename = _strip_quotes(part[len("filename="):])
    return name, filename


def _parse_multipart(body: bytes, boundary: str) -> tuple[dict, dict]:
    """Return ``(fields, files)``.

    ``fields`` maps field name -> decoded string value. ``files`` maps field
    name -> ``{"filename": str, "content": bytes, "content_type": str}``.
    """
    delimiter = b"--" + boundary.encode("utf-8")
    fields: dict[str, str] = {}
    files: dict[str, dict] = {}

    for raw_part in body.split(delimiter):
        if not raw_part or raw_part in (b"--", b"--\r\n", b"--\n") or raw_part.startswith(b"--"):
            continue

        part = raw_part
        if part.startswith(b"\r\n"):
            part = part[2:]
        elif part.startswith(b"\n"):
            part = part[1:]
        if part.endswith(b"\r\n"):
            part = part[:-2]
        elif part.endswith(b"\n"):
            part = part[:-1]

        if b"\r\n\r\n" in part:
            header_blob, content = part.split(b"\r\n\r\n", 1)
        elif b"\n\n" in part:
            header_blob, content = part.split(b"\n\n", 1)
        else:
            continue

        headers = _parse_part_headers(header_blob)
        disposition = headers.get("content-disposition", "")
        name, filename = _parse_content_disposition(disposition)
        if name is None:
            continue

        if filename is not None:
            files[name] = {
                "filename": filename,
                "content": content,
                "content_type": headers.get("content-type", "application/octet-stream"),
            }
        else:
            fields[name] = content.decode("utf-8", errors="replace")

    return fields, files


# ---- Router ----


Handler = Callable[[Request], tuple]


class Router:
    def __init__(self, routes: dict[tuple[str, str], Handler]):
        self.routes = dict(routes)

    def resolve(self, method: str, path: str) -> Handler:
        handler = self.routes.get((method, path))
        if handler is not None:
            return handler
        if any(p == path for (_m, p) in self.routes):
            raise ApiError(405, "Method Not Allowed")
        raise ApiError(404, "Not Found")


# ---- Server / request handling ----


def make_handler_class(router: Router, settings: Settings):
    class UBSRequestHandler(BaseHTTPRequestHandler):
        server_version = "UBS/0.1"

        def log_message(self, format: str, *args) -> None:  # noqa: A002 - stdlib signature
            pass  # keep test/server output quiet

        def _cors_headers(self) -> dict:
            origin = self.headers.get("Origin")
            if origin not in ALLOWED_ORIGINS:
                return {}
            return {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": ALLOWED_METHODS,
                "Access-Control-Allow-Headers": ALLOWED_HEADERS,
                "Vary": "Origin",
            }

        def _send(self, status: int, body: Any, extra_headers: dict | None = None) -> None:
            if isinstance(body, (dict, list)):
                payload = json_module.dumps(body).encode("utf-8")
                content_type = "application/json"
            elif isinstance(body, str):
                payload = body.encode("utf-8")
                content_type = "text/plain; charset=utf-8"
            elif isinstance(body, bytes):
                payload = body
                content_type = "application/octet-stream"
            else:
                payload = b""
                content_type = "application/octet-stream"

            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(payload)))
            for key, value in self._cors_headers().items():
                self.send_header(key, value)
            if extra_headers:
                for key, value in extra_headers.items():
                    self.send_header(key, value)
            self.end_headers()
            if payload:
                self.wfile.write(payload)

        def do_OPTIONS(self) -> None:  # CORS preflight
            self.send_response(200)
            for key, value in self._cors_headers().items():
                self.send_header(key, value)
            self.send_header("Content-Length", "0")
            self.end_headers()

        def _read_body(self) -> bytes:
            length = int(self.headers.get("Content-Length") or 0)
            return self.rfile.read(length) if length else b""

        def _dispatch(self, method: str) -> None:
            parsed = urlsplit(self.path)
            path = parsed.path
            query = dict(parse_qsl(parsed.query))
            body = self._read_body()
            request = Request(
                method=method,
                path=path,
                headers=self.headers,
                query=query,
                body=body,
                settings=settings,
            )
            extra_headers: dict | None = None
            try:
                handler = router.resolve(method, path)
                with get_db(settings) as conn:
                    request.db = conn
                    result = handler(request)
                if isinstance(result, tuple) and len(result) == 3:
                    status, response_body, extra_headers = result
                else:
                    status, response_body = result
            except ApiError as exc:
                status, response_body, extra_headers = exc.status_code, {"detail": exc.detail}, exc.headers
            except Exception:  # noqa: BLE001 - never crash the server thread
                traceback.print_exc()
                status, response_body = 500, {"detail": "Internal Server Error"}
            self._send(status, response_body, extra_headers)

        def do_GET(self) -> None:
            self._dispatch("GET")

        def do_POST(self) -> None:
            self._dispatch("POST")

    return UBSRequestHandler


def build_http_server(routes: dict, settings: Settings, host: str = "127.0.0.1", port: int = 8000) -> ThreadingHTTPServer:
    router = Router(routes)
    handler_class = make_handler_class(router, settings)
    return ThreadingHTTPServer((host, port), handler_class)
