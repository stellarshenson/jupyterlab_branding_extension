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

    system_name = Unicode(
        "",
        config=True,
        help="System name displayed in the top header toolbar spacer area"
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
