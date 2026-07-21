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


@pytest.mark.parametrize(
    "configured,expected",
    [
        # Bidi overrides are removed wherever they sit, not just at the ends:
        # one painting character in front kept the override alive, so a value
        # reading "A<RLO>BAL-EMCA" painted "AACME-LAB".
        ("A‮BAL-EMCA", "ABAL-EMCA"),
        ("PRD-‮BAL-EMCA", "PRD-BAL-EMCA"),
        # Blank characters with a printing category are trimmed from the ends
        # too, not merely counted towards blankness.
        ("ㅤACME-LAB", "ACME-LAB"),
        ("ACME-LAB⠀", "ACME-LAB"),
    ],
)
def test_invisible_characters_are_removed_not_just_counted(configured, expected):
    web_app = setup(short_name=configured)

    assert render_page_config(web_app)["appName"] == expected


@pytest.mark.parametrize(
    "blank",
    [
        "⁥",  # reserved Default_Ignorable, category Cn
        "￰￱￲",  # reserved Default_Ignorable range
        "\U000e0080",  # reserved tag range
        "\ufffc",  # object replacement char: So, zero advance width
    ],
)
def test_non_painting_codepoints_outside_the_category_test_are_blank(blank):
    """These paint nothing but no Unicode category says so - reserved
    Default_Ignorable is Cn, U+FFFC is So - hence the range table."""
    web_app = setup(short_name=blank)

    assert web_app.settings.get("page_config_hook") is None
    assert web_app.settings["page_config_data"]["brandingShortName"] == ""


@pytest.mark.parametrize(
    "name",
    [
        "ACME-LAB",
        "CAFÉ-LAB",  # decomposed accent: mark must not be trimmed
        "مختبر",  # Arabic
        "מעבדה",  # Hebrew
        "生産",  # CJK
        "\U0001f468‍\U0001f469‍\U0001f467",  # emoji ZWJ sequence
    ],
)
def test_legitimate_names_are_never_mangled(name):
    """The cleaning must not damage real brand names in any script."""
    web_app = setup(short_name=name)

    assert render_page_config(web_app)["appName"] == name


@pytest.mark.parametrize(
    "configured,expected",
    [
        # A leading combining mark has no base character to belong to, so it
        # is a floating accent in the tab title and must be trimmed.
        ("́ACME", "ACME"),
        ("️ACME", "ACME"),  # leading VS16
        # A TRAILING mark does have a base character: trimming it would turn
        # decomposed CAFE into CAFE, and an emoji into its text form.
        ("CAFÉ", "CAFÉ"),
        ("☃️", "☃️"),
    ],
)
def test_combining_marks_trim_at_the_head_but_never_at_the_tail(configured, expected):
    """The head/tail asymmetry is the whole point - cover both directions.

    Regression: a single `_trimmable` predicate exempted Mn/Me at BOTH ends,
    so a leading U+0301 shipped into appName; and no test exercised the
    carve-out at all, because the CAFÉ cases put the mark interior where the
    end-only trim loops never reach it.
    """
    web_app = setup(short_name=configured)

    assert render_page_config(web_app)["appName"] == expected


@pytest.mark.parametrize(
    "name",
    [
        "🏴󠁧󠁢󠁳󠁣󠁴󠁿",  # subdivision flag: tag sequence must survive the tail trim
        "LAB 🏴󠁧󠁢󠁷󠁬󠁳󠁿",
        # LRM is how Unicode pins a Latin/numeric run inside RTL text.
        # Removing it renders the number reversed.
        "مختبر ‎+48 22‎ PRD",
        "מעבדה ‎ACME‎ PRD",
    ],
)
def test_directional_marks_and_emoji_tags_are_preserved(name):
    """Cleaning must not damage names that legitimately embed them.

    Regression: emoji tag characters are Cf inside the E0000-E0FFF range,
    so the tail trim ate them and a subdivision flag degraded to a plain
    black flag; and LRM/RLM were lumped in with the bidi overrides, which
    reordered legitimate RTL names.
    """
    web_app = setup(short_name=name)

    assert render_page_config(web_app)["appName"] == name


@pytest.mark.parametrize("spoof", ["‮BAL-EMCA", "A‮BAL-EMCA", "BAL-EMCA‮"])
def test_bidi_overrides_are_still_removed_everywhere(spoof):
    """Narrowing the set to overrides must not revive the spoof."""
    web_app = setup(short_name=spoof)

    assert "‮" not in render_page_config(web_app)["appName"]
