# jupyterlab_branding_extension

[![GitHub Actions](https://github.com/stellarshenson/jupyterlab_branding_extension/actions/workflows/build.yml/badge.svg)](https://github.com/stellarshenson/jupyterlab_branding_extension/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/jupyterlab_branding_extension.svg)](https://www.npmjs.com/package/jupyterlab_branding_extension)
[![PyPI version](https://img.shields.io/pypi/v/jupyterlab_branding_extension.svg)](https://pypi.org/project/jupyterlab_branding_extension/)
[![Total PyPI downloads](https://static.pepy.tech/badge/jupyterlab_branding_extension)](https://pepy.tech/project/jupyterlab_branding_extension)
[![JupyterLab 4](https://img.shields.io/badge/JupyterLab-4-orange.svg)](https://jupyterlab.readthedocs.io/en/stable/)
[![Brought To You By KOLOMOLO](https://img.shields.io/badge/Brought%20To%20You%20By-KOLOMOLO-00ffff?style=flat)](https://kolomolo.com)
[![Donate PayPal](https://img.shields.io/badge/Donate-PayPal-blue?style=flat)](https://www.paypal.com/donate/?hosted_button_id=B4KPBJDLLXTSA)

JupyterLab branding extension that replaces the default main area logo, the startup splash logo, and displays a configurable system name in the top toolbar. Supports SVG (inline embedding) and raster logo formats via configurable URIs.

## Features

- **Custom main area logo** - replace the default JupyterLab 3-dot logo with any SVG or raster image
- **Custom startup splash logo** - replace the Jupyter logo at the centre of the boot splash animation, with the orbiting moons preserved
- **System name in top toolbar** - display a configurable text label (e.g. environment name) in the right side of the top toolbar, with optional custom hex color
- **Configurable via traitlets** - set `logo_uri`, `splash_logo_uri`, `system_name`, and `header_system_name_color` in `jupyter_lab_config.py`
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
# Local file path
c.Branding.logo_uri = "/path/to/your/logo.svg"

# file:// URI
c.Branding.logo_uri = "file:///path/to/your/logo.svg"

# Remote URL
c.Branding.logo_uri = "https://example.com/logo.svg"
```

When no protocol is specified, the path is treated as a local filesystem path.

### Splash logo

```python
# Replace the Jupyter logo in the startup splash animation
c.Branding.splash_logo_uri = "/path/to/your/splash-logo.svg"
```

Accepts the same URI forms as `logo_uri` (local path, `file://`, or `https://`). The image is base64-encoded server-side and injected into PageConfig so the custom logo appears together with the orbiting moons on first paint - no network round-trip, no white flash. The orbits themselves are untouched. Leave `splash_logo_uri` empty to keep the default Jupyter splash.

### System name

```python
# Display "production" in the top-right of the header
c.Branding.system_name = "production"

# Optional: override text color with a hex value
c.Branding.header_system_name_color = "#ff8800"
```

The system name is rendered inside the existing JupyterLab header toolbar spacer (`jp-Toolbar-spacer`). When `header_system_name_color` is empty, the text uses the JupyterLab sidebar font color (`--jp-ui-font-color2`) and adapts to light/dark themes automatically. When set to a hex value, that color is applied as an inline style. Leave `system_name` empty to disable this feature. To show the name in uppercase, type it in uppercase.

## How It Works

The extension has two components:

- **Server extension** - exposes `/jupyterlab-branding/config` (returns the configured logo URL, splash logo URL, system name, and header color), `/jupyterlab-branding/logo` (serves the local main logo), and `/jupyterlab-branding/splash-logo` (serves the local splash logo). The splash file is also inlined into PageConfig as a base64 data URI so the custom splash logo paints with the first splash frame
- **Frontend plugin** - applies the splash logo at module load (before activation) so the very first splash animation uses the custom logo, fetches configuration during activation, replaces the `#jp-MainLogo` element, and injects the system name span into the top toolbar spacer. SVG logos are embedded inline, raster images use `<img>` tags

## Favicon

This extension does not override the browser favicon. For JupyterHub deployments, favicon branding is typically configured at the JupyterHub level - refer to your JupyterHub configuration for how the hub overrides favicon for individual user servers.

## Uninstall

```bash
pip uninstall jupyterlab_branding_extension
```
