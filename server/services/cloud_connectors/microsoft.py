"""Microsoft OneDrive connector (metadata only).

Uses Microsoft Graph's real OAuth 2.0 consent flow. The read-only Files scope
below must be approved by the user on Microsoft's own consent screen.
"""

from server.services.cloud_connectors.google import Connector

CONNECTOR = Connector(
    provider="microsoft",
    display_name="Microsoft OneDrive",
    auth_url="https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    scopes=["Files.Read", "offline_access"],
)


def exchange_code(auth_code: str, redirect_uri: str) -> dict:
    """Exchange an OAuth authorization code for tokens.

    TODO: implement the real token exchange against Microsoft Graph
    (https://login.microsoftonline.com/common/oauth2/v2.0/token).
    """
    raise NotImplementedError("Wire up Microsoft OAuth token exchange before enabling live sync.")
