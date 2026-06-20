# Splash Screen Rebranding - Feasibility

Investigation into whether `jupyterlab_branding_extension` can also rebrand JupyterLab's startup splash screen. Today the extension only mutates `#jp-MainLogo` and the toolbar spacer on `app.restored` (see `src/index.ts`); it has no awareness of `#jupyterlab-splash`. Splash support is strictly additive.

## How the splash actually works

The animation is **not a GIF or animated SVG**. It is pure CSS keyframes over a DOM tree injected by `@jupyterlab/apputils-extension:splash`:

```
#jupyterlab-splash         <- Jupyter logo as background-image (single static SVG)
  #galaxy
    #moon1.orbit -> .planet   (12 px circle)
    #moon2.orbit -> .planet   (16 px circle)
    #moon3.orbit -> .planet   (20 px circle)
```

Each `.orbit` wrapper has a different non-square bounding box (200x140, 132x180, 220x166). A single shared keyframe rotates each wrapper by -720 degrees over 2 s; because the wrappers are non-square and the planet sits at a fixed offset, the dots trace three different ellipses. The closing fade is a 0.5 s `fade-out` keyframe applied via the `.splash-fade` class. The light/dark variants swap planet colours via `#jupyterlab-splash.light` / `.dark` ancestor selectors.

`ISplashScreen.show(isLight)` is called on every theme change as well as at startup (verified in the installed `jlab_core.890f9477a057f68f4ca0.js` bundle), so any custom splash provider gets invoked more than once per session.

## Path A - CSS-only override

Ship a small CSS block from `style/index.css` (or a new `style/splash.css` imported by `style/index.js`) targeting the stable splash selectors:

```css
#jupyterlab-splash {
  background-image: url(/branding/splash-logo);
}
#jupyterlab-splash.light #moon1 .planet {
  background-color: <brand1>;
}
#jupyterlab-splash.light #moon2 .planet {
  background-color: <brand2>;
}
#jupyterlab-splash.light #moon3 .planet {
  background-color: <brand3>;
}
/* same selectors with .dark for dark theme */
```

**Delivers**: centre logo replacement, three planet colours per theme. Orbit motion preserved.

**Does not deliver**: changing the motion, replacing the dot shapes, removing splash entirely, showing a Lottie / animated SVG / video.

**Brittleness**: very low. The splash selectors (`#jupyterlab-splash`, `#moonN`, `.planet`, `.light` / `.dark`) have been stable since JupyterLab 3.x. CSS specificity wins because the extension bundle loads after core.

**Cost**: ~30 lines CSS plus optionally one new traitlet (`splash_logo_uri`) and a small handler addition. The existing `fetchLogoConfig` / `fetchLogoContent` pipeline and authenticated server endpoint generalise to splash with minimal change.

## Path B - Custom `ISplashScreen` provider

`@jupyterlab/apputils:ISplashScreen` is a real public Token (confirmed in the installed bundle). JupyterLab uses the **last registered provider**. Add a second plugin entry in `src/index.ts`:

```ts
const splashPlugin: JupyterFrontEndPlugin<ISplashScreen> = {
  id: 'jupyterlab_branding_extension:splash',
  provides: ISplashScreen,
  activate: () => ({
    show: (light: boolean) => {
      // mount custom DOM into document.body, return DisposableDelegate
      // that removes / fades it out on dispose
    }
  })
};
export default [plugin, splashPlugin];
```

**Delivers**: anything. Replace the entire splash DOM with a custom logo, Lottie animation, animated SVG, video, GIF, custom CSS animation, static image, or empty splash. Light/dark mode is passed in. Fade-out is controlled by the returned `IDisposable`.

**Brittleness**: the Token name is part of JupyterLab's stable public API since 3.0; internal behaviour (when called, with what `light` argument) has not changed through 4.x. Re-test required across major version bumps. Adds `@jupyterlab/apputils` as an explicit peer dependency (already transitively present).

**Cost**: ~80-120 lines TS for the plugin and DOM mount logic, plus whatever CSS the custom splash needs, plus a small handler extension for new traitlets (e.g. `splash_uri`, `splash_html_uri`).

## Path C - Disable default splash, ship our own

Cleanest provider namespacing. Ship a `jupyter-config/labconfig/page_config.json` snippet that disables `@jupyterlab/apputils-extension:splash` via `disabledExtensions`, then provide `ISplashScreen` from this extension. The `jupyter-config/` directory already exists in the tree, so the packaging pattern is familiar; the disable-a-core-plugin pattern is proven by `@jupyter-lsp/jupyterlab-lsp` (which disables `@jupyterlab/lsp-extension:settings` the same way).

**Delivers**: same as Path B, plus a guarantee that the default splash provider is gone entirely. Useful only if a third extension might also register `ISplashScreen` - rare today.

**Brittleness**: same as Path B, plus the disabledExtensions file lives outside the JS bundle, so a distro that strips `jupyter-config/` silently reverts to the default splash. Marginal extra robustness for marginal extra packaging surface.

## Hard limits regardless of path

- Splash _visible duration_ is driven by JupyterLab's startup work (theme load plus restore), not by any CSS variable. The 2 s orbit and 0.5 s fade are minimums, not the total visible time.
- `ISplashScreen.show()` is invoked on every theme change as well as on startup. Any custom provider must handle being called multiple times per session.
- Removing splash entirely requires Path B or C - the default provider always shows something.

## Recommendation

Path A first. 30 lines, ~80% of the desired effect (custom logo + custom palette in the orbit), inherits the existing logo handler infrastructure for one new traitlet, and is nearly impossible to break across JupyterLab versions. If a non-orbit animation becomes a requirement later, upgrade to Path B - the CSS work from Path A is not wasted.
