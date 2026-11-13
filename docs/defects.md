# Defects - jupyterlab_branding_extension

Bugs and regressions in the branding extension.

## Authors

- `@kj` Konrad Jelen

## Server `SERVER`

Tornado handlers and the server-side configuration

- log: 2026-11-13T06:59:27Z @kj category created

- [x] `DEF-SERVER-1-DUP-HANDLER` **Two identical logo file handlers** - MINOR; LogoFileHandler and SplashLogoFileHandler in handlers.py are the same 15 lines except the settings key and the 404 text; a fix to one is missed in the other
  - evidence: SplashLogoFileHandler subclasses LogoFileHandler and overrides two class attributes; pytest 59 passed, check_auth.py passes
  - root-cause: 2026-11-13T07:02:15Z @kj the splash handler was added as a copy of the logo handler
  - test-tags: UNIT
  - repro: diff the two classes in jupyterlab_branding_extension/handlers.py
  - log: 2026-11-13T06:59:27Z @kj added
  - log: 2026-11-13T06:59:33Z @kj edited test-tags added "UNIT"
  - log: 2026-11-13T07:02:15Z @kj closed
- [x] `DEF-SERVER-2-ENDPOINT-TESTS` **Logo endpoints have no test** - MINOR; no test requests /jupyterlab-branding/config, /logo or /splash-logo; a broken content type or route reaches users unseen
  - evidence: tests/test_handlers.py: test_configured_logo_is_served_with_its_content_type and test_unconfigured_splash_logo_is_not_found use jp_fetch; pytest 59 passed
  - root-cause: 2026-11-13T07:02:15Z @kj tests called setup_handlers on a fake web app only, never a running server
  - test-tags: UNIT
  - repro: grep jp_fetch tests/ prints nothing
  - log: 2026-11-13T06:59:27Z @kj added
  - log: 2026-11-13T06:59:33Z @kj edited test-tags added "UNIT"
  - log: 2026-11-13T07:02:15Z @kj closed
- [-] `DEF-SERVER-3-TEMP-LOGO` **Remote logo temp file is never removed** - MINOR; _fetch_remote_logo writes one jlab-branding-* file to the temp folder at every server start with an https logo and never deletes it
  - test-tags: UNIT
  - repro: start the server twice with logo_uri=https://...; two files in the temp folder
  - log: 2026-11-13T06:59:27Z @kj added
  - log: 2026-11-13T06:59:33Z @kj edited test-tags added "UNIT"
  - log: 2026-11-13T07:02:34Z @kj rejected: one small file per server start in a folder the system clears; removal at exit adds code for no user-visible gain
- [x] `DEF-SERVER-6-MISSING-LOGO` **Missing logo file removes the system name and stage badge** - MAJOR; A logo_uri path that names no file was published as logo_url; the frontend fetch answered 404, aborted, and the system name and stage badge were never rendered
  - evidence: tests/test_handlers.py::test_missing_logo_file_still_publishes_name_and_stage passes; pytest 61 passed
  - repro: set c.Branding.logo_uri to a path with no file plus system_name and stage, start the lab: no name, no badge
  - test-tags: UNIT
  - root-cause: 2026-11-13T07:26:07Z @kj _resolve_logo_source returned any local path without checking that the file exists, while the remote branch already returned empty on a failed fetch
  - log: 2026-11-13T07:26:07Z @kj added
  - log: 2026-11-13T07:26:13Z @kj closed
- [x] `DEF-SERVER-7-SVG-SUFFIX` **Remote SVG with a generic Content-Type is served as text** - MINOR; _fetch_remote_logo took the temp file suffix from any Content-Type; text/plain gave .txt and octet-stream gave .bin, so the .svg fallback never ran and the logo was served with a non-image type
  - evidence: tests/test_handlers.py::test_remote_svg_with_a_generic_content_type_keeps_its_suffix passes; pytest 61 passed
  - repro: logo_uri https://host/logo.svg answered with Content-Type text/plain: the cached file ends .txt
  - test-tags: UNIT
  - root-cause: 2026-11-13T07:26:07Z @kj mimetypes.guess_extension returns .txt and .bin for the generic types, so the 'if not ext' fallback to the URL suffix was unreachable
  - log: 2026-11-13T07:26:07Z @kj added
  - log: 2026-11-13T07:26:13Z @kj closed

## Frontend `FRONT`

The plugin in src/index.ts and src/handler.ts

- log: 2026-11-13T06:59:27Z @kj category created

- [-] `DEF-FRONT-4-RASTER-TWICE` **Raster logo downloaded twice** - MINOR; fetchLogoContent reads every logo as text to learn its content type; for a raster logo the img element then requests the same URL again
  - test-tags: UNIT
  - repro: configure a PNG logo, open the lab, network tab shows two requests for /jupyterlab-branding/logo
  - log: 2026-11-13T06:59:27Z @kj added
  - log: 2026-11-13T06:59:34Z @kj edited test-tags added "UNIT"
  - log: 2026-11-13T07:02:35Z @kj rejected: a logo is a few kilobytes; avoiding the second request needs a content type field in the config response, a change of the API
- [-] `DEF-FRONT-5-ZERO-VIEWBOX` **Zero viewBox dimension is not refused** - MINOR; computeSvgPadding returns only when width and height are both 0; one zero dimension divides by zero and yields an invalid padding the browser ignores
  - test-tags: UNIT
  - repro: applyLogo with an SVG whose viewBox is '0 0 0 10'
  - log: 2026-11-13T06:59:27Z @kj added
  - log: 2026-11-13T06:59:34Z @kj edited test-tags added "UNIT"
  - log: 2026-11-13T07:02:35Z @kj rejected: exotic input: an SVG with one zero viewBox dimension paints nothing anyway and the invalid padding is ignored
