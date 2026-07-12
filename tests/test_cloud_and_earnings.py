from tests.conftest import register_and_auth


def test_cloud_connect_records_intent_without_accessing_data(client):
    _, headers = register_and_auth(client)
    r = client.post("/api/cloud/connect", headers=headers, json={"provider": "google"})
    assert r.status_code == 200
    body = r.json()
    # Intent recorded, but not actually connected until real OAuth is wired up.
    assert body["connected"] is False
    assert "consent" in body["note"].lower()


def test_cloud_connect_rejects_unknown_provider(client):
    _, headers = register_and_auth(client)
    r = client.post("/api/cloud/connect", headers=headers, json={"provider": "aol"})
    assert r.status_code == 400


def test_cloud_status_shape(client):
    _, headers = register_and_auth(client)
    r = client.get("/api/cloud/status", headers=headers)
    assert r.status_code == 200
    providers = r.json()["providers"]
    assert set(providers) == {"google", "microsoft"}
    assert providers["google"]["connected"] is False


def test_earnings_ledger_is_mock(client):
    _, headers = register_and_auth(client)
    r = client.post(
        "/api/ads/record",
        headers=headers,
        json={"ad_id": "ad-1", "duration_seconds": 30, "was_clicked": False},
    )
    assert r.status_code == 200
    assert r.json()["earnings"] == 0.15

    r = client.get("/api/ads/earnings", headers=headers)
    body = r.json()
    assert body["ads_watched"] == 1
    assert body["total"] == 0.15
    assert "mock" in body["note"].lower()
