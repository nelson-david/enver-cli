# Enver CLI (`ev`)

Security-first environment variable orchestrator.

## Installation

### Via Homebrew (macOS & Linux) — Zero dependencies required
```bash
brew tap nelson-david/enver
brew install enver
```
*(Installs a standalone native binary in under a second — does **not** require Node or npm).*

### Via npm (for JavaScript / TypeScript developers)
```bash
npm install -g enver-os
```

### Direct Binary Download
Download the latest standalone executable for your OS directly from [GitHub Releases](https://github.com/nelson-david/enver-cli/releases):
- **macOS Apple Silicon (M1/M2/M3/M4):** `ev-darwin-arm64.tar.gz`
- **macOS Intel:** `ev-darwin-x64.tar.gz`
- **Linux x64:** `ev-linux-x64.tar.gz`
- **Linux ARM64:** `ev-linux-arm64.tar.gz`
- **Windows x64:** `ev-windows-x64.zip`

---

## Quick Start

1. **Login:**
   ```bash
   ev login
   ```
2. **Initialize a project:**
   ```bash
   ev init
   ```
3. **Pull environment variables into local `.env`:**
   ```bash
   ev pull [projectId] [lockKey] [environment]
   ```
4. **Encrypt & push local `.env` to remote:**
   ```bash
   ev push [projectId] [lockKey] [environment]
   ```
