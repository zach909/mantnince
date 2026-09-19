"""Shared test infrastructure (stdlib ``unittest``, no pytest).

Provides:

* ``TestClient`` — a tiny HTTP client (``http.client``-based) with
  ``.get()``/``.post()`` methods, replacing ``fastapi.testclient.TestClient``.
* ``UBSTestCase`` — a base ``unittest.TestCase`` that boots a fresh server
  bound to an ephemeral port, backed by a throwaway temp-directory sqlite
  database, once per test (``setUp``/``tearDown``), giving the same per-test
  isolation the old ``Base.metadata.drop_all``/``create_all`` fixture gave.
* ``register_and_auth()`` — unchanged helper semantics from the old fixture
  module: registers a user and returns ``(user_id, auth_headers)``.
"""

from __future__ import annotations

import http.client
import json as json_module
import os
import shutil
import tempfile
import threading
import unittest
import uuid
from urllib.parse import urlencode


class Response:
    def __init__(self, status: int, headers, body: bytes):
        self.status_code = status
        self.headers = headers
        self._body = body

    def json(self):
        return json_module.loads(self._body.decode("utf-8"))

    @property
    def text(self) -> str:
        return self._body.decode("utf-8", errors="replace")


def _encode_multipart(fields: dict, files: dict) -> tuple[bytes, str]:
    boundary = uuid.uuid4().hex
    lines: list[bytes] = []

    for name, value in (fields or {}).items():
        lines.append(f"--{boundary}".encode())
        lines.append(f'Content-Disposition: form-data; name="{name}"'.encode())
        lines.append(b"")
        lines.append(str(value).encode("utf-8"))

    for name, file_tuple in (files or {}).items():
        filename, content, content_type = file_tuple
        if isinstance(content, str):
            content = content.encode("utf-8")
        lines.append(f"--{boundary}".encode())
        lines.append(
            f'Content-Disposition: form-data; name="{name}"; filename="{filename}"'.encode()
        )
        lines.append(f"Content-Type: {content_type}".encode())
        lines.append(b"")
        lines.append(content)

    lines.append(f"--{boundary}--".encode())
    lines.append(b"")
    body = b"\r\n".join(lines)
    return body, f"multipart/form-data; boundary={boundary}"


class TestClient:
    """Minimal real-HTTP test client (stdlib ``http.client`` only)."""

    def __init__(self, host: str, port: int):
        self.host = host
        self.port = port

    def _request(self, method: str, path: str, headers: dict | None = None, body: bytes = b"") -> Response:
        conn = http.client.HTTPConnection(self.host, self.port, timeout=10)
        try:
            conn.request(method, path, body=body, headers=headers or {})
            resp = conn.getresponse()
            data = resp.read()
            return Response(resp.status, resp.headers, data)
        finally:
            conn.close()

    def get(self, path: str, headers: dict | None = None) -> Response:
        return self._request("GET", path, headers=headers)

    def post(
        self,
        path: str,
        json: dict | None = None,
        data: dict | None = None,
        files: dict | None = None,
        headers: dict | None = None,
    ) -> Response:
        headers = dict(headers or {})
        if files is not None:
            body, content_type = _encode_multipart(data or {}, files)
            headers["Content-Type"] = content_type
        elif json is not None:
            body = json_module.dumps(json).encode("utf-8")
            headers["Content-Type"] = "application/json"
        elif data is not None:
            body = urlencode(data).encode("utf-8")
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            body = b""
        return self._request("POST", path, headers=headers, body=body)


class UBSTestCase(unittest.TestCase):
    """Boots a fresh server + throwaway sqlite db/storage dir per test."""

    def setUp(self) -> None:
        self._tmpdir = tempfile.mkdtemp(prefix="ubs-tests-")
        os.environ["UBS_DATABASE_URL"] = f"sqlite:///{os.path.join(self._tmpdir, 'test.db')}"
        os.environ["UBS_STORAGE_DIR"] = os.path.join(self._tmpdir, "storage")
        os.environ["UBS_SECRET_KEY"] = "test-secret"

        # Imported here (rather than at module scope) so the env vars above
        # are always in place before settings are read for this test's server.
        from server.core.config import get_settings
        from server.main import build_server

        settings = get_settings()
        self._server = build_server(host="127.0.0.1", port=0, settings=settings)
        self._thread = threading.Thread(target=self._server.serve_forever, daemon=True)
        self._thread.start()

        host, port = self._server.server_address
        self.client = TestClient(host, port)

    def tearDown(self) -> None:
        self._server.shutdown()
        self._server.server_close()
        self._thread.join(timeout=5)
        shutil.rmtree(self._tmpdir, ignore_errors=True)


def register_and_auth(client: TestClient, username="alice", email="alice@example.com", password="password123"):
    r = client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": password},
    )
    assert r.status_code == 201, r.text
    user_id = r.json()["user_id"]

    r = client.post("/api/auth/token", data={"username": username, "password": password})
    assert r.status_code == 200, r.text
    token = r.json()["token"]
    return user_id, {"Authorization": f"Bearer {token}"}
