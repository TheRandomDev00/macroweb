# Informaal — Scroll Experience

A responsive, independently built interface study inspired by [Informaal Frog](https://www.informaal.com/). Built with Next.js App Router, React, TypeScript, Tailwind, Motion for React, and Canvas 2D. Static export; no runtime backend or external API is required.

## Run locally

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The development script uses webpack for compatibility with Termux's WebAssembly SWC compiler as well as desktop environments.

## Production

```sh
npm run typecheck
npm run build
npm test
npm run preview
```

`out/` is the deployable static site. `npm test` checks the built page through an actual HTTP server, including asset availability, local navigation/ARIA targets, server-rendered content, safe preview-server responses, scene math, invalid metrics, and the exported pinning CSS. Run the build before the tests. The preview server binds to loopback by default; set `HOST=0.0.0.0` if you need device/LAN access, and `PORT` to choose another port.

## What works

- A shared sticky viewport inside a bounded native scroll area: sections replace one another with alternating horizontal entrances and simultaneous outgoing fades. Header and progress share that scroll source.
- Three longer chapters group discovery/setup, paid/free tools, and community/support. Each travels vertically through its full content before the next chapter enters. Hash links, browser back/forward, and section controls navigate the scroll timeline.
- Header/promo thresholds initialized from restored scroll positions.
- Wheel, touch, and keyboard scrolling stay native and unrestricted, including during crossings. When native scroll updates stop for 48 ms during a crossing, the chapter continues in the same direction at the last measured scroll velocity until it reaches the transition boundary. New input cancels continuation immediately. Topic links retain cubic ease-out navigation. Outgoing chapters recede into depth, sink downward, tilt, soften, and fade with a blue underwater tint. Inactive panels are inert; reduced-motion and no-JavaScript modes retain an ordinary readable vertical page. Hero blur entrances, counters, and a scroll-driven setup timeline.
- A persistent blue Canvas particle network with proximity-based connections, hidden-tab suspension, and CSS ambient orbs.
- Three keyboard-operable carousel previews; an interactive routine preview.
- Search, category filters, monthly/one-time pricing, empty state, and native product dialogs.
- Mobile navigation, animated accessible FAQ, anchor navigation, and reduced-motion behavior.
- Blue accents and translucent, frosted buttons/cards with backdrop blur.
- Self-hosted fonts and imagery; readable server output if animation JavaScript is unavailable.

Products open detail previews with links to the official store. Checkout, downloads, support, accounts, and billing are provided by the original site, not this project. No fake reviews or fabricated customer activity are included.

## Content and assets

`src/content/landing.ts` contains the typed catalogue and FAQ. Product prices/versions and activity figures are snapshots of the original site's public catalogue/statistics from November 13, 2026, not live offers. Artwork, logo, screenshot, and fonts were retrieved from the reference. See `ASSETS.md` for attribution. Verify current product terms on the official site.

The page identifies itself as an independent study, and its metadata requests no indexing. Brand artwork should be replaced or used with the appropriate rights before a separate commercial launch.

## Architecture

- `src/app`: server-rendered page composition and metadata.
- `src/components/sections`: independent page sections.
- `src/components/motion`: animation policy and reusable primitives.
- `src/components/effects`: Canvas and CSS decorations.
- `src/hooks/useScrollThreshold.ts`: threshold events without per-frame React state.
- `src/styles`: shared tokens, gradients, keyframes, and responsive rules.
- `scripts/serve.mjs`: dependency-free static preview server.

The blank-opening regression was reproduced in real Chromium: the exported CSS lacked the scene positioning rules, so the controller measured the full page as its viewport and generated roughly 51,000px of scroll space. Builds now clear generated caches and verify the exported CSS before succeeding. The controller measures the final layout inside one bounded native scrollport, commits visibility atomically, never scrolls in response to resize measurements, and falls back to normal flow if geometry or sticky positioning fails.

Run the real-browser regression suite after building:

```sh
CHROMIUM_PATH=/absolute/path/to/chromium npm run test:browser
```

The suite uses actual browser layout and resize observers, checks desktop/mobile/landscape scrolling and interactions, removes pinning CSS to verify safe fallback, and checks reduced motion, no JavaScript, and an oversized embedded viewport. Screenshots are saved under `.qa/browser/` (ignored). A Chromium executable is required; the test does not download or install a browser automatically.
