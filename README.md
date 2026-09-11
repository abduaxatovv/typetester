# TypeTester

A fast, **100% offline-first** typing test for **Windows (Tauri)**, **Android and iOS (Capacitor)**, and the **web**.

TypeTester has no accounts, no network calls and no remote assets. Every test mode, word list, quote, sound and chart is bundled with the app and stored locally on your device.

![TypeTester](src-tauri/icons/icon.png)

---

## Features

- **Test modes**: time (15–120 s), words (10–50), quotes, custom texts (`.txt` import or paste) and zen (no errors, no time limit).
- **Languages**: English, Uzbek and Russian word lists and quotes — all bundled.
- **Live metrics**: WPM, raw WPM, accuracy, errors and a progress bar, refreshed at 120 ms without re-rendering the text block.
- **Detailed results**: WPM, raw WPM, accuracy, consistency, keypresses, errors committed vs. corrected, and the timeline of your keystrokes.
- **History**: last 200 tests, filterable and sortable, deletable, exportable as JSON.
- **Statistics**: WPM / accuracy over time charts, per-mode personal bests, exponential moving average line.
- **17 achievements** (first test, 100% accuracy, high WPM, off-by-one discipline, language badges, streaks, …) that unlock as you type.
- **Custom texts**: create, edit, delete, import from `.txt`, one tap to start a test on any text.
- **Full settings**:
  - Appearance: dark / light, 10 accent hues, text opacity, font size.
  - Typing: cursor style (block/bar/underline), animated caret, smooth scroll.
  - Defaults: mode, time, word count, language for every new test.
  - Sound: synthesized keypress / error blips via the Web Audio API — no audio files.
  - Data: export a full backup, or import one with validation *before* anything is applied.
  - Accessibility: reduced motion, high contrast, large text.
- **Keyboard shortcuts**: `Ctrl+R` restart, `Esc` pause, `Ctrl+,` settings, `Ctrl+H` history. Configurable **quick restart keys** (Settings → Quick restart) — enable `Esc`, `Tab` and/or `Alt` to instantly restart the active test in monkeytype style.
- **Works on touch**: a hidden textarea drives `beforeinput`, so hardware and virtual keyboards (mobile) type identically. `Tab`/`Enter` map to a space.

## Tech stack

| Layer | Choice |
| --- | --- |
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 (CSS-first `@theme` tokens) |
| Routing | React Router 7 — `HashRouter` only (works from `file://`, Tauri, Capacitor) |
| State | Zustand + `persist` |
| Persistence | localforage (IndexedDB/LocalStorage fallback) |
| Charts | Recharts (lazy-loaded) |
| UI primitives | Radix (dialog, select, slider, switch, tabs, separator) + lucide-react icons |
| Tests | Vitest + jsdom + Testing Library |
| Lint | oxlint |
| Desktop | Tauri 2 (Rust shell) |
| Mobile | Capacitor 8 (Android + iOS shells) |

## Formula reference

- **WPM** = correct characters ÷ 5 ÷ minutes (a "word" is a 5-character convention).
- **raw WPM** = keypresses ÷ 5 ÷ minutes (includes corrected keystrokes).
- **Accuracy** = correct characters ÷ (correct + errors) × 100. *Errors* count every position ever typed wrong, even if corrected, so accuracy stays honest after a backspace.
- **Consistency** = 100 − (stddev ÷ mean) × 100 over per-second WPM buckets, clamped to [0, 100].

All formulas live in `src/engine/math.ts` and are unit-tested.

## Project structure

```
src/
├── engine/            # platform-independent core (no DOM, no React)
│   ├── math.ts            # WPM / raw / accuracy / consistency
│   ├── typingEngine.ts    # TypingEngine class (clock-injected, testable)
│   ├── textGenerator.ts   # word/quote/custom text assembly
│   └── *.test.ts          # engine + formula unit tests
├── data/              # bundled word lists + quotes (en / uz / ru)
├── lib/               # storage, utils, sound, statistics, import/export
├── store/             # zustand stores (settings, data) + achievements
├── components/
│   ├── layout/            # AppShell: sidebar + mobile top/bottom nav
│   ├── test/              # useTestEngine hook, TextDisplay, ModeBar, ResultPanel
│   └── ui/                # shadcn-style primitives
├── pages/             # Dashboard, Test, History, Statistics, Achievements, CustomTexts, Settings
└── test/setup.ts      # vitest setup
src-tauri/             # Tauri 2 shell (Cargo.toml, config, capabilities, icons)
android/               # Capacitor Android project
ios/                   # Capacitor iOS project (build on macOS/Xcode)
capacitor.config.ts    # Capacitor config
public/favicon.svg     # source icon for `npm run tauri icon`
```

