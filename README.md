# ASCII-Frames Studio

Deterministic ASCII/UTF-8 wireframe design engine and web studio that compiles 2D scene graphs into hybrid `WIREFRAME.md` specifications optimized for AI agent UI prototyping.

## Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run unit tests
npm test

# Run TypeScript type check
npm run typecheck

# Run terminal demo
npm run demo
```

## Production Build

```bash
# Build both TypeScript library and web client bundle
npm run build

# Preview production build locally
npm run preview
```

## Hosting on GitHub Pages

This repository includes an automated GitHub Actions workflow (`.github/workflows/deploy.yml`) configured for GitHub Pages.

### Setup Instructions

1. Push this repository to GitHub.
2. In your GitHub repository, navigate to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. The deployment workflow will automatically run on any push to `main` (or `master`) or when triggered manually via **Actions** > **Deploy to GitHub Pages** > **Run workflow**.
