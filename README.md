# Motionmark

A premium browser-based brand motion studio. Design a logo lockup, choreograph it through five signature animation systems, cut a 16:9 showreel or a 9:16 brand reel, render twelve product mockup plates locally, and export frame-accurate video — all in the browser.

## Highlights

- **Five wide styles** — Reveal, Blueprint, Pulse, Lockup and Pattern, each with a polished end card.
- **Showreel** — all five styles joined by sliding wipes (25.3s).
- **Brand Reel** — an 8-scene 9:16 sequence with per-scene toggles and short/medium/long timing, adaptively compressed to the 15s cap without dropping a scene.
- **Live canvas stage** — 60 FPS preview, scrubbing, frame stepping, Stage/Phone/Deck presentation modes and fullscreen.
- **Brand controls** — logo upload, tinting, outlines, scale, brand name, tagline, website, five typefaces, weight and tracking; curated colour palettes.
- **Twelve local plates** — tee, tote, lanyard, mug, cap, cards, hoodie, poster, notebook, bottle, sticker sheet and pouch, drawn with Canvas 2D from the current mark and palette. The Brand Reel pages through all twelve in an editorial grid. No API, no uploads. Each plate can be downloaded as a 675 × 1200 JPEG.
- **Animation sound** — synthesized Web Audio score with ambient beds and sparse accent cues for wipes, page turns and the end card. Toggle it from the top bar; the preference is saved. The same score is rendered offline and mixed into exports.
- **Video export** — 1920×1080 or 1080×1920 at 60 FPS using `captureStream` + `MediaRecorder`, with an offline frame-by-frame render path and a synchronized audio track. MP4 (H.264/AAC) is attempted first; browsers without a working MP4 encoder automatically fall back to WebM (VP9/Opus).
- **Autosave** — brand configuration is stored in `localStorage` under `motionmark.studio.v1`; sound preference under `motionmark.sound.v1`.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Lucide React · Canvas 2D · MediaRecorder. No animation or video libraries.

## Quick start

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

### Production

```bash
npm run build
npm start
```

`npm start` serves the production build through `server.mjs` (default port `4173`, override with `PORT`).

### Deploy to Vercel

1. Push the project to GitHub.
2. Import the repository at [vercel.com/new](https://vercel.com/new). The included `vercel.json` selects the Vite framework and sets `npm run build` with `dist/` as the output.
3. Deploy. No environment variables or API keys are required — rendering, audio and video export all run in the browser. The build injects Vercel's production domain into the Open Graph/Twitter image URLs automatically.

Brand settings and uploaded logos live in `localStorage`, so they are per-browser and do not travel with the deployment. A fresh domain starts from the default brand.

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check and build to `dist/` |
| `npm start` | Serve the production build |
| `npm run preview` | Vite preview server |
| `npm run lint` | Oxlint |

## Typefaces

All typefaces are self-hosted from `public/fonts` as woff2 variable fonts — DM Sans, Fraunces, Space Grotesk, Syne and Bricolage Grotesque. Latin and latin-ext subsets are included, and the studio makes no requests to Google Fonts at runtime.

## Shortcuts

- `Space` — play / pause (restarts from the top at the end)
- `←` / `→` — step one frame, hold `Shift` to step one second

## Export notes

- The synthesized animation soundtrack is rendered offline and mixed into the exported video (MP4/AAC or WebM/Opus).
- Keep the tab active while recording; capture is paced in real time.
- Use the export menu to force MP4 or WebM. If an advertised MP4 encoder produces no frames, the studio retries automatically as WebM and tells you.
- WebM files from `MediaRecorder` may not carry a duration header; they still play and can be remuxed by most editors.

## Structure

```
public/
  favicon.svg           browser icon
  icons.svg             shared icon sprite
  og.jpg                social preview image (1200 × 630)
  fonts/                self-hosted woff2 typefaces (latin + latin-ext)
src/
  App.tsx               studio state, top bar, sound toggle, export handling
  components/           Stage, Sidebar (Brand/Colour/Motion/Timing/Plates), UI primitives
  fonts.css             @font-face declarations for the local typefaces
  lib/
    renderer.ts         frame orchestration for wide styles, showreel, end cards
    styles.ts           five wide animation renderers
    reel.ts             eight 9:16 brand-reel scenes, including the 12-plate merch grid
    products.ts         twelve local canvas product mockups
    audio.ts            synthesized Web Audio beds and animation cues
    fonts.ts            waits for the selected face before export capture
    videoExport.ts      MediaRecorder export engine
    presets.ts          defaults, palettes, scene metadata, durations
server.mjs              production static server
```

Brand assets and settings stay on the device. Nothing is uploaded.
