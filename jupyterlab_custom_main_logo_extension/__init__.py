"""JupyterLab extension to use custom logo for the main logo."""

try:
    from ._version import __version__
except ImportError:
    # Fallback when using the package in dev mode without installing
    # in editable mode with pip.
    import warnings
    warnings.warn("Importing 'jupyterlab_custom_main_logo_extension' outside a proper installation.")
    __version__ = "dev"

from .config import CustomMainLogo
from .handlers import setup_handlers


def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "jupyterlab_custom_main_logo_extension"
    }]


def _jupyter_server_extension_points():
    return [{"module": "jupyterlab_custom_main_logo_extension"}]


def _load_jupyter_server_extension(server_app):
    """Load the server extension."""
    config = CustomMainLogo(parent=server_app)
    setup_handlers(server_app.web_app, config)
    server_app.log.info(
        f"Registered jupyterlab_custom_main_logo_extension, logo_uri={config.logo_uri}"
    )
