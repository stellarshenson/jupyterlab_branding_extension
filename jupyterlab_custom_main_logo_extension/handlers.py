"""Tornado handlers for custom main logo extension."""

import json
import mimetypes
import os
from urllib.parse import urlparse

import tornado
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join


class LogoConfigHandler(APIHandler):
    """Handler for logo configuration endpoint."""

    @tornado.web.authenticated
    def get(self):
        """Return logo configuration as JSON."""
        config = self.settings.get("custom_main_logo_config", {})
        self.finish(json.dumps(config))


class LogoFileHandler(APIHandler):
    """Handler that serves the logo file for file:// and relative URIs."""

    @tornado.web.authenticated
    def get(self):
        """Read and serve the logo file."""
        file_path = self.settings.get("custom_main_logo_file_path", "")
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

    # Treat as local path (absolute or relative)
    return os.path.abspath(logo_uri)


def setup_handlers(web_app, config):
    """Register handlers with the web application."""
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]

    config_route = url_path_join(
        base_url, "jupyterlab-custom-main-logo", "config"
    )
    logo_route = url_path_join(
        base_url, "jupyterlab-custom-main-logo", "logo"
    )

    logo_uri = config.logo_uri
    file_path = _resolve_file_path(logo_uri)
    parsed = urlparse(logo_uri) if logo_uri else None

    # Determine the URL the frontend should use
    if file_path:
        # Local file - serve through our endpoint
        frontend_url = url_path_join(
            base_url, "jupyterlab-custom-main-logo", "logo"
        )
    elif parsed and parsed.scheme in ("http", "https"):
        # Remote URL - frontend uses it directly
        frontend_url = logo_uri
    else:
        frontend_url = ""

    web_app.settings["custom_main_logo_config"] = {
        "logo_url": frontend_url
    }
    web_app.settings["custom_main_logo_file_path"] = file_path

    web_app.add_handlers(host_pattern, [
        (config_route, LogoConfigHandler),
        (logo_route, LogoFileHandler),
    ])
