"""Configuration for branding extension."""

from traitlets import Unicode
from traitlets.config import Configurable


class Branding(Configurable):
    """Configuration for branding extension."""

    logo_uri = Unicode(
        "",
        config=True,
        help="URI to custom logo file (file://, https://, or relative path)"
    )

    splash_logo_uri = Unicode(
        "",
        config=True,
        help=(
            "URI to custom splash screen logo (file://, https://, or "
            "relative path). Replaces the centre logo of the JupyterLab "
            "startup splash via CSS background-image override."
        )
    )

    short_name = Unicode(
        "",
        config=True,
        help=(
            "Short name used as the browser tab title. When empty, the "
            "JupyterLab default title is left untouched. "
            "Surrounding invisible characters are trimmed and bidi controls are removed; a value that paints nothing is treated as empty."
        )
    )

    system_name = Unicode(
        "",
        config=True,
        help=(
            "System name displayed in the top header toolbar spacer area. "
            "Surrounding invisible characters are trimmed and bidi controls are removed; a value that paints nothing is treated as empty."
        )
    )

    stage = Unicode(
        "",
        config=True,
        help=(
            "Deployment stage badge shown to the right of the system name "
            "(e.g. 'DEV', 'TST', 'STG', 'PRD', or any text). DEV/TST/STG/PRD "
            "get their own colour; any other value renders neutral grey. "
            "When empty, no badge is rendered. "
            "Surrounding invisible characters are trimmed and bidi controls are removed; a value that paints nothing is treated as empty."
        )
    )

    header_system_name_color = Unicode(
        "",
        config=True,
        help=(
            "Hex colour for the system name text in the top header "
            "(e.g. '#ff8800'). When empty, the JupyterLab sidebar font "
            "colour (--jp-ui-font-color2) is used."
        )
    )
