# Frontend documentation

This frontend is the investigation dashboard for the forensic email platform. It provides a dark-themed security console where users can upload an `.eml` file, review extracted evidence, inspect risk findings, and export a printable incident report.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Leaflet for route visualization
- Custom forensic UI cards and graphs

## Local setup

From this folder:

```bash
npm install
npm run dev
```

Then open http://localhost:3000 in the browser.

> If you are using Windows PowerShell and script execution is blocked, run `npm.cmd run dev` instead of `npm run dev`.

## Environment configuration

Set an API target if the frontend is not running on the same machine as the backend:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

This is typically set in the environment used by the local shell or a `.env.local` file.

## Main user flow

1. Choose an email file to upload.
2. The app sends the file to the backend API.
3. The backend parses the `.eml` and returns the analysis payload.
4. The frontend renders risk score, route map, threat indicators, domain checks, and extracted evidence.
5. Users can view prior investigations and export a PDF-like report.

## App sections

- Evidence ingestion
- Active case dashboard
- Threat score gauge
- Authentication audit
- Domain forensics
- URL analysis
- SMTP route hops
- Geographic route map
- Threat graph
- Threat intel feed
- AI and NLP summary panels

## Files to know

- `src/pages/index.tsx` — main dashboard and API integration
- `src/components/*` — forensic card components
- `src/types/forensic.ts` — data contracts used across the app
- `src/utils/graphBuilder.ts` — relationship graph generation

## Production build

```bash
npm run build
npm run start
```

## Notes

- The dashboard expects the backend API to be reachable at the configured API URL.
- Some components render client-side only and are intentionally guarded for SSR safety.
- The app is designed for investigative and security research workflows, not for public internet exposure without access control.