## Getting started

Prerequisites: **Node.js ≥ 20** and npm.

```bash
npm install
npm run dev        # dev server with HMR at http://localhost:5173
```

## Checks (run before any release)

```bash
npm run lint       # oxlint
npx tsc -b         # TypeScript typecheck
npm test           # unit tests (engine + import/export validation)
npm run build      # production web build into dist/
```

`npm run build` currently outputs ~158 kB gzipped (charts page is lazy-loaded in a separate chunk).

## Running the web offline

```bash
npm run build
npx serve dist     # then open http://localhost:4173
```

Choose **DevTools → Network → Offline** and reload: the app stays fully functional. You can also open `dist/index.html` directly from the file system (`file://`) — routing, persistence and sounds work with no server at all because only local assets are used.

## Download the Windows app (.exe)

The Dashboard ships a **"Download Windows app"** button. It downloads `TypeTester.exe` — a Windows executable the user can run on any PC, fully offline: no accounts, no cloud. For that to work, the `.exe` must exist in `<project root>/public/` so the static build serves it at build/run time.

How to get the `.exe` into `public/`:

```bash
npm run tauri:build
# note the installer path it prints, e.g. src-tauri/target/release/bundle/
# then copy the .exe into public/:
Copy-Item src-tauri/target/release/bundle/nsis/*.exe public/TypeTester.exe
```

Then rebuild/serve the web app (`npm run build` + `npx serve dist`) and click the button on the Dashboard — the browser downloads `TypeTester.exe`.

Verify it yourself:

```bash
npm run build
npx serve dist     # open http://localhost:4173, click "Download Windows app"
```

## Windows desktop (Tauri 2)

Prerequisites: [Rust toolchain](https://rustup.rs/) (MSVC) and the [WebView2 runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (preinstalled on Windows 10/11).

```bash
npm install
npm run tauri:dev     # run the app in a native window with HMR
npm run tauri:build   # produces .msi + .exe in src-tauri/target/release/bundle/
```

The `npm run build` runs automatically before the Rust bundler. The Rust shell does no network work; it only hosts the static frontend.

### Regenerating app icons

```bash
npm run tauri icon public/favicon.svg   # tauri-cli generates ico/icns/pngs + Android/iOS sets
```

## Android (Capacitor)

Prerequisites: Android Studio with SDK 34+, and a JDK (17+).

```bash
npm run build                 # build the web bundle
npx cap sync android          # copy dist/ into the android project
npx cap open android          # build/run in Android Studio (or gradle)
# Debug APK:
cd android && ./gradlew assembleDebug
```

Installer APK: `android/app/build/outputs/apk/debug/app-debug.apk`. App icon, splash and name are already branded (you can rerun `npx cap sync android` any time after a web change — it never touches native res or source).

## iOS (Capacitor)

iOS toolchains only work on macOS/Xcode.

```bash
npm run build
npx cap sync ios
npx cap open ios    # set the signing team inside Xcode, then Run
```

## Data, backup and import validation

- Everything (settings, results, achievements, custom texts) is stored locally via IndexedDB (localforage).
- **Settings → Data → Export** downloads a single `typetester-backup-<date>.json`.
- **Import** validates the file first: wrong version, malformed results or custom texts are rejected with a clear error *before* anything is overwritten; a confirmation dialog shows exactly what will be applied.

## Known limitations

- The authoring machine had **no Rust and no JDK**, so `tauri:build`, the Android APK and the iOS app were **scaffolded and documented but not compiled locally**. Run the commands above on a machine with the native toolchains; the web bundle they wrap is unchanged.
- Consistency is reported per whole test; a per-bucket detail view is not included.
- Sounds are synthesized Web Audio blips (no effect presets).