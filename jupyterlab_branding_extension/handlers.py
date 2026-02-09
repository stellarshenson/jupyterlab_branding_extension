"""Tornado handlers for branding extension."""

import json
import logging
import mimetypes
import os
import tempfile
from urllib.parse import urlparse
from urllib.request import urlopen

import tornado
from jupyter_server.base.handlers import APIHandler, JupyterHandler
from jupyter_server.utils import url_path_join

log = logging.getLogger(__name__)


class LogoConfigHandler(APIHandler):
    """Handler for logo configuration endpoint."""

    @tornado.web.authenticated
    def get(self):
        """Return logo configuration as JSON."""
        config = self.settings.get("branding_config", {})
        self.finish(json.dumps(config))


class LogoFileHandler(JupyterHandler):
    """Handler that serves the logo file.

    Uses JupyterHandler instead of APIHandler to avoid forced
    Content-Type: application/json on the response.
    """

    @tornado.web.authenticated
    def get(self):
        """Read and serve the logo file."""
        file_path = self.settings.get("branding_file_path", "")
        if not file_path or not os.path.isfile(file_path):
            raise tornado.web.HTTPError(404, "Logo file not found")

        content_type, _ = mimetypes.guess_type(file_path)
        if content_type is None:
            content_type = "application/octet-stream"

        self.set_header("Content-Type", content_type)
        with open(file_path, "rb") as f:
            self.finish(f.read())


def _resolve_file_path(logo_uri):
    """Resolve logo_uri to a local file path, or empty string if remote."""
    if not logo_uri:
        return ""

    parsed = urlparse(logo_uri)

    if parsed.scheme == "file":
        return parsed.path

    if parsed.scheme in ("http", "https"):
        return ""

    # No scheme - treat as local path (absolute or relative)
    return os.path.abspath(logo_uri)


def _fetch_remote_logo(url):
    """Fetch logo from remote URL and cache to a local temp file.

    Returns the local file path, or empty string on failure.
    """
    try:
        with urlopen(url, timeout=10) as resp:
            data = resp.read()
            content_type = resp.headers.get("Content-Type", "")

        # Determine file extension from content type
        ext = mimetypes.guess_extension(content_type.split(";")[0].strip()) or ""
        if not ext and url.endswith(".svg"):
            ext = ".svg"

        fd, path = tempfile.mkstemp(prefix="jlab-branding-", suffix=ext)
        with os.fdopen(fd, "wb") as f:
            f.write(data)

        log.info("Fetched remote logo %s -> %s (%d bytes)", url, path, len(data))
        return path
    except Exception as e:
        log.warning("Failed to fetch remote logo %s: %s", url, e)
        return ""


def setup_handlers(web_app, config):
    """Register handlers with the web application."""
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]

    config_route = url_path_join(
        base_url, "jupyterlab-branding", "config"
    )
    logo_route = url_path_join(
        base_url, "jupyterlab-branding", "logo"
    )

    logo_uri = config.logo_uri
    file_path = _resolve_file_path(logo_uri)
    parsed = urlparse(logo_uri) if logo_uri else None

    # For http(s) URLs, fetch server-side and serve through our endpoint.
    # The URL may point to an internal host (e.g. jupyterhub:8080) that
    # the browser cannot reach directly.
    if not file_path and parsed and parsed.scheme in ("http", "https"):
        file_path = _fetch_remote_logo(logo_uri)

    # Determine the URL the frontend should use
    if file_path:
        frontend_url = url_path_join(
            base_url, "jupyterlab-branding", "logo"
        )
    else:
        frontend_url = ""

    web_app.settings["branding_config"] = {
        "logo_url": frontend_url
    }
    web_app.settings["branding_file_path"] = file_path

    web_app.add_handlers(host_pattern, [
        (config_route, LogoConfigHandler),
        (logo_route, LogoFileHandler),
    ])
