# GIT REPOSITORY SETUP & WORKFLOW SPECIFICATION

## 1. Project Root & Repository Structure
The canonical repository root is located at `/app/applet` (the top-level workspace containing `package.json`).

Key directory layout:
- `src/`: Complete application source (React 19 SPA, domain models, selectors, UI components).
- `docs/`: Phase specifications, scientific audits, error registry, and architectural documentation.
- `audio_samples/`: Curated reference evaluation and adversarial WAV/MP3 audio files (total ~2.8MB).
- `models/saboorhsn/`: Phoneme inventories and mapping tokens. (External ONNX acoustic weights are unbundled per `ERR-ASR-001`).
- `public/`: Static public web assets.

---

## 2. Git Initialization & Baseline Setup
To initialize and configure the repository locally:
```bash
git init
git add .
git commit -m "chore: establish git-ready project baseline"
```

### Remote Configuration
If connecting to an upstream remote repository:
```bash
git remote add origin <REMOTE_URL>
git branch -M main
```

---

## 3. Standard Development & Verification Lifecycle
Every clone or working tree must follow this verification cycle:

```bash
# 1. Clean installation of pinned dependencies
npm ci

# 2. Strict static analysis & TypeScript verification
npm run lint

# 3. Comprehensive test suite execution
npm test

# 4. Production bundle compilation
npm run build
```

---

## 4. Environment Variables & Secret Handling
- Never commit `.env` or `.env.local` files.
- `.env.example` provides the canonical template for environment variable injection:
  - `GEMINI_API_KEY`: Injected dynamically at runtime via secure environment proxy routes (`/api/*`) or server-side runner.
  - `APP_URL`: Hosting URL injected by deployment platform.
- Zero secret credentials (API keys, passwords, private keys, bearer tokens) may be placed in tracked files.

---

## 5. Branch & Contribution Governance
- **Pull Request Only**: Direct pushes to `main` are strictly prohibited.
- **Squash or Rebase**: Preserve a clean, linear commit history without redundant merge commits.
- **Smallest Safe Change**: Every commit must be scoped, minimal, and non-breaking.
- **Mandatory Gating**: Lint, test, and build must succeed before any merge.
