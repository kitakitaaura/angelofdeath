# The Angel of Death 

A simple story to show that you can build a visual novel in HTML.

**Features**
- Layered renderer with particles, shapes, and symbolic overlays.
- Dialogue system with multiple presentation styles (type, word, fade, slide, etc.).
- Automatic line progression and single-word "glitch" "jumpscares" (large, full-page glitch text).
- Cinematic states that subtly shift camera and mood per line.
- Background ambient audio with a top-right mute/unmute toggle.
- Final ending: fades to white and displays a monospace warning that grows and glitches.

**Files**
- `index.html` — App shell and entry point.
- `css/main.css` — Visual styles, cinematic states, and glitch/final overlay rules.
- `js/engine.js` — Engine, renderer, scene manager, and UI wiring.
- `assets/` — Audio and other media (ambient audio used: `freesound_community-eerie-ambience-6836.mp3`).

Quick Start

1. Open the project folder in your browser, or serve it locally. For a quick local server run:

```
python3 -m http.server
```

Then visit `http://localhost:8000/`.

2. The engine auto-starts on page load.

Controls & Notes

- Audio: use the top-right toggle to mute/unmute the ambient audio. Browsers often block autoplay — click anywhere once on the page (or press any key) to unlock audio if it doesn't start automatically.
- Speed: the debug panel (top-left) has speed buttons (x1, x2, x3, x5) used during development.
- Single-word lines (e.g. an imported word like `IMPORT`) render as a huge glitch overlay that fills the screen.
- The final scene stops the experience, fades to white and displays the message: "Close this tab. Wake up." The message grows and glitches each second.

Customization

- Tuning presentation styles and pacing: edit `js/engine.js` (presentation order in `PRESENTATION_STYLES`, timing in `DialogueCard.waitContinue()` and `SceneManager.waitAfterLine()`).
- Visuals: modify `css/main.css` for cinematic states, particle density, and glitch appearance.
- Audio: replace the file in `assets/` or change the path in `js/engine.js` (`initBackgroundAudio()`).

Credits

- Ambient audio: `assets/freesound_community-eerie-ambience-6836.mp3` (sourced from freesound community).

Troubleshooting

- If audio never starts, ensure you interact with the page once (click or keypress) to satisfy browser autoplay policies.
- If glitch overlay covers UI and you want to skip it for testing, search for `glitch-overlay` / `showGlitchWord` in `js/engine.js` and temporarily disable showing.
