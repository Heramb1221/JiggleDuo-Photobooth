# JiggleDuo Photobooth

> A browser-based photo strip creator with real-time webcam capture, decorative frame overlays, sticker compositing, and canvas-rendered export — built as a polished, production-inspired React application.

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Canvas API](https://img.shields.io/badge/Canvas_API-HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Status](https://img.shields.io/badge/Status-Active_Development-ff7aa2?style=flat-square)

---

## Live Demo

| Resource | Link |
|---|---|
| Live Application | [jiggleduo-photobooth](https://jiggle-duo-photobooth.vercel.app/) |

---

## About The Project

JiggleDuo Photobooth is a browser-native photo strip application that replicates the experience of a physical photobooth — right in the browser, with zero backend. Users select a decorative frame, take four sequential webcam photos with a 3-second countdown, then enter a decoration mode where they can place stickers, add text stamps, apply CSS filters, and choose a strip background color before downloading the final composite as a PNG.

The core engineering challenge was compositing multiple image layers — raw webcam frames, PNG frame overlays, emoji/SVG-rendered stickers, and styled text — onto a single `<canvas>` element in real time, while maintaining interactive drag-and-drop, resize, and rotation behaviors on each decoration element. All of this runs entirely client-side with no server, no storage, and no external dependencies beyond `react-webcam`.

This project was built as a real deployment for the JiggleDuo brand, and serves as a practical demonstration of browser graphics APIs, event-driven interaction design, and state management in a complex React component.

---

## Project Type

**Frontend Application** — Client-side only, browser-based graphics and media tool.

---

## Project Status

**Active Development** — Core feature set is complete and deployed. Ongoing work includes multi-frame layout support and mobile touch polish.

---

## Why I Built This

The motivation was to build something that felt genuinely useful and visually distinctive — not another CRUD app or dashboard. The technical goals were:

- Understand the HTML5 Canvas API deeply, including layer compositing, coordinate transforms, and image rendering pipelines
- Explore real-time event handling for drag, resize, and rotate interactions on canvas-positioned elements without relying on a canvas library
- Practice managing complex, multi-phase UI state (frame selection → photo capture → decoration → export) in a single React component
- Build something deployable and shareable, with real production considerations like font caching headers and SPA routing on Vercel

---

## Features

### Core Features
- **Frame selection** — Choose from multiple decorative PNG frame overlays before starting
- **Webcam capture** — Live webcam feed via `react-webcam` with 3-second countdown and flash animation
- **Photo upload** — Upload images from device as an alternative to webcam capture
- **Redo last photo** — Remove and retake the most recent photo at any point
- **4-slot photo strip** — Photos are placed sequentially into predefined slots on the strip layout

### Decoration Features
- **Sticker system** — Emoji stickers (hearts, sparkles), text stamps (BFF, LOVE, XOXO), date stamps, and file-based PNG stickers, all rendered to offscreen canvas before compositing
- **Drag, resize, rotate** — Each sticker supports pointer-based drag-to-move, resize via a corner handle, and rotation via a top handle; text stamps support drag and font-size resize
- **Text stamps** — Freeform text input rendered with stroke+fill for legibility on any background
- **Delete** — Selected sticker or text stamp removed via keyboard Delete/Backspace

### Visual Controls
- **6 CSS filters** — Normal, Vintage, Warm, Cool, Noir, Dreamy, applied via `ctx.filter` during canvas draw
- **6 strip background colors** — White, Pink, Lavender, Mint, Cream, Black
- **Download** — Exports the full canvas as a PNG via a programmatic anchor click

### UX Details
- Flash overlay animation on shutter
- Progress dot indicator showing photo count
- Touch event support (`onTouchStart`/`Move`/`End`) for mobile
- Frame thumbnails with hover scale and shadow transitions
- Font face (`CantikaCute`) with Vercel-optimized caching headers

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| UI Framework | React 19 | Declarative state management for multi-phase UI; concurrent features available for future use |
| Language | JavaScript (ES2022) | Project scope did not require TypeScript overhead; functional React patterns kept it clean |
| Graphics | HTML5 Canvas API | Native browser compositing for multi-layer image rendering without a canvas library |
| Webcam | react-webcam 7.2 | Thin abstraction over `getUserMedia` with built-in screenshot and mirror support |
| Styling | Inline styles + CSS | Component-scoped inline styles for layout logic; global CSS for font-face and hover transitions |
| Tooling | Create React App 5 / Webpack | Sufficient for a frontend-only app; no custom build config needed |
| Deployment | Vercel | Zero-config SPA deployment with custom response headers for font caching |
| Performance | web-vitals | Core Web Vitals instrumentation in place |

---

## Architecture

This is a single-component architecture by design. The `Photobooth` component owns all state and rendering because every piece of state affects the canvas redraw — decoupling into child components would require either prop drilling or a context layer that adds complexity without benefit at this scale.

```
App
└── Photobooth
    ├── Phase 1: Frame Selection
    │   └── frameOptions[] → setSelectedFrame()
    │
    ├── Phase 2: Photo Capture (mode = "photo")
    │   ├── <Webcam> → capturePhoto() → countdown → takePhotoNow()
    │   ├── uploadPhoto() → FileReader → addPhoto()
    │   ├── Filter selector → setActiveFilter()
    │   └── Background color selector → setBgColor()
    │
    ├── Phase 3: Decoration (mode = "decorate")
    │   ├── addSticker() → makeStickerImage() → offscreen canvas → Image
    │   ├── addTextStamp() → textStamps state
    │   ├── Pointer events → dragging / resizing state
    │   └── downloadPhoto() → canvas.toDataURL() → <a> click
    │
    └── drawCanvas() (useCallback)
        ├── ctx.fillRect (background)
        ├── photos[].img + ctx.filter (webcam frames)
        ├── frameImgRef (overlay PNG)
        ├── stickers[].img (composited via offscreen canvas)
        └── textStamps[] (ctx.font + strokeText + fillText)
```

**Canvas render pipeline:**

Every state change triggers `drawCanvas` via `useEffect`. The draw order is:

1. Background fill
2. Clipped photo slots with active CSS filter
3. Frame overlay PNG (sits above photos)
4. Sticker images with transform (translate + rotate)
5. Text stamps with stroke + fill
6. Selection handles (bounding boxes and resize/rotate handles) drawn on top

**Sticker rendering:**

Stickers are pre-rendered to an offscreen `<canvas>` via `makeStickerImage()` and converted to `HTMLImageElement` via `toDataURL()`. This means the main canvas draw loop only calls `ctx.drawImage()` — no font rendering per frame.

---

## Folder Structure

```
jiggleduo-photobooth/
├── public/
│   └── assets/
│       ├── fonts/
│       │   └── Cantika Cute Handwriting.otf
│       ├── frames/
│       │   ├── heart-frame.png
│       │   ├── heart-frame-2.png
│       │   ├── heart-frame-3.png
│       │   └── heart-frame-4.png
│       ├── stickers/
│       │   ├── leaf.png
│       │   └── sparkles.png
│       └── logo/
│           └── jiggleduo-logo.png
├── src/
│   ├── components/
│   │   └── Photobooth.js       # Core application logic and canvas rendering
│   ├── styles/
│   │   └── global.css          # Font face declaration, body defaults, button hover
│   ├── App.js                  # Root layout: logo header + Photobooth mount
│   ├── App.css
│   ├── index.js
│   └── index.css
├── vercel.json                 # SPA rewrite + caching headers
└── package.json
```

---

## Installation

```bash
# Clone the repository
git clone https://github.com/Heramb1221/JiggleDuo-Photobooth.git
cd jiggleduo-photobooth

# Install dependencies
npm install

# Start development server
npm start
# → http://localhost:3000
```

**Requirements:** Node.js 18+, a browser with webcam access (`getUserMedia`).

**Note:** Webcam capture requires either `localhost` or an HTTPS origin. Running on plain `http://` over a local network will block camera access per browser security policy.

---

## Usage

1. **Select a frame** — Choose one of the available decorative photo strip frames.
2. **Capture 4 photos** — Click "Take Photo" for a 3-second countdown capture, or "Upload" to use an image from your device. Use the redo button (⟳) to retake the last photo.
3. **Apply a filter** — Select from Normal, Vintage, Warm, Cool, Noir, or Dreamy.
4. **Choose a background** — Pick the strip background color.
5. **Decorate** — After all 4 photos are captured, decoration mode opens automatically. Add stickers, emoji, date stamps, or custom text. Drag elements to reposition; use the corner handle to resize; use the top handle to rotate. Press Delete to remove a selected element.
6. **Download** — Click "Download strip" to save the final composite as a PNG.

---

## Screenshots

| Preview | Description |
|----------|-------------|
| <img src="https://github.com/user-attachments/assets/34cbce2d-a511-4c51-a939-b9924512cc0e" width="100%"> | **Frame Selection** |
| <img src="https://github.com/user-attachments/assets/05667f12-18b4-46c3-a9cc-6de372aef362" width="100%"> | **Photo Capture** |


---

## Performance Considerations

**Canvas redraw on every state change** — `drawCanvas` is called via `useEffect` on all relevant state. For a four-photo strip at ~2500×2500px, this is acceptable; each redraw is synchronous and completes in <16ms on modern hardware. A `requestAnimationFrame` loop would be wasteful here since redraws are event-driven, not continuous.

**Offscreen sticker pre-rendering** — Stickers are rendered once to an offscreen canvas and stored as `HTMLImageElement`. The main draw loop only calls `drawImage()`, avoiding repeated font layout and path operations per frame.

**Image scaling** — Webcam frames are captured at 953×599 and scaled to fit the slot on first add. The scale factor is stored in state; no resampling occurs on drag/reposition.

**Potential bottleneck** — The `useCallback` dependency array for `drawCanvas` includes all state arrays. With many stickers, this could trigger unnecessary re-renders. A `useRef`-based draw loop would be more optimal at scale.

---

## Tradeoffs & Limitations

| Decision | Tradeoff |
|---|---|
| Single large component | Simpler reasoning about canvas draw order; harder to unit-test individual behaviors in isolation |
| Create React App | Zero configuration cost; limited control over Webpack config without ejecting |
| Inline styles for component layout | Avoids CSS class collision; verbose and harder to theme |
| No canvas library (e.g. Fabric.js) | Full control over render pipeline and interaction model; more code to maintain |
| `ctx.filter` for photo effects | Clean implementation; not composable — only one filter applies at a time |

---

## Known Issues

- The default `App.test.js` references a `"learn react"` text element that no longer exists — the test will fail. It is a leftover from CRA scaffolding and should be replaced.
- On some mobile browsers, `getScreenshot()` from `react-webcam` returns a lower-resolution image than the `videoConstraints` specify due to device camera limitations.
- Touch interactions for rotate (top handle) can be imprecise on small screens due to the handle's 16px hit target.
- Canvas dimensions are hardcoded to the first loaded frame image. Switching frames after photos are taken is not supported in the current flow.

---

## Challenges Faced

**Coordinate mapping for pointer events** — The canvas is displayed at 200px wide in CSS but internally renders at ~1200px (the frame's native width). All pointer event coordinates must be scaled using `canvas.getBoundingClientRect()` and the CSS-to-canvas scale ratio. Getting this right for both mouse and touch events, and across all three interaction modes (drag, resize, rotate), required careful coordinate math.

**Sticker rotation hit-testing** — Detecting whether a pointer lands on a rotated sticker requires rotating the pointer coordinates into the sticker's local frame, not the other way around. The inverse rotation transform (`cos(-angle)`, `sin(-angle)`) is applied to the canvas-space pointer before comparing against the unrotated bounding box.

**Draw order and layer management** — The frame overlay PNG must sit above the photos but below stickers, while selection handles must sit above everything. This required a strict, explicit draw order rather than CSS z-index layering.

**Font rendering consistency** — The custom `CantikaCute` font must be loaded before `drawCanvas` runs, or text stamps render in a fallback font. Font loading is handled via a CSS `@font-face` declaration; canvas rendering picks it up once the font is in the browser's font cache.

---

## What I Learned

- The HTML5 Canvas 2D API in depth: `save()`/`restore()`, `clip()`, `filter`, `ctx.transform`, offscreen canvas patterns, and `toDataURL()`
- Coordinate system management: mapping between CSS display space and canvas pixel space for accurate pointer interaction
- Inverse transform math for hit-testing rotated elements without a physics or canvas library
- Vercel deployment configuration: custom response headers, SPA rewrites, and cache-control strategies for static assets
- The cost of a single-component architecture at scale, and where the natural seams for refactoring into custom hooks would be
- Browser media APIs: `getUserMedia`, `react-webcam`'s abstraction layer, and the constraints that affect camera resolution on mobile

---

## License

MIT License. See [LICENSE](./LICENSE) for details.

---

## Contact

**Heramb Chaudhari**

[![GitHub](https://img.shields.io/badge/GitHub-Heramb1221-black?style=for-the-badge&logo=github)](https://github.com/Heramb1221)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Heramb%20Chaudhari-blue?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/heramb-chaudhari)

[![Email](https://img.shields.io/badge/Email-hchaudhari1221%40gmail.com-red?style=for-the-badge&logo=gmail)](mailto:hchaudhari1221@gmail.com)

---

*Built with React 19 and the HTML5 Canvas API.*
