import unittest

from tests.conftest import UBSTestCase, register_and_auth


class CloudAndEarningsTests(UBSTestCase):
    def test_cloud_connect_records_intent_without_accessing_data(self):
        _, headers = register_and_auth(self.client)
        r = self.client.post("/api/cloud/connect", headers=headers, json={"provider": "google"})
        self.assertEqual(r.status_code, 200)
        body = r.json()
        # Intent recorded, but not actually connected until real OAuth is wired up.
        self.assertFalse(body["connected"])
        self.assertIn("consent", body["note"].lower())

    def test_cloud_connect_rejects_unknown_provider(self):
        _, headers = register_and_auth(self.client)
        r = self.client.post("/api/cloud/connect", headers=headers, json={"provider": "aol"})
        self.assertEqual(r.status_code, 400)

    def test_cloud_status_shape(self):
        _, headers = register_and_auth(self.client)
        r = self.client.get("/api/cloud/status", headers=headers)
        self.assertEqual(r.status_code, 200)
        providers = r.json()["providers"]
        self.assertEqual(set(providers), {"google", "microsoft"})
        self.assertFalse(providers["google"]["connected"])

    def test_earnings_ledger_is_mock(self):
        _, headers = register_and_auth(self.client)
        r = self.client.post(
            "/api/ads/record",
            headers=headers,
            json={"ad_id": "ad-1", "duration_seconds": 30, "was_clicked": False},
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["earnings"], 0.15)

        r = self.client.get("/api/ads/earnings", headers=headers)
        body = r.json()
        self.assertEqual(body["ads_watched"], 1)
        self.assertEqual(body["total"], 0.15)
        self.assertIn("mock", body["note"].lower())


if __name__ == "__main__":
    unittest.main()
