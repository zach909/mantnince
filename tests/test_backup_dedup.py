from tests.conftest import register_and_auth


def _upload(client, headers, filename, content: bytes):
    return client.post(
        "/api/backup/upload",
        headers=headers,
        files={"file": (filename, content, "application/octet-stream")},
    )


def test_identical_content_is_deduplicated(client):
    _, headers = register_and_auth(client)
    payload = b"hello world" * 1000

    r1 = _upload(client, headers, "a.txt", payload)
    assert r1.status_code == 200, r1.text
    assert r1.json()["was_deduplicated"] is False
    assert r1.json()["storage_saved_bytes"] == 0

    # Same bytes, different name -> deduplicated, storage saved.
    r2 = _upload(client, headers, "b.txt", payload)
    assert r2.json()["was_deduplicated"] is True
    assert r2.json()["storage_saved_bytes"] == len(payload)
    assert r1.json()["blob_hash"] == r2.json()["blob_hash"]


def test_different_content_is_not_deduplicated(client):
    _, headers = register_and_auth(client)
    r1 = _upload(client, headers, "a.txt", b"content one")
    r2 = _upload(client, headers, "b.txt", b"content two")
    assert r1.json()["blob_hash"] != r2.json()["blob_hash"]
    assert r2.json()["was_deduplicated"] is False


def test_backup_status_accounting(client):
    _, headers = register_and_auth(client)
    payload = b"x" * 2048
    _upload(client, headers, "one.bin", payload)
    _upload(client, headers, "two.bin", payload)  # duplicate

    r = client.get("/api/backup/status", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert body["total_backups"] == 2
    # One physical copy stored, one saved.
    assert body["storage_saved_gb"] == round(2048 / (1024**3), 4)
    assert body["last_backup"] is not None
