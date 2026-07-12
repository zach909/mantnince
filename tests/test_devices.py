from tests.conftest import register_and_auth


def test_register_and_list_devices(client):
    _, headers = register_and_auth(client)

    r = client.post(
        "/api/devices/register",
        headers=headers,
        json={"device_info": {"name": "My Laptop", "type": "linux", "platform": "Linux"}},
    )
    assert r.status_code == 201, r.text
    device_id = r.json()["device_id"]
    assert device_id

    r = client.get("/api/devices", headers=headers)
    assert r.status_code == 200
    devices = r.json()["devices"]
    assert len(devices) == 1
    assert devices[0]["id"] == device_id
    assert devices[0]["status"] == "online"


def test_devices_are_scoped_per_user(client):
    _, alice = register_and_auth(client)
    client.post(
        "/api/devices/register",
        headers=alice,
        json={"device_info": {"name": "Alice PC", "type": "windows_pc"}},
    )

    _, bob = register_and_auth(client, username="bob", email="bob@example.com")
    r = client.get("/api/devices", headers=bob)
    assert r.json()["devices"] == []
