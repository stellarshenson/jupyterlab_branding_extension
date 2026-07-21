"""Tests for the server-side branding configuration.

These cover the page-config path in particular: 'appName' is the value that
persists in the browser tab (JupyterLab rewrites document.title from it on
every state-DB change), so a defect here outlives anything the frontend does.
"""

import pytest

from jupyterlab_branding_extension.config import Branding
from jupyterlab_branding_extension.handlers import setup_handlers

HANDLER = object()  # stands in for the tornado request handler


class FakeWebApp:
    """Minimal stand-in for the tornado web application."""

    def __init__(self, settings=None):
        self.settings = {"base_url": "/"}
        if settings:
            self.settings.update(settings)
        self.handlers = []

    def add_handlers(self, host_pattern, handlers):
        self.handlers.extend(handlers)


def render_page_config(web_app, app_namespace="lab"):
    """Return page config as a request would see it.

    jupyterlab_server re-assigns every LabConfig trait into page_config on
    each request and then calls the hook, so the hook - not the dict written
    at extension-load time - is what decides the final value.

    app_namespace is a parameter because the empty case is the one that
    matters: JupyterLab computes `namespace = appNamespace || appName`, so
    only an empty appNamespace lets branding reach the plugin prefix.
    """
    page_config = dict(web_app.settings.get("page_config_data", {}))
    # The trait loop writes every LabConfig trait, not just appName.
    page_config["appName"] = "JupyterLab"
    page_config["appNamespace"] = app_namespace
    hook = web_app.settings.get("page_config_hook")
    if hook is not None:
        page_config = hook(HANDLER, page_config)
    return page_config


def setup(short_name="", **kwargs):
    web_app = FakeWebApp(kwargs.pop("settings", None))
    setup_handlers(web_app, Branding(short_name=short_name, **kwargs))
    return web_app


@pytest.mark.parametrize(
    "configured,expected",
    [
        ("ACME-LAB", "ACME-LAB"),
        ("  ACME-LAB  ", "ACME-LAB"),  # trailing-space typo
        ("\tACME-LAB\n", "ACME-LAB"),
        ("﻿ACME-LAB", "ACME-LAB"),  # read from a UTF-8-BOM file
        (" ACME-LAB ", "ACME-LAB"),  # non-breaking space
        ("‎ACME-LAB", "ACME-LAB"),  # left-to-right mark
        # U+202E reverses what the tab paints: this value reads BAL-EMCA in
        # a config file but rendered pixel-identical to ACME-LAB until the
        # override was stripped.
        ("‮BAL-EMCA", "BAL-EMCA"),
        # Must NOT be mangled: the combining acute belongs to the 'e'.
        ("CAFÉ-LAB", "CAFÉ-LAB"),
    ],
)
def test_short_name_is_trimmed_on_both_paths(configured, expected):
    """A padded short_name must not reach the tab title verbatim."""
    web_app = setup(short_name=configured)

    assert render_page_config(web_app)["appName"] == expected
    assert web_app.settings["page_config_data"]["brandingShortName"] == expected


@pytest.mark.parametrize(
    "blank",
    [
        "",
        "   ",
        "\t\n",
        " ",  # non-breaking space
        "﻿",  # BOM: blank to JS trim(), NOT to Python strip()
        "​",  # zero-width space: blank to neither, paints nothing
        "⁠",  # word joiner
        " ﻿ ​ ",  # mixed run - must not stop at the first char
        "‎",  # LRM - Windows and RTL locales inject it routinely
        "­",  # soft hyphen
        "ㅤ",  # Hangul filler: a "letter" that paints nothing
        "⠀",  # blank Braille pattern: a "symbol" that paints nothing
        "️",  # variation selector
        "͏",  # combining grapheme joiner
        "\U000e0001",  # language tag
    ],
)
def test_blank_short_name_leaves_the_title_alone(blank):
    """A short_name that paints nothing must not blank the browser tab.

    Regression: gating on the raw value made '   ' truthy, so appName was
    set to spaces and JupyterLab rendered an empty tab (or a dangling
    'notebook.ipynb -') a few seconds after boot.

    Second regression: str.strip() alone kept U+FEFF, which String.trim()
    removes - so the frontend guard skipped the value while the server
    wrote it into appName, reproducing the same dead tab.
    """
    web_app = setup(short_name=blank)

    assert web_app.settings.get("page_config_hook") is None
    assert render_page_config(web_app)["appName"] == "JupyterLab"
    assert web_app.settings["page_config_data"]["brandingShortName"] == ""


@pytest.mark.parametrize("namespace", ["lab", ""])
def test_hook_never_writes_app_namespace(namespace):
    """Whatever the host sets appNamespace to must survive the hook.

    The empty case is the load-bearing one: JupyterLab computes
    `namespace = appNamespace || appName`, so if we ever wrote appNamespace
    - or if appName leaked into it - the plugin provenance prefix would
    silently become the brand name.
    """
    web_app = setup(short_name="ACME-LAB")

    assert "appNamespace" not in web_app.settings["page_config_data"]
    assert render_page_config(web_app, namespace)["appNamespace"] == namespace


def test_existing_page_config_hook_is_chained_not_replaced():
    """JupyterHub installs a hook to inject the API token before we load."""

    seen = {}

    def previous_hook(handler, page_config):
        seen["handler"] = handler
        # Returns a NEW dict, so a caller that drops the return value loses
        # the token entirely - which is what this test exists to catch.
        return {**page_config, "token": "hub-token"}

    web_app = setup(
        short_name="ACME-LAB",
        settings={"page_config_hook": previous_hook},
    )

    page_config = render_page_config(web_app)
    assert page_config["token"] == "hub-token"  # not stripped
    assert page_config["appName"] == "ACME-LAB"  # and ours still wins
    assert seen["handler"] is HANDLER  # handler forwarded, not swallowed


def test_stage_and_system_name_reach_the_config_endpoint():
    web_app = setup(system_name="production", stage="PRD")

    branding_config = web_app.settings["branding_config"]
    assert branding_config["system_name"] == "production"
    assert branding_config["stage"] == "PRD"


@pytest.mark.parametrize("blank", ["", "   ", "​", "‎", "‮"])
def test_blank_stage_and_system_name_are_cleaned_server_side(blank):
    """All three display strings must share one definition of blank.

    Regression: only short_name was cleaned, so a zero-width stage passed
    through and rendered an empty bordered badge in the toolbar.
    """
    web_app = setup(system_name=blank, stage=blank)

    branding_config = web_app.settings["branding_config"]
    assert branding_config["system_name"] == ""
    assert branding_config["stage"] == ""
