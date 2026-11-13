# Acceptance Criteria - jupyterlab_branding_extension

Deployment branding of JupyterLab: main logo, splash logo, system name, stage badge and browser tab title, set through traitlets.

## Authors

- `@kj` Konrad Jelen

## Logos `LOGO`

Main area logo and startup splash logo

- log: 2026-11-13T06:59:26Z @kj category created

- [x] `ACC-LOGO-1-MAIN-LOGO` **Custom main logo** - HIGH; configured logo_uri replaces the content of #jp-MainLogo; SVG as an img data URI with padding from the viewBox, raster as an img with the served URL
  - evidence: jest describe applyLogo and computeSvgPadding, 51 jest tests passed at 1.0.43
  - test: jlpm test -t applyLogo
  - test-tags: UNIT
  - log: 2026-11-13T06:59:26Z @kj added
  - log: 2026-11-13T07:02:15Z @kj closed
- [x] `ACC-LOGO-2-SPLASH` **Custom splash logo** - HIGH; configured splash_logo_uri replaces the centre logo of the startup splash through an injected style; the orbits stay
  - evidence: jest describe applySplashLogo, 51 jest tests passed at 1.0.43
  - test: jlpm test -t applySplashLogo
  - test-tags: UNIT
  - log: 2026-11-13T06:59:26Z @kj added
  - log: 2026-11-13T07:02:16Z @kj closed
- [x] `ACC-LOGO-3-SOURCES` **Logo source forms** - MEDIUM; logo_uri and splash_logo_uri accept a local path, a file:// URI and an https:// URL; a remote logo is fetched once at server start
  - evidence: pytest test_configured_logo_is_served_with_its_content_type (local path), test_file_uri_logo_resolves_to_the_served_file, test_https_logo_is_fetched_once_at_server_start; 63 pytest passed
  - test: pytest: local path served; file:// and https:// resolve to a served file
  - test-tags: UNIT
  - log: 2026-11-13T06:59:26Z @kj added
  - log: 2026-11-13T07:02:16Z @kj local path proven by test_configured_logo_is_served_with_its_content_type; file:// and https:// have no test
  - log: 2026-11-13T09:17:37Z @kj closed
- [x] `ACC-LOGO-4-SERVE` **Authenticated logo endpoints** - HIGH; /jupyterlab-branding/config, /logo and /splash-logo need authentication; /logo answers with the file's content type; an unconfigured logo answers 404
  - evidence: pytest test_configured_logo_is_served_with_its_content_type, test_unconfigured_splash_logo_is_not_found; check_auth.py passes
  - test: pytest tests/test_handlers.py -k logo; python .github/scripts/check_auth.py
  - test-tags: UNIT, INTEGRATION
  - log: 2026-11-13T06:59:27Z @kj added
  - log: 2026-11-13T07:02:16Z @kj closed

## Header `HEADER`

System name, stage badge, tab title and their settings

- log: 2026-11-13T06:59:27Z @kj category created

- [x] `ACC-HEADER-5-SYSTEM-NAME` **System name in top toolbar** - HIGH; system_name renders as one span in the top toolbar spacer; an empty or blank name renders nothing; re-render does not duplicate
  - evidence: jest describe applySystemName, 51 jest tests passed at 1.0.43
  - test: jlpm test -t applySystemName
  - test-tags: UNIT
  - log: 2026-11-13T06:59:27Z @kj added
  - log: 2026-11-13T07:02:16Z @kj closed
- [x] `ACC-HEADER-6-STAGE` **Stage badge** - HIGH; stage renders as an outlined badge right of the system name; DEV, TST, STG, PRD get their own colour class, case-insensitive; other values stay neutral; empty renders nothing
  - evidence: jest describe applyStage and applyHeader, 51 jest tests passed at 1.0.43
  - test: jlpm test -t applyStage
  - test-tags: UNIT
  - log: 2026-11-13T06:59:27Z @kj added
  - log: 2026-11-13T07:02:16Z @kj closed
- [x] `ACC-HEADER-7-TAB-TITLE` **Browser tab title** - HIGH; short_name becomes the appName page-config option through a chained page_config_hook; a blank short_name leaves the title alone; appNamespace is not written
  - evidence: pytest test_short_name_is_trimmed_on_both_paths, test_blank_short_name_leaves_the_title_alone, test_hook_never_writes_app_namespace, test_existing_page_config_hook_is_chained_not_replaced
  - test: pytest tests/test_handlers.py -k 'short_name or hook'
  - test-tags: UNIT
  - log: 2026-11-13T06:59:27Z @kj added
  - log: 2026-11-13T07:02:16Z @kj closed
- [x] `ACC-HEADER-8-TRAITLETS` **Traitlets reach the frontend** - MEDIUM; system_name, stage and header_system_name_color set on c.Branding are returned by /jupyterlab-branding/config, with invisible characters cleaned
  - evidence: pytest test_stage_and_system_name_reach_the_config_endpoint, test_blank_stage_and_system_name_are_cleaned_server_side
  - test: pytest tests/test_handlers.py -k 'stage or invisible'
  - test-tags: UNIT
  - log: 2026-11-13T06:59:27Z @kj added
  - log: 2026-11-13T07:02:16Z @kj closed
- [x] `ACC-HEADER-9-SETTINGS` **Per-user appearance settings** - MEDIUM; capitalize, colorMode, customColor and stageColors from the Settings Editor change the header without a reload; customColor blank in custom mode uses header_system_name_color
  - evidence: jest src/**tests**/activate.spec.ts 'should re-render the header when a setting changes' drives the settings changed signal of the activated plugin; 52 jest tests passed
  - test: jlpm test -t applyHeader; manual: change a setting, header updates live
  - test-tags: UNIT, MANUAL
  - log: 2026-11-13T06:59:27Z @kj added
  - log: 2026-11-13T07:02:16Z @kj applyHeader options proven by jest; the live update on a settings change has no test
  - log: 2026-11-13T09:17:37Z @kj closed
