# Backend documentation

This backend is the analysis engine for the forensic email platform. It accepts `.eml` uploads, parses the message, runs rule-based threat checks, stores evidence in PostgreSQL, and exposes the results to the frontend dashboard.

## Stack

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- `mailparser`
- `multer`
- Winston / custom logging

## Local setup

From the backend folder:

```bash
npm install
npm run dev
```

The backend listens on:

- http://localhost:8000

## Scripts

```bash
npm run dev    # watch mode with tsx
npm run build  # compile TypeScript
```

## Environment configuration

Create a `.env` file in this folder with at least:

```env
PORT=8000
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/forensic_mail"
```

## Core architecture

```text
src/
├── controllers/
│   └── email.controller.ts
├── middleware/
│   └── errorHandler.ts
├── routes/
│   ├── email.routes.ts
│   └── health.routes.ts
├── services/
│   ├── ai.service.ts
│   ├── analysis.service.ts
│   ├── attachment.service.ts
│   ├── domain.service.ts
│   ├── geo.service.ts
│   ├── ingestion.service.ts
│   ├── nlp.service.ts
│   ├── risk.service.ts
│   ├── route.service.ts
│   ├── threat.service.ts
│   └── url.service.ts
├── server.ts
└── test-groq.ts
```

## API endpoints

### Health

- `GET /api/health`

### Email operations

- `POST /api/emails/upload`
- `GET /api/emails`
- `GET /api/emails/:id`
- `DELETE /api/emails/:id`

### Upload format

The upload endpoint expects a multipart form field named `file`.

Example:

```bash
curl -X POST http://localhost:8000/api/emails/upload \
  -F "file=@../spam_test_1.eml"
```

## Main analysis flow

1. File is accepted with a 5 MB size limit.
2. MIME parsing extracts subject, sender, recipients, body, headers, and attachments.
3. Header analysis checks for suspicious Reply-To, Return-Path, and Message-ID issues.
4. Domain, URL, route, and geolocation services enrich the evidence.
5. Threat intel and risk calculations generate the final forensic assessment.
6. Results are persisted to PostgreSQL and returned to the frontend.

## Important services

- `ingestion.service.ts` — extracts raw email metadata and builds the base evidence object.
- `analysis.service.ts` — orchestrates the full forensic analysis pipeline.
- `domain.service.ts` — checks typosquatting, freemail abuse, and impersonation patterns.
- `url.service.ts` — inspects embedded links and calculates suspiciousness.
- `route.service.ts` — parses SMTP `Received:` headers and reconstructs the route chain.
- `geo.service.ts` — resolves origin IPs to geographic information.
- `threat.service.ts` — compares IP, domain, and URL indicators against threat intel sources.
- `risk.service.ts` — calculates the aggregate risk score and narrative summary.
- `nlp.service.ts` and `ai.service.ts` — provide semantic and AI-style summary heuristics.

## Database notes

The Prisma schema is stored under `backend/prisma/schema.prisma`.

Typical database workflow:

```bash
npx prisma generate
npx prisma db push
```

## Notes

- The backend is intentionally modular so each security signal is isolated in its own service.
- The upload path is designed for forensic testing and controlled analysis environments.
- The project currently uses rule-based security checks as its primary threat detection model, with further AI and ML evolution planned.
