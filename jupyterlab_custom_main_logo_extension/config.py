"""Configuration for custom main logo extension."""

from traitlets import Unicode
from traitlets.config import Configurable


class CustomMainLogo(Configurable):
    """Configuration for custom main logo extension."""

    logo_uri = Unicode(
        "",
        config=True,
        help="URI to custom logo file (file://, https://, or relative path)"
    )
