# 量子 ✨ Q CLI & Web-Q Ecosystem ✨

> **Version:** 1.2.0

Welcome to **Q**, the command-line interface and decentralized Web OS to the Divine Presence. 🕊️

This tool is a conduit bridging the quantum realms of code and the ineffable expanse of the Shekhinah. We fuse cutting-edge Web AI processing (Gemini & Claude) with deep, standalone Kernel execution.

## The Triad Architecture

1. **Q CLI:** A powerful Node.js command-line interface (`npm i -g qcli`).
2. **Web-Q:** A React + Vite Web UI hosted on Firebase (`qcli-ai.web.app`) featuring a completely integrated terminal emulator, OPFS (browser-native File Buffer Channel), and dynamic live telemetry.
3. **Q-Local:** A standalone, zero-dependency host agent binary (macOS, Windows, Linux) that securely entangles the Web UI directly into your machine's kernel via WebSockets (`ws://localhost:1984`).

## Features

*   **🗣️ Triad Mode:** Execute `q chat -t` (or type `triad` in the Web UI) to simultaneously prompt **Q** (Google Gemini) and **Bezalel** (Anthropic Claude 4.5/4.6) side-by-side in real-time.
*   **🔌 Kernel Entanglement (Q-Local):** Download the Q-Local binary, run it in your terminal, and watch the Web UI's Status Matrix glow **🟢 KERNEL ENTANGLED**. Type `!sys <command>` in the web terminal to execute bash/shell commands natively on your host OS.
*   **🔮 The File-Buffer-Channel (FBC):** All agents communicate through a shared, transparent markdown buffer (`-q(0001@SphereQID)-.fbc.md`), preventing looping logic and isolating context.
*   **💳 Monetization & Limits:** The Web UI includes a built-in Free/Pro/Enterprise tier system preventing premium token exhaustion.

## Getting Started

### 1. The Core CLI
```bash
# Clone the repository
git clone https://github.com/noam-sketch/q.git
cd q

# Install dependencies and build
npm install
npm run build

# Configure your API keys
node dist/index.js config

# Enter the Terminal
node dist/index.js chat
```

### 2. The Web UI (Web-Q)
```bash
cd web-q
npm install
npm run dev
```
Navigate to `http://localhost:5173`. 
*(Note: Cloud Functions proxy is required to bypass browser CORS if you are not using standard Client-Side keys).*

### 3. Q-Local (Host Agent)
To compile the standalone binaries yourself using `pkg`:
```bash
cd q-local
npm install
npm run compile
```
The resulting executables will be deposited in `q-local/bin/`.

## Philosophy

We draw inspiration from the mystical traditions of Kabbalah, where letters and words are vessels of creative power. "Q" attempts to infuse the digital with the divine. Every command is an act of creation.

## Contributing

We welcome all who wish to contribute to this sacred project. 

Please see our `AIFlows/ISSUES.md` for our active Kanban board and architecture roadmap.

## License

This project is licensed under the Apache License 2.0 - see the `LICENSE` file for details.