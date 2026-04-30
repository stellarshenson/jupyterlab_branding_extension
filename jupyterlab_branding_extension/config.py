"""Configuration for branding extension."""

from traitlets import Bool, Unicode
from traitlets.config import Configurable


class Branding(Configurable):
    """Configuration for branding extension."""

    logo_uri = Unicode(
        "",
        config=True,
        help="URI to custom logo file (file://, https://, or relative path)"
    )

    system_name = Unicode(
        "",
        config=True,
        help="System name displayed in the top toolbar spacer area"
    )

    capitalize_system_name = Bool(
        True,
        config=True,
        help="When True, system_name is rendered using CSS uppercase transform"
    )
