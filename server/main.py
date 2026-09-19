"""Universal Backup System — stdlib-only HTTP server entry point.

Run locally with:
    python -m server.main
"""

from __future__ import annotations

from http.server import ThreadingHTTPServer

from server.api import auth, backup, cloud, devices, earnings
from server.core.config import Settings, get_settings
from server.core.database import init_db
from server.core.http import build_http_server


def _health(_request) -> tuple[int, dict]:
    return 200, {"status": "ok"}


def _build_routes() -> dict:
    routes: dict = {("GET", "/health"): _health}
    for module in (auth, devices, cloud, backup, earnings):
        routes.update(module.ROUTES)
    return routes


ROUTES = _build_routes()


def build_server(host: str = "127.0.0.1", port: int = 8000, settings: Settings | None = None) -> ThreadingHTTPServer:
    """Build (but do not start) the backing HTTP server, with tables created."""
    settings = settings or get_settings()
    init_db(settings)
    return build_http_server(ROUTES, settings, host=host, port=port)


def main() -> None:
    host = "0.0.0.0"
    port = 8000
    server = build_server(host, port)
    print(f"Universal Backup System listening on http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
