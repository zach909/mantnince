from tests.conftest import register_and_auth


def test_register_and_login(client):
    user_id, headers = register_and_auth(client)
    assert user_id
    assert headers["Authorization"].startswith("Bearer ")


def test_duplicate_registration_rejected(client):
    register_and_auth(client)
    r = client.post(
        "/api/auth/register",
        json={"username": "alice", "email": "alice@example.com", "password": "password123"},
    )
    assert r.status_code == 409


def test_wrong_password_rejected(client):
    register_and_auth(client)
    r = client.post("/api/auth/token", data={"username": "alice", "password": "wrong"})
    assert r.status_code == 401


def test_protected_route_requires_auth(client):
    r = client.get("/api/devices")
    assert r.status_code == 401
