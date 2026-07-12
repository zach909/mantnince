"""Pytest fixtures.

Environment is configured *before* the application is imported so that the
config singleton, engine, and models all bind to a throwaway SQLite database
and storage directory. Tables are recreated per test for isolation.
"""

import os
import tempfile

# Must run before any `server.*` import so settings pick these up.
_TMPDIR = tempfile.mkdtemp(prefix="ubs-tests-")
os.environ["UBS_DATABASE_URL"] = f"sqlite:///{os.path.join(_TMPDIR, 'test.db')}"
os.environ["UBS_STORAGE_DIR"] = os.path.join(_TMPDIR, "storage")
os.environ["UBS_SECRET_KEY"] = "test-secret"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from server.core.database import Base, engine  # noqa: E402
from server.main import app  # noqa: E402
import server.models  # noqa: E402,F401  (register models on the metadata)


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)


def register_and_auth(client, username="alice", email="alice@example.com", password="password123"):
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
