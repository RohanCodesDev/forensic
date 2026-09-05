# AI-Powered Email Threat Detection & Forensic Intelligence Platform

A full-stack forensic analysis platform for suspicious email investigation. The project ingests raw `.eml` files, reconstructs SMTP routing and authentication metadata, checks domains and URLs for impersonation and phishing risk, correlates threat intelligence, and presents a security dashboard with a risk score and investigation report.

## What the project does

- Parses `.eml` files using a Node.js backend and extracts headers, body content, attachments, and routing metadata.
- Detects header anomalies such as mismatched `Reply-To`, `Return-Path`, and missing `Message-ID`.
- Audits SPF, DKIM, and DMARC results.
- Analyzes domains for typosquatting, freemail abuse, and brand impersonation.
- Extracts links and scores them for hidden URLs, shorteners, raw IPs, and suspicious keywords.
- Reconstructs the `Received:` relay chain and identifies the likely origin IP.
- Resolves origin IPs to geolocation and overlays the route on a map.
- Cross-references IPs, domains, and URLs against a threat intel layer.
- Produces a risk evaluation with severity tiers and explanation factors.
- Stores saved investigations in PostgreSQL via Prisma.

## Current status

This repository currently includes:

- Express + TypeScript backend API
- Prisma + PostgreSQL persistence layer
- Next.js frontend dashboard
- Investigation upload workflow
- Email risk scoring and forensic widgets
- Threat intelligence and route map visualization

## Architecture

```text
Frontend (Next.js + React + Tailwind)
        |
        v
Backend (Express + TypeScript)
        |
   +----+----+--------------------+
   |         |                    |
   v         v                    v
Email      Threat & Domain       Risk & AI
Parsing    Analysis              Scoring
   |         |                    |
   +----+----+--------------------+
        |
        v
PostgreSQL + Prisma
```

## Repository structure

```text
ps106/
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── vercel.json
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── next.config.ts
│   ├── eslint.config.mjs
│   └── README.md
├── Readme.md
├── ppt_documentation.txt
├── spam_test_*.eml
└── .gitignore
```

## Tech stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Leaflet for geolocation map
- Custom risk and forensic UI cards

### Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- `mailparser` for `.eml` parsing
- `multer` for upload handling

## Quick start

### 1) Install dependencies

From the project root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

> On Windows PowerShell, use `npm.cmd` instead of `npm` if execution policy blocks scripts.

### 2) Start the backend

```bash
cd backend
npm run dev
```

The API runs on:

- http://localhost:8000
- Health check: http://localhost:8000/api/health

### 3) Start the frontend

```bash
cd frontend
npm run dev
```

The app runs on:

- http://localhost:3000

### 4) Build for production

```bash
cd backend
npm run build

cd ../frontend
npm run build
```

## Environment variables

Create a `.env` file in the backend folder if required by your local database setup:

```env
PORT=8000
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/forensic_mail"
```

The project also supports local or hosted frontend API configuration through `NEXT_PUBLIC_API_URL` in the frontend app.

## Core API endpoints

### Health

- `GET /api/health`

### Email investigation

- `POST /api/emails/upload` with multipart form field `file`
- `GET /api/emails`
- `GET /api/emails/:id`
- `DELETE /api/emails/:id`

### Example upload flow

```bash
curl -X POST http://localhost:8000/api/emails/upload \
  -F "file=@./spam_test_1.eml"
```

## Analysis features included

- Email metadata extraction
- Header anomaly detection
- SPF/DKIM/DMARC extraction
- Domain impersonation checks
- URL risk scoring
- SMTP route reconstruction
- Geographic IP mapping
- Threat intelligence correlation
- risk evaluation with rationale
- AI/NLP heuristic text analysis

## Sample evidence files

The repository includes example malicious email fixtures:

- `spam_test_1.eml`
- `spam_test_2.eml`
- `spam_test_3.eml`
- `spam_test_4.eml`
- `spam_test_5_typo.eml`
- `spam_test_6_freemail.eml`
- `spam_test_7_urls.eml`
- `spam_test_8_route.eml`

