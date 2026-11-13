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

`out/` is the deployable static site. `npm test` checks the built page through an actual HTTP server, including asset availability, local navigation/ARIA targets, server-rendered content, and safe preview-server responses. Run the build before the tests. The preview server binds to loopback by default; set `HOST=0.0.0.0` if you need device/LAN access, and `PORT` to choose another port.

## What works

- Sticky hero covered by subsequent sections; document progress with spring smoothing.
- Scroll-derived hero scaling/fading when the viewport can safely contain it.
- Header/promo thresholds initialized from restored scroll positions.
- Alternating left/right section fades scrubbed directly by viewport scroll progress; keyboard focus reveals content immediately. Hero blur entrances, counters, and a scroll-driven setup timeline.
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

Visual/browser playback was not verified in the original build environment because no browser renderer was available. Before demanding pixel parity, compare the reference and this page at desktop, mobile, short landscape, and reduced-motion settings; test touch, keyboard, dialogs, and resize in a real browser.
