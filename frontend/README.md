
# OriginX Frontend

Frontend application for OriginX, built with React and Vite.

This UI started from a Figma-exported code bundle and was adapted into a multi-page verification dashboard.

## Design Source

- Original design: https://www.figma.com/design/FNqn2hiyeuJQiH3BbsA6Ap/Design-AI-Verification-Dashboard

## Tech Stack

- React 18 + React Router
- Vite 6
- Tailwind CSS 4
- Radix UI primitives
- MUI icons/components (selective use)
- Charting and graph libraries (Chart.js, Recharts, Cytoscape)

## Prerequisites

- Node.js 18+ (Node.js 20 LTS recommended)
- npm 9+

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start development server:

   ```bash
   npm run dev
   ```

3. Open the local URL shown in the terminal (typically http://localhost:5173).

## Available Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Create production build in `dist/`

## Application Routes

- `/` - Landing page
- `/dashboard` - Main dashboard view
- `/verify` - Claim verification flow
- `/verify-image` - Image verification entry (currently mapped to verify page)
- `/history` - Verification history
- `/url-investigation` - URL investigation workflow
- `/trending` - Trending news insights
- `/settings` - App settings

## Project Structure

```text
frontend/
  src/
    app/
      App.tsx
      routes.ts
      components/
      pages/
    styles/
  app/services/
  guidelines/
```

## Notes

- This frontend currently does not require local environment variables to boot.
- If backend APIs are introduced or changed, document the corresponding `VITE_...` variables here.

## Build Output

Run:

```bash
npm run build
```

Production files are generated in the `dist/` directory.

## Attribution

See `ATTRIBUTIONS.md` for third-party and design attribution details.
  