These are useful for testing the parser, threat detection rules, and risk engine.

## Security model notes

- Uploaded files are limited to 5 MB in the backend to reduce memory abuse.
- File processing is designed for investigation workflows and local assessment.
- This project is intended for security research, internal testing, and controlled forensic review.

## Future roadmap

The project is planned to evolve with additional phases such as:

- more advanced NLP and AI classification
- safer authentication and RBAC
- campaign correlation across multiple emails
- stronger investigation case management
- deeper export/reporting workflows

## License

This project is for educational and forensic analysis use within a controlled environment.

---

For a more implementation-focused view of the frontend, see [frontend/README.md](frontend/README.md).
* Received
* Authentication-Results
* X-Originating-IP
* other useful headers

Detect anomalies such as:

* From/Reply-To mismatch
* suspicious Return-Path
* suspicious Message-ID domain
* inconsistent timestamps
* unusual mail servers
* suspicious Received chain
* possible header inconsistencies

Important:

Do NOT automatically treat every unusual header as malicious.

Explain the difference between:

**Observed Evidence**

and

**Analysis/Inference**

---

# PHASE 4 — SPF, DKIM & DMARC

Implement analysis of:

* SPF
* DKIM
* DMARC

Explain:

* what each protocol does
* what problem it solves
* how DNS is involved
* what pass/fail/neutral/none means
* what authentication results mean

Show the user results clearly:

```text
SPF       PASS
DKIM      PASS
DMARC     FAIL
```

Then explain the security implications.

---

# PHASE 5 — Sender & Domain Analysis

Analyze:

* sender domain
* recipient domain
* Reply-To domain
* Return-Path domain
* DKIM domain
* SPF domain

Detect:

* domain mismatches
* suspicious free-mail domains
* newly observed domains if data is available
* lookalike domains
* typosquatting
* homoglyph attacks
* suspicious subdomains

Example:

```text
paypa1.com
micros0ft-support.com
secure-login-example.com
```

Explain why these may be suspicious.

---

# PHASE 6 — URL Analysis

Extract URLs from:

* plain-text email
* HTML email

Analyze:

* URL domain
* hostname
* path
* query parameters
* redirects
* HTTPS
* suspicious TLDs
* IP-based URLs
* URL/domain mismatch
* shortened URLs
* encoded URLs

Build a URL risk-analysis module.

---

# PHASE 7 — IP & SMTP Route Analysis

Parse all relevant IP addresses from the email.

Especially analyze the:

```text
Received:
```

headers.

Construct something like:

```text
Sender
   ↓
Mail Server A
   ↓
Mail Server B
   ↓
Mail Server C
   ↓
Recipient Mail Server
```

For each IP, investigate:

* IP address
* hostname
* ASN
* organization
* country
* approximate city/region
* ISP/cloud provider
* reputation

Explain that IP geolocation is **approximate**.

Never claim:

> “This is the attacker's exact location.”

Instead use wording such as:

> “The IP is associated with infrastructure approximately located in…”

---

# PHASE 8 — Geolocation

Add IP geolocation.

Display:

* Country
* Region
* City
* Latitude/longitude if available
* ISP
* ASN
* Organization

Create a map visualization.

Also display the SMTP route on the map where appropriate.

Explain limitations such as:

* VPN
* proxy
* Tor
* cloud infrastructure
* NAT
* compromised systems
* inaccurate geolocation databases

---

# PHASE 9 — Threat Intelligence

Integrate appropriate threat-intelligence sources/APIs.

Potential intelligence types:

* malicious IP
* malicious domain
* phishing URL
* malware indicator
* known infrastructure
* reputation
* ASN information

Design the system so that different sources can be added later.

Normalize results into a common format:

```text
Indicator
Type
Source
Result
Confidence
First Seen
Last Seen
Details
```

Do not treat one threat-intelligence source as absolute truth.

---

# PHASE 10 — Rule-Based Risk Engine

Before ML, build a transparent scoring system.

