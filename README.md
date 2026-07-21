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
- **Stage badge** - an outlined `DEV` / `TST` / `STG` / `PRD` badge beside the system name, colour-coded per stage, accepting any custom value
- **Browser tab title** - replace the `JupyterLab` browser tab name with a short brand name
- **Configurable via traitlets** - set `logo_uri`, `splash_logo_uri`, `system_name`, `header_system_name_color`, `short_name`, and `stage` in `jupyter_lab_config.py`
- **Local and remote logos** - supports `file://` paths, `https://` URLs, and local filesystem paths
- **SVG data URIs** - SVG logos are served as `<img>` data URIs, so the browser sizes them from the viewBox; note that an SVG in an `<img>` cannot see the page's `currentColor` or CSS variables, so theme-following fills will not adapt
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

# Fallback colour - applies only when a user sets the Settings UI colour
# mode to Custom and leaves the custom hex blank (see below)
c.Branding.header_system_name_color = "#ff8800"
```

The system name is rendered inside the existing JupyterLab header toolbar spacer (`jp-Toolbar-spacer`). Its colour is governed by the per-user Settings UI described below, which defaults to `Auto` - the JupyterLab sidebar font colour (`--jp-ui-font-color2`), adapting to light/dark themes automatically. `header_system_name_color` therefore has no effect at default settings: it applies only when a user selects colour mode `Custom` and leaves the custom hex blank. Leave `system_name` empty to disable this feature.

### Browser tab title

```python
# Browser tab reads "GalaxaLabs" instead of "JupyterLab"
c.Branding.short_name = "GalaxaLabs"
```

Two mechanisms cooperate. JupyterLab renders `document.title` from the `appName` page-config option, and its `apputils` state plugin rewrites the title on every state-database change - so `appName` is what makes the branding survive. It cannot simply be written into page config at startup, because `jupyterlab_server` re-assigns every `LabConfig` trait (including `app_name`) on each request; the extension therefore overrides it through the `page_config_hook` server setting, which runs after that step and chains any hook already installed. The frontend additionally assigns `document.title` at module load to paint the branded title ahead of the first rewrite. The application namespace is left untouched; it is only a provenance prefix for plugins, and workspace and layout identity come from the separate `workspace` page-config option. Leave `short_name` empty to keep the JupyterLab default. Note that `static/index.html` ships a build-time `<title>JupyterLab</title>`, visible for the instant before JavaScript runs.

### Stage badge

```python
# Renders a "PRD" badge to the right of the system name
c.Branding.stage = "PRD"
```

The stage is rendered as an outlined rectangle to the right of the system name, with text and border sharing the stage colour. `DEV`, `TST`, `STG` and `PRD` each get a dedicated colour (green, blue, orange, red); any other value renders neutral grey, so free-form stage names work. Matching is case-insensitive, and the badge is always displayed in uppercase. Long stage values are capped at 12em and ellipsised; note that `system_name` is not capped, so a long system name can still widen the header. Colours follow the active JupyterLab theme, not the operating-system colour scheme. Leave `stage` empty to render no badge.

### System name appearance (Settings UI)

The colour and capitalization of the system name are controlled per-user through **Settings → Settings Editor → Branding**, which overrides the deployment-side `header_system_name_color`:

- **Capitalize system name** - off by default; when on, renders the name in uppercase via CSS `text-transform`
- **System name colour mode** - `Auto` uses the JupyterLab theme colour (`--jp-ui-font-color2`, matches the sidebar font); `Custom` uses the hex colour below
- **Custom hex colour** - the hex value (e.g. `#ff8800`) applied when colour mode is `Custom`; when left blank it falls back to the deployment-side `header_system_name_color`
- **Colour the stage badge** - on by default, using the per-stage colours; turn it off to render every stage badge in neutral grey

Settings changes apply live without a reload. The `system_name` text itself remains set by the deployment config (`c.Branding.system_name`).

## How It Works

The extension has two components:

- **Server extension** - exposes `/jupyterlab-branding/config` (returns the configured logo URL, splash logo URL, system name, header color, and stage), `/jupyterlab-branding/logo` (serves the local main logo), and `/jupyterlab-branding/splash-logo` (serves the local splash logo). The splash file is also inlined into PageConfig as a base64 data URI so the custom splash logo paints with the first splash frame
- **Frontend plugin** - applies the splash logo at module load (before activation) so the very first splash animation uses the custom logo, fetches configuration during activation, rewrites the contents of the `#jp-MainLogo` element, and injects the system name and stage badge into the top toolbar spacer. Both SVG and raster logos are rendered with `<img>` tags - SVGs as data URIs

## Favicon

This extension does not override the browser favicon. For JupyterHub deployments, favicon branding is typically configured at the JupyterHub level - refer to your JupyterHub configuration for how the hub overrides favicon for individual user servers.

## Uninstall

```bash
pip uninstall jupyterlab_branding_extension
```
