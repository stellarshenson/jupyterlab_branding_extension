"""Tornado handlers for branding extension."""

import base64
import json
import logging
import mimetypes
import os
import tempfile
import unicodedata
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


class SplashLogoFileHandler(JupyterHandler):
    """Handler that serves the splash logo file."""

    @tornado.web.authenticated
    def get(self):
        """Read and serve the splash logo file."""
        file_path = self.settings.get("branding_splash_file_path", "")
        if not file_path or not os.path.isfile(file_path):
            raise tornado.web.HTTPError(404, "Splash logo file not found")

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


def _resolve_logo_source(logo_uri):
    """Resolve a logo URI to a local file path, fetching remote URLs.

    Returns the local file path, or empty string if logo_uri is empty
    or could not be resolved.
    """
    if not logo_uri:
        return ""

    file_path = _resolve_file_path(logo_uri)
    if file_path:
        return file_path

    parsed = urlparse(logo_uri)
    if parsed.scheme in ("http", "https"):
        return _fetch_remote_logo(logo_uri)

    return ""


def _to_data_uri(file_path):
    """Encode a local file as a base64 data URI for inline CSS use.

    Returns empty string if the file does not exist or cannot be read.
    """
    if not file_path or not os.path.isfile(file_path):
        return ""
    try:
        content_type, _ = mimetypes.guess_type(file_path)
        if content_type is None:
            content_type = "application/octet-stream"
        with open(file_path, "rb") as f:
            data = f.read()
        encoded = base64.b64encode(data).decode("ascii")
        return "data:{};base64,{}".format(content_type, encoded)
    except Exception as e:
        log.warning("Failed to encode %s as data URI: %s", file_path, e)
        return ""


# Blankness is decided by Unicode category, not by a character list.
#
# str.strip() alone is not enough: Python does not treat U+FEFF as
# whitespace but JavaScript's String.trim() does, so a BOM-prefixed value
# (what reading a UTF-8-BOM file gives you) passed the gate here, reached
# appName, and blanked the browser tab - while the frontend's own guard
# silently skipped it.
#
# A hand-written list of such characters is not enough either: it missed
# 37 zero-ink codepoints, among them U+200E, which Windows and RTL locales
# inject into text routinely, and U+202E, whose bidi override can make a
# config file that reads "BAL-EMCA" paint "ACME-LAB" in the tab.
_TRIMMABLE_CATEGORIES = frozenset({"Cc", "Cf", "Zs", "Zl", "Zp"})

# Combining marks paint nothing on their own but belong to the character
# before them, so they count towards blankness without being trimmed.
_NON_PAINTING_CATEGORIES = _TRIMMABLE_CATEGORIES | frozenset({"Mn", "Me"})

# Blank characters that Unicode still classes as letters or symbols:
# Hangul fillers, the blank Braille pattern, halfwidth Hangul filler.
_NON_PAINTING_CODEPOINTS = frozenset({0x115F, 0x1160, 0x2800, 0x3164, 0xFFA0})


def _paints(char):
    """Return True if the character puts ink on screen."""
    return (
        unicodedata.category(char) not in _NON_PAINTING_CATEGORIES
        and ord(char) not in _NON_PAINTING_CODEPOINTS
    )


def _clean_display_text(value):
    """Trim invisible characters; return "" when nothing visible remains.

    Applied to every configured display string so the browser tab, the
    system name and the stage badge all share one definition of blank -
    otherwise a value can be blank on one path and rendered on another.
    """
    start, end = 0, len(value)
    while start < end and unicodedata.category(value[start]) in _TRIMMABLE_CATEGORIES:
        start += 1
    while end > start and unicodedata.category(value[end - 1]) in _TRIMMABLE_CATEGORIES:
        end -= 1
    cleaned = value[start:end]
    if not any(_paints(char) for char in cleaned):
        return ""
    return cleaned


def _install_app_name_hook(web_app, short_name):
    """Override the ``appName`` page-config option via the page-config hook.

    Writing ``page_config_data['appName']`` directly does not work: the
    jupyterlab_server page-config handler re-assigns every ``LabConfig``
    trait into that dict on every request, clobbering the value. The hook
    runs after that loop, so an override applied here survives.

    Chains any hook installed before this extension loads, rather than
    replacing it - JupyterHub installs one in ``init_webapp`` to inject the
    API token, and plain assignment would silently strip it. An extension
    that loads *later* and assigns without chaining will still drop this
    one; that is where to look if the tab title goes dead.
    """
    previous_hook = web_app.settings.get("page_config_hook")

    def hook(handler, page_config):
        if previous_hook is not None:
            page_config = previous_hook(handler, page_config)
        page_config["appName"] = short_name
        return page_config

    web_app.settings["page_config_hook"] = hook


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
    splash_logo_route = url_path_join(
        base_url, "jupyterlab-branding", "splash-logo"
    )

    file_path = _resolve_logo_source(config.logo_uri)
    splash_file_path = _resolve_logo_source(config.splash_logo_uri)

    frontend_url = (
        url_path_join(base_url, "jupyterlab-branding", "logo")
        if file_path else ""
    )
    splash_frontend_url = (
        url_path_join(base_url, "jupyterlab-branding", "splash-logo")
        if splash_file_path else ""
    )

    web_app.settings["branding_config"] = {
        "logo_url": frontend_url,
        "splash_logo_url": splash_frontend_url,
        "system_name": _clean_display_text(config.system_name),
        "header_system_name_color": config.header_system_name_color,
        "stage": _clean_display_text(config.stage),
    }
    web_app.settings["branding_file_path"] = file_path
    web_app.settings["branding_splash_file_path"] = splash_file_path

    # Inject splash URL and inline data URI into PageConfig so the
    # frontend can read both at module load (before splash renders).
    # The data URI avoids a network round-trip when the splash element
    # appears, eliminating any flash of empty centre during the orbits.
    page_config = web_app.settings.setdefault("page_config_data", {})
    page_config["brandingSplashLogoUrl"] = splash_frontend_url
    page_config["brandingSplashLogoDataUri"] = _to_data_uri(splash_file_path)

    # Browser tab title. 'appName' is what JupyterLab renders into
    # document.title and is the value that persists; 'brandingShortName'
    # only drives the frontend's pre-restore paint. See
    # _install_app_name_hook for why the hook is required.
    #
    # Cleaned once, here, so both consumers see the same value: appName
    # wins a few seconds after boot, so an unstripped blank-looking
    # short_name would blank the tab regardless of the frontend's guard.
    #
    # appNamespace is deliberately NOT touched. It is read exactly once in
    # the shipped bundle - `this.namespace = appNamespace || this.name` in
    # the JupyterLab constructor - and serves only as a provenance prefix
    # for plugins; workspace and state-DB identity come from the separate
    # 'workspace' option. The coupling that does exist runs the other way:
    # where appNamespace is empty, app.namespace falls back to appName, so
    # branding would leak into that prefix. Under LabServerApp it is always
    # "lab", but writing it here would make that leak our doing.
    short_name = _clean_display_text(config.short_name)
    page_config["brandingShortName"] = short_name
    if short_name:
        _install_app_name_hook(web_app, short_name)

    web_app.add_handlers(host_pattern, [
        (config_route, LogoConfigHandler),
        (logo_route, LogoFileHandler),
        (splash_logo_route, SplashLogoFileHandler),
    ])