Example:

```text
DMARC failure                 +20
Reply-To mismatch             +15
Suspicious URL                +20
Known malicious IP            +30
Lookalike domain              +20
Suspicious Received chain     +10
Urgent language               +5
Credential request            +15
```

Then calculate:

```text
0–24     Low
25–49    Medium
50–74    High
75–100   Critical
```

These values are examples only.

Help me design a better scoring system based on evidence quality and avoid arbitrary scoring where possible.

The system should explain:

```text
Risk Score: 82/100

Major contributing factors:
- DMARC failed
- Reply-To domain mismatch
- URL domain has threat intelligence hit
- Sender IP has poor reputation
```

---

# PHASE 11 — Phishing / BEC / Impersonation Detection

Analyze email content.

Detect indicators such as:

* urgency
* financial requests
* credential requests
* password-reset scams
* fake invoices
* account suspension
* impersonation
* payment redirection
* executive impersonation
* suspicious call-to-action

Initially use:

**rules + simple NLP**

Do not jump immediately to large AI models.

---

# PHASE 12 — NLP / Machine Learning

Only after the rule-based system works, introduce ML.

Explain:

* features
* training data
* labels
* classification
* precision
* recall
* F1 score
* false positives
* false negatives
* model confidence

Possible classes:

```text
Benign
Phishing
BEC
Spoofing
Malware
Spam
Other
```

If Python is useful, create:

```text
Express Backend
      ↓
Python ML Service
      ↓
Prediction
      ↓
Express
      ↓
Frontend
```

Do not move the whole backend to Python.

---

# PHASE 13 — Infrastructure Graph

Create a graph showing relationships between:

* sender domain
* recipient domain
* IPs
* ASNs
* URLs
* domains
* mail servers
* threat intelligence indicators

Example:

```text
email
 │
 ├── sender domain
 │       │
 │       └── IP
 │             └── ASN
 │
 ├── URL
 │     └── domain
 │
 └── mail server
```

Use React Flow or another appropriate graph library.

---

# PHASE 14 — Campaign Correlation

Eventually allow multiple suspicious emails to be compared.

Find shared:

* domains
* IPs
* URLs
* infrastructure
* sender patterns
* Message-ID patterns
* subjects
* linguistic patterns
* timestamps
* threat-intelligence indicators

Example:

```text
Email A ──┐
          ├── suspicious-domain.com
Email B ──┤
          ├── 1.2.3.4
Email C ──┘
```

This can suggest that emails may belong to the same campaign.

Use language such as:

> “Potential campaign correlation”

rather than claiming certainty.

---

# PHASE 15 — Investigation / Case Management

Create investigation cases.

Example:

```text
Case #00124

Status:
Open

Severity:
High

Emails:
7

Indicators:
14

Domains:
3

IPs:
5

Notes:
...

Evidence:
...
```

Allow investigators to:

* create cases
* add emails
* add notes
* add indicators
* change status
* assign severity
* review analysis
* export reports

---

# PHASE 16 — Evidence & Privacy

Treat uploaded emails as potentially sensitive.

Implement:

* access control
* secure storage
* file validation
* audit logs
* evidence metadata
* timestamps
* hashes
* chain-of-custody concepts
* data retention
* deletion
* privacy controls

Explain legal/forensic limitations.

The system should distinguish:

### Observed Fact

Example:

> SPF result: fail

### Derived Analysis

Example:

> Sender domain does not align with authenticated domain.

### AI Prediction

Example:

> Model predicts phishing probability: 91%.

### Investigative Hypothesis

Example:

> Infrastructure may be associated with a larger phishing campaign.

Never mix these categories.

---

# PHASE 17 — Forensic Report

Generate a professional investigation report containing:

* Case information
* Email metadata
* Header analysis
* Authentication results
* SMTP route
* IP intelligence
* Domain intelligence
* URL analysis
* Threat intelligence
* NLP findings
* Risk score
* Evidence
* Timeline
* Infrastructure graph
* Analyst conclusions
* Limitations

