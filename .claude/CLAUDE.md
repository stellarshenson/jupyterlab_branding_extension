<!-- @import /home/lab/workspace/.claude/CLAUDE.md -->

# Project-Specific Configuration

This file imports workspace-level configuration from `/home/lab/workspace/.claude/CLAUDE.md`.
All workspace rules apply. Project-specific rules below strengthen or extend them.

The workspace `/home/lab/workspace/.claude/` directory contains additional instruction files
(MERMAID.md, NOTEBOOK.md, DATASCIENCE.md, GIT.md, and others) referenced by CLAUDE.md.
Consult workspace CLAUDE.md and the .claude directory to discover all applicable standards.

## Mandatory Bans (Reinforced)

The following workspace rules are STRICTLY ENFORCED for this project:

- **No automatic git tags** - only create tags when user explicitly requests
- **No automatic version changes** - only modify version in package.json/pyproject.toml/etc. when user explicitly requests
- **No automatic publishing** - never run `make publish`, `npm publish`, `twine upload`, or similar without explicit user request
- **No manual package installs if Makefile exists** - use `make install` or equivalent Makefile targets, not direct `pip install`/`uv install`/`npm install`
- **No automatic git commits or pushes** - only when user explicitly requests

## Project Context

JupyterLab 4.x frontend extension that replaces the default JupyterLab main area logo with a custom logo. Built from the official `jupyterlab/extension-template` (Copier v4.5.1). TypeScript frontend-only extension with no server component.

- **npm package**: `jupyterlab_branding_extension`
- **PyPI package**: `jupyterlab_branding_extension`
- **Technology stack**: TypeScript, JupyterLab 4, Lumino widgets
- **Build system**: hatchling (Python), jlpm/webpack (JS)
- **GitHub owner**: `stellarshenson`

## Strengthened Rules

- Always use `make install` for building and installing - never raw `jlpm`, `npm`, or `pip` commands
- Always track `package.json` and `package-lock.json` in git
- Follow JUPYTERLAB_EXTENSION.md standards for all extension development work
