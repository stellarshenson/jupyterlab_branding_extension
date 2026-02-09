# jupyterlab_branding_extension

[![GitHub Actions](https://github.com/stellarshenson/jupyterlab_branding_extension/actions/workflows/build.yml/badge.svg)](https://github.com/stellarshenson/jupyterlab_branding_extension/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/jupyterlab_branding_extension.svg)](https://www.npmjs.com/package/jupyterlab_branding_extension)
[![PyPI version](https://img.shields.io/pypi/v/jupyterlab_branding_extension.svg)](https://pypi.org/project/jupyterlab_branding_extension/)
[![Total PyPI downloads](https://static.pepy.tech/badge/jupyterlab_branding_extension)](https://pepy.tech/project/jupyterlab_branding_extension)
[![JupyterLab 4](https://img.shields.io/badge/JupyterLab-4-orange.svg)](https://jupyterlab.readthedocs.io/en/stable/)
[![Brought To You By KOLOMOLO](https://img.shields.io/badge/Brought%20To%20You%20By-KOLOMOLO-00ffff?style=flat)](https://kolomolo.com)
[![Donate PayPal](https://img.shields.io/badge/Donate-PayPal-blue?style=flat)](https://www.paypal.com/donate/?hosted_button_id=B4KPBJDLLXTSA)

JupyterLab branding extension that replaces the default main area logo with a custom image. Supports SVG (inline embedding) and raster formats via a configurable logo URI.

## Features

- **Custom main area logo** - replace the default JupyterLab 3-dot logo with any SVG or raster image
- **Configurable via traitlets** - set `logo_uri` in `jupyter_lab_config.py` or read from `JUPYTERLAB_MAIN_ICON_URI` environment variable
- **Local and remote logos** - supports `file://` paths, `https://` URLs, and local filesystem paths
- **Inline SVG embedding** - SVG logos are embedded directly in the DOM, matching JupyterLab's native approach
- **Server extension** - serves local logo files through an authenticated HTTP endpoint, bypassing browser `file://` restrictions

## Requirements

- JupyterLab >= 4.0.0
- jupyter_server >= 2.0.0

## Install

```bash
pip install jupyterlab_branding_extension
```

## Configuration

Add to your `jupyter_lab_config.py`:

```python
import os

# From environment variable (set by JupyterHub or manually)
c.Branding.logo_uri = os.environ.get("JUPYTERLAB_MAIN_ICON_URI", "")

# Or set directly - local file path
c.Branding.logo_uri = "/path/to/your/logo.svg"

# Or set directly - file:// URI
c.Branding.logo_uri = "file:///path/to/your/logo.svg"

# Or set directly - remote URL
c.Branding.logo_uri = "https://example.com/logo.svg"
```

When no protocol is specified, the path is treated as a local filesystem path.

## How It Works

The extension has two components:

- **Server extension** - exposes `/jupyterlab-branding/config` (returns the configured logo URL) and `/jupyterlab-branding/logo` (serves local logo files with correct MIME type)
- **Frontend plugin** - fetches configuration on startup, retrieves logo content, and replaces the `#jp-MainLogo` element. SVG logos are embedded inline, raster images use `<img>` tags

## Uninstall

```bash
pip uninstall jupyterlab_branding_extension
```