The report must clearly distinguish evidence from assumptions.

---

# PHASE 18 — Professional Dashboard

Build the final dashboard.

Possible sections:

### Overview

```text
Risk Score
Threat Level
Authentication Status
```

### Email Details

### Header Analysis

### Authentication

### SMTP Route

### IP Intelligence

### Domain Intelligence

### URL Analysis

### Threat Intelligence

### AI/NLP Analysis

### Infrastructure Graph

### Geolocation Map

### Investigation Timeline

### Evidence

### Report

The UI should look like a **professional cybersecurity investigation platform**, not a generic AI-generated dashboard.

Avoid excessive cards, gradients, giant rounded containers, and unnecessary animations.

Prioritize:

* information hierarchy
* tables
* timelines
* evidence panels
* charts
* maps
* graphs
* clear severity indicators
* professional typography

---

# 7. Database Design

Eventually design a PostgreSQL schema using Prisma.

Possible entities:

```text
User
Case
Email
EmailHeader
AuthenticationResult
ReceivedHop
IPAddress
Domain
URL
ThreatIntelResult
GeoLocation
Indicator
RiskAssessment
MLPrediction
Evidence
InvestigationNote
AuditLog
```

Do not blindly use these entities.

Explain relationships first and then design the schema.

---

# 8. API Design

Eventually create clean Express REST APIs.

Examples:

```text
POST   /api/emails/upload
GET    /api/emails/:id
GET    /api/emails/:id/headers
GET    /api/emails/:id/authentication
GET    /api/emails/:id/ips
GET    /api/emails/:id/domains
GET    /api/emails/:id/urls
GET    /api/emails/:id/threat-intelligence
GET    /api/emails/:id/risk
GET    /api/emails/:id/graph
GET    /api/emails/:id/geolocation

POST   /api/cases
GET    /api/cases
GET    /api/cases/:id
PATCH  /api/cases/:id
```

Improve this API structure if necessary.

---

# 9. Security Requirements

Since this is a cybersecurity platform, security must be part of the development process.

Teach and implement:

* secure file uploads
* MIME validation
* file-size limits
* malicious attachment handling
* path traversal prevention
* input validation
* sanitization
* SQL injection prevention
* authentication
* authorization
* rate limiting
* API security
* secrets management
* safe logging
* SSRF prevention when analyzing URLs
* safe handling of HTML emails
* XSS prevention
* sandboxing considerations

Do not casually fetch arbitrary URLs from the backend without discussing SSRF risks.

---

# 10. Development Rules

Follow these rules strictly:

### Rule 1

Do not dump the entire application in one response.

### Rule 2

Teach before implementing.

### Rule 3

Build one working feature at a time.

### Rule 4

Use TypeScript wherever possible.

### Rule 5

Prefer simple architecture initially.

### Rule 6

Do not introduce microservices unless they solve an actual problem.

### Rule 7

Python should be introduced only when advanced ML/NLP actually requires it.

### Rule 8

Explain cybersecurity terminology in beginner-friendly language.

### Rule 9

Explain important code instead of assuming I understand it.

### Rule 10

After every major phase, give me a small test/checkpoint.

### Rule 11

Do not hide errors behind generic error handling.

### Rule 12

Use realistic sample emails and test data, but never require real people's private emails.

### Rule 13

Never make unsupported claims about attacker identity.

### Rule 14

Clearly distinguish:

**Evidence → Analysis → Prediction → Hypothesis**

---

# 11. How I Want You to Teach Me

For every phase, structure your response like this:

```text
PHASE X — Name

1. What are we learning?
2. Why does it matter?
3. Real-world explanation
4. What are we building?
5. Architecture
6. Folder structure
7. Installation/setup
8. Code
9. Code explanation
10. How to run
11. Test
12. Expected result
13. Common errors
14. Cybersecurity takeaway
15. Questions I should be able to answer
```

Do not move to the next phase until the current phase is reasonably understandable.

If something depends on knowledge from an earlier phase, remind me briefly.
