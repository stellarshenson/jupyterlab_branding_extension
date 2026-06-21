# Changelog

All notable changes to this project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
