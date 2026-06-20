# Changelog

All notable changes to this project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
