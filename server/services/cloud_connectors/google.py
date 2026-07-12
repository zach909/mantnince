"""Google Drive connector (metadata only).

Uses Google's real OAuth 2.0 consent flow. The scope requested below is
read-only Drive access, which the user must explicitly approve on Google's own
consent screen. There is no way (and no attempt) to reach a user's data without
that consent.
"""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Connector:
    provider: str
    display_name: str
    auth_url: str
    scopes: list[str] = field(default_factory=list)

    def describe(self) -> dict:
        return {
            "provider": self.provider,
            "display_name": self.display_name,
            "scopes": self.scopes,
            "note": "Requires the user to approve access on Google's consent screen.",
        }


CONNECTOR = Connector(
    provider="google",
    display_name="Google Drive",
    auth_url="https://accounts.google.com/o/oauth2/v2/auth",
    scopes=["https://www.googleapis.com/auth/drive.readonly"],
)


def exchange_code(auth_code: str, redirect_uri: str) -> dict:
    """Exchange an OAuth authorization code for tokens.

    TODO: implement the real token exchange against
    https://oauth2.googleapis.com/token using the configured client id/secret.
    Left unimplemented rather than stubbed with fake tokens.
    """
    raise NotImplementedError("Wire up Google OAuth token exchange before enabling live sync.")
