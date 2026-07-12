"""Cloud connector registry.

Only providers with a real, consent-based API are represented. Each connector
describes the OAuth scopes it would request; wiring up the live OAuth exchange
is deliberately left as a clearly marked TODO rather than faked.
"""

from server.services.cloud_connectors import google, microsoft

CONNECTORS = {
    "google": google.CONNECTOR,
    "microsoft": microsoft.CONNECTOR,
}


def get_connector(provider: str):
    return CONNECTORS.get(provider)
