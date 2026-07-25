# Changelog

All notable changes to this project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.36] - 2026-07-25

### Added

- Stage badge exposes its full value through a `title` attribute, so a long free-form stage that truncates to an ellipsis stays readable on hover

### Changed

- Build Makefile replaced with the shared canonical version used across the JupyterLab extension family (1.31 → 1.35): a project-local Node environment under `.nodeenv/`, dependency self-healing, and a lazy package-version read
- Server-side pytest suite now runs in CI (`.github/workflows/build.yml`) instead of the `make test` target; the canonical Makefile's `test` target is frontend-only, so the CI step is what guards `tests/test_handlers.py`
- Deployment stage badge sized off JupyterLab's UI font scale (`--jp-ui-font-size0`) rather than a fixed pixel size, with tighter line-height and padding so its outline hugs the system-name text

## [1.0.35] - 2026-07-21

### Added

- `short_name` traitlet setting the browser tab title, replacing the default `JupyterLab`
- `stage` traitlet rendering a deployment badge to the right of the system name; `DEV`, `TST`, `STG` and `PRD` each get a colour, any other value renders neutral grey
- `stageColors` setting under Settings → Branding, on by default, to disable the per-stage colours
- `tests/test_handlers.py` covering the server-side configuration path, which previously had no test coverage
- pytest wired into the build: `[tool.pytest.ini_options]` with `pythonpath`, `python -m pytest` in the `test` target, and a pytest check in `check_dependencies`

### Changed

- `appName` is overridden through the `page_config_hook` server setting rather than written into page config at startup, because `jupyterlab_server` re-assigns every `LabConfig` trait on each request; any hook already installed is chained so JupyterHub's token injection survives
- `short_name`, `system_name` and `stage` share one server-side definition of blank, decided by Unicode category with an explicit range table for codepoints no category can express
- Stage badge dark variants follow the active JupyterLab theme rather than the operating-system colour scheme
- README corrected where it described mechanisms the code does not implement: SVG logos are `<img>` data URIs rather than inline embedding, the plugin rewrites `#jp-MainLogo` rather than replacing it, `header_system_name_color` has no effect at default settings, and the application namespace is a plugin provenance prefix rather than the state-database key

### Fixed

- A `short_name` consisting only of whitespace, a byte-order mark, or any zero-ink character blanked the browser tab a few seconds after boot instead of leaving the default title alone
- A bidi override anywhere in a display string reversed what the tab and badge painted, so a value reading `BAL-EMCA` could render as `ACME-LAB`
- The stage badge collapsed to an ellipsis instead of the system name shrinking, because `overflow: hidden` had made it the only shrinkable item in the toolbar
- A stage configured without a system name rendered block-laid-out at the far left instead of right-aligned

## [1.0.34] - 2026-06-21

### Added

- Settings UI under Settings → Branding (`schema/plugin.json`) controlling the system-name appearance: `capitalize` (off by default), `colorMode` (`auto` / `custom`), and `customColor` (hex)
- `.jp-Branding-systemName-uppercase` CSS class re-introduced, now toggled by the `capitalize` UI setting rather than a deployment traitlet
- `@jupyterlab/settingregistry` dependency and `schemaDir: "schema"` in `package.json` so the schema ships and appears in the Settings Editor
- 3 new Jest tests for the `capitalize` parameter of `applySystemName` (31 total)

### Changed

- Plugin now requires `ISettingRegistry`, loads its settings on activation, and re-applies them live on change
- System-name colour and capitalization are controlled per-user through the Settings UI, overriding the deployment-side `header_system_name_color`; `custom` mode falls back to `header_system_name_color` when the hex field is blank, `auto` uses the theme colour `--jp-ui-font-color2`

## [1.0.33] - 2026-06-20

### Added

- `c.Branding.splash_logo_uri` traitlet replacing the JupyterLab startup splash logo with a custom image (SVG or raster)
- Inline data URI for the splash logo via `PageConfig.brandingSplashLogoDataUri` so the custom logo appears instantly with the splash, no network round-trip
- Theme-aware early background (`html, body`) using `prefers-color-scheme` so the page never flashes white before the splash paints
- Server route `/jupyterlab-branding/splash-logo` and matching `SplashLogoFileHandler`
- 4 new Jest tests for `applySplashLogo` covering style injection, selectors, sizing rules, and idempotency

### Changed

- Splash CSS now targets `#jupyterlab-splash #main-logo` and hides the inner inline SVG, leaving the orbiting moons untouched
- Splash logo container fixed at 140x140 px, absolute-centred with `background-size: contain` so the custom logo sits in the same visual area as the default

### Removed

- `c.Branding.header_capitalize_system_name` traitlet and the `jp-Branding-systemName-uppercase` CSS class - users wanting uppercase enter the text in uppercase directly

<!-- <START NEW CHANGELOG ENTRY> -->

<!-- <END NEW CHANGELOG ENTRY> -->
