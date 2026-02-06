"""Tornado handlers for custom main logo extension."""

import json

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


def setup_handlers(web_app, config):
    """Register handlers with the web application."""
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]
    route = url_path_join(base_url, "jupyterlab-custom-main-logo", "config")

    # Store config in app settings for handler access
    web_app.settings["custom_main_logo_config"] = {
        "logo_uri": config.logo_uri
    }

    web_app.add_handlers(host_pattern, [(route, LogoConfigHandler)])
