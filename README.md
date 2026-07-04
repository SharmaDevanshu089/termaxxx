# Termaxxx Console v1.0.0

A stateful, glassmorphic terminal emulator built with **Tauri v2**, **React**, and **TypeScript**. Designed for developers who love custom Hyprland desktop aesthetics, modern Windows Fluent UI blur properties, and stateful powershell shell controls.

---

## Key Features

1. **GNOME Adwaita & Fluent UI Hybrid Aesthetics**
   - Soft Adwaita Dark Gray glassy backdrop (`rgba(30, 30, 30, 0.55)`) combined with Windows Fluent CSD top corner reflections (`rgba(255, 255, 255, 0.08)`) and margins.
   - Smooth `backdrop-filter` acrylic blur rendering natively on Windows (Acrylic Vibrancy) and Linux/macOS compositor environments.
   - Accented in signature GNOME Blue (`#3584e4`) highlights for active borders, carets, inputs, and console prompts.

2. **Stateful Command Execution**
   - Automatically initializes inside the user's Home Directory (`$HOME` or `USERPROFILE`) on launch.
   - Stateful navigation (`cd`) tracks path shifts across command inputs (unlike typical stateless executors).
   - Cycles through shell command input history using standard **Up Arrow** and **Down Arrow** keys.
   - Clear history screen using the built-in `clear` command.

3. **Inline Shell Autosuggestions & Autocomplete**
   - Inline predictions display directly behind your typing cursor in translucent grey text.
   - Autocomplete calculations pull from:
     1. **Command History:** Matches recently executed shell command strings.
     2. **Word Suggestions:** Predicts common developer toolchain words (`npm run dev`, `cargo build`, `npm install`, `git commit`, `mkdir`, `ls`, etc.).
   - Press **Tab** or **Right Arrow** to auto-fill the suggestion instantly.

4. **WebGL Hyprland Background Particles**
   - Organic, floating background particle field rendering dynamic neon-spores matching the desktop theme colors (GNOME Blue, orchid fuchsia, and light blue).
   - Particle movement dynamically shifts relative to mouse hover coordinates.

5. **2D Snapping Text Caret Cursor**
   - A custom custom cursor that renders as a clean vertical Adwaita Blue line text caret when idle.
   - Morphing Snaps: Hovering over action targets (such as window minimize/maximize/close buttons) trigger a CSS transition, flattening the caret into a border frame around the button bounds. Clicks pass through the container overlay.

6. **Tauri Custom Titlebar Integration**
   - Frameless application wrapper with an integrated CSD titlebar flush with the terminal window margins.
   - Multi-platform support: standard window controls (Minimize, Maximize/Restore, and Close) are bound natively.

---

## Technical Architecture

- **Backend (Rust):**
  - Conditionally builds platform imports so it is completely compatible with Linux, macOS, and Windows.
  - Windows: spawns `powershell.exe` execution threads statefully with `-NoProfile` and `-NonInteractive` flags.
  - Unix/Linux: falls back to native `/bin/sh` shell.
- **Frontend (React + TypeScript + Vite):**
  - Custom direct DOM manipulation for 60fps cursor translation frame rates.
  - OGL library handles GPU-accelerated background particle simulations.

---

## Setup & Development

### Prerequisites
- Node.js (v18+)
- Rust & Cargo (Tauri build requirements)

### Install Dependencies
```bash
npm install
```

### Start Development Server
Launches the hot-reloading Vite dev server and launches the Tauri window:
```bash
npm run dev
```

### Build Production Bundle
Bundles the React frontend and compiles the optimized native executable binary target (MSI/EXE on Windows, AppImage/DEB on Linux, DMG on macOS):
```bash
npm run build
```

---

## License
MIT License. Created by Advanced Agentic Coding.
