import unittest

from tests.conftest import UBSTestCase, register_and_auth


class DeviceTests(UBSTestCase):
    def test_register_and_list_devices(self):
        _, headers = register_and_auth(self.client)

        r = self.client.post(
            "/api/devices/register",
            headers=headers,
            json={"device_info": {"name": "My Laptop", "type": "linux", "platform": "Linux"}},
        )
        self.assertEqual(r.status_code, 201, r.text)
        device_id = r.json()["device_id"]
        self.assertTrue(device_id)

        r = self.client.get("/api/devices", headers=headers)
        self.assertEqual(r.status_code, 200)
        devices = r.json()["devices"]
        self.assertEqual(len(devices), 1)
        self.assertEqual(devices[0]["id"], device_id)
        self.assertEqual(devices[0]["status"], "online")

    def test_devices_are_scoped_per_user(self):
        _, alice = register_and_auth(self.client)
        self.client.post(
            "/api/devices/register",
            headers=alice,
            json={"device_info": {"name": "Alice PC", "type": "windows_pc"}},
        )

        _, bob = register_and_auth(self.client, username="bob", email="bob@example.com")
        r = self.client.get("/api/devices", headers=bob)
        self.assertEqual(r.json()["devices"], [])


if __name__ == "__main__":
    unittest.main()
