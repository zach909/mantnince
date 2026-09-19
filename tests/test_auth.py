import unittest

from tests.conftest import UBSTestCase, register_and_auth


class AuthTests(UBSTestCase):
    def test_register_and_login(self):
        user_id, headers = register_and_auth(self.client)
        self.assertTrue(user_id)
        self.assertTrue(headers["Authorization"].startswith("Bearer "))

    def test_duplicate_registration_rejected(self):
        register_and_auth(self.client)
        r = self.client.post(
            "/api/auth/register",
            json={"username": "alice", "email": "alice@example.com", "password": "password123"},
        )
        self.assertEqual(r.status_code, 409)

    def test_wrong_password_rejected(self):
        register_and_auth(self.client)
        r = self.client.post("/api/auth/token", data={"username": "alice", "password": "wrong"})
        self.assertEqual(r.status_code, 401)

    def test_protected_route_requires_auth(self):
        r = self.client.get("/api/devices")
        self.assertEqual(r.status_code, 401)


if __name__ == "__main__":
    unittest.main()
