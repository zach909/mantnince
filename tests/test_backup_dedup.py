import unittest

from tests.conftest import UBSTestCase, register_and_auth


def _upload(client, headers, filename, content: bytes):
    return client.post(
        "/api/backup/upload",
        headers=headers,
        files={"file": (filename, content, "application/octet-stream")},
    )


class BackupDedupTests(UBSTestCase):
    def test_identical_content_is_deduplicated(self):
        _, headers = register_and_auth(self.client)
        payload = b"hello world" * 1000

        r1 = _upload(self.client, headers, "a.txt", payload)
        self.assertEqual(r1.status_code, 200, r1.text)
        self.assertFalse(r1.json()["was_deduplicated"])
        self.assertEqual(r1.json()["storage_saved_bytes"], 0)

        # Same bytes, different name -> deduplicated, storage saved.
        r2 = _upload(self.client, headers, "b.txt", payload)
        self.assertTrue(r2.json()["was_deduplicated"])
        self.assertEqual(r2.json()["storage_saved_bytes"], len(payload))
        self.assertEqual(r1.json()["blob_hash"], r2.json()["blob_hash"])

    def test_different_content_is_not_deduplicated(self):
        _, headers = register_and_auth(self.client)
        r1 = _upload(self.client, headers, "a.txt", b"content one")
        r2 = _upload(self.client, headers, "b.txt", b"content two")
        self.assertNotEqual(r1.json()["blob_hash"], r2.json()["blob_hash"])
        self.assertFalse(r2.json()["was_deduplicated"])

    def test_backup_status_accounting(self):
        _, headers = register_and_auth(self.client)
        payload = b"x" * 2048
        _upload(self.client, headers, "one.bin", payload)
        _upload(self.client, headers, "two.bin", payload)  # duplicate

        r = self.client.get("/api/backup/status", headers=headers)
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertEqual(body["total_backups"], 2)
        # One physical copy stored, one saved.
        self.assertEqual(body["storage_saved_gb"], round(2048 / (1024**3), 4))
        self.assertIsNotNone(body["last_backup"])


if __name__ == "__main__":
    unittest.main()
