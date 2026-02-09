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
