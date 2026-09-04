# Build My AI-Powered Email Threat Detection & Forensic Intelligence Platform

I want to build a project called:

**“AI-Powered Email Threat Detection, Geolocation and Forensic Intelligence Platform”**

I am a **beginner in cybersecurity, email forensics, threat intelligence, and machine learning**, but I already have some development experience with:

* JavaScript / TypeScript
* Node.js
* Express.js
* Next.js / React
* PostgreSQL
* Prisma
* Tailwind CSS
* REST APIs
* Basic backend development

Therefore, I want you to act as both:

1. **A cybersecurity mentor/teacher**
2. **A senior full-stack developer**

Do NOT just generate the entire project at once. I want to **learn while building it**, progressively.

---

# 📜 Completed Phases Log & Knowledge Base

### ✅ PHASE 1 — Create the Full-Stack Foundation
* **What We Built:** Express.js + TypeScript backend server with Prisma ORM connected to PostgreSQL, and a Next.js frontend dashboard.
* **Why It Matters:** Forensic evidence needs a reliable, structured database store (PostgreSQL) so that analyzed emails can be preserved immutably without risk of alteration.

### ✅ PHASE 2 — Email Upload & MIME Parsing
* **What We Built:** Integrated `simpleParser` (`mailparser`) to ingest `.eml` files, extract headers (`From`, `To`, `Subject`, `Date`, `Message-ID`, `Reply-To`, `Return-Path`, `Received`), text/HTML body, and attachments, then save them into PostgreSQL.
* **Why It Matters:** Raw `.eml` files are MIME-encoded text blocks. Parsing breaks down the raw MIME structure into queryable metadata so security tools can inspect individual headers and body snippets.

### ✅ PHASE 3 — Email Header Forensics & Anomaly Detection
* **What We Built:** Implemented automated header checks in `email.controller.ts` (detecting **Reply-To mismatches**, **Return-Path mismatches**, and **missing Message-IDs**) and connected the results to the frontend dashboard UI.
* **Why It Matters:** 
  * **Reply-To / Return-Path Mismatches:** Phishers often spoof the visible `From:` address (e.g., `support@apple.com`), but set the `Reply-To:` or `Return-Path:` to an attacker-controlled server so replies or bounced mails come back to them.
  * **Missing Message-ID:** Standard, legitimate email servers automatically assign a unique `Message-ID` header. Custom spam/phishing scripts often fail to generate one.

### ✅ PHASE 4 — SPF, DKIM & DMARC Authentication Analysis
* **What We Built:** Added regex-based extraction for `Authentication-Results` headers in `email.controller.ts`, updated Prisma database schema with `spfResult`, `dkimResult`, and `dmarcResult` fields, and created a dedicated color-coded **Protocol Authentication Audit** panel on the Next.js frontend.
* **Why It Matters:** 
  * **SPF (Sender Policy Framework):** Verifies if the sending server's IP is allowed by the domain owner in DNS.
  * **DKIM (DomainKeys Identified Mail):** Uses a cryptographic digital signature to ensure the email content wasn't altered in transit.
  * **DMARC (Domain-based Message Authentication, Reporting & Conformance):** Verifies alignment between the `From:` domain and SPF/DKIM verification to block domain impersonation attacks.

### ✅ PHASE 5 — Sender & Domain Analysis (Brand Impersonation & Typosquatting)
* **What We Built:** Created `domain.service.ts` to compute Levenshtein distances against major brand domains, detect keyword stacking (e.g., `apple-security-login.com`), and flag freemail impersonation (e.g., "Netflix Support" sending from `@gmail.com`). Added a **Domain Forensics & Impersonation** panel to the frontend.
* **Why It Matters:** Attackers rely on human visual skimming. By replacing `l` with `1` (`paypa1.com`) or registering lookalike domains, they bypass purely technical checks like SPF (since they own the fake domain). The domain analysis engine catches these cognitive tricks algorithmically.

---

# 1. Project Goal

The platform should allow an investigator/user to upload a suspicious email, preferably as a `.eml` file.

The system should analyze the email and provide intelligence such as:

* Sender information
* Recipient information
* Subject
* Email timestamps
* Full email headers
* `Received` SMTP relay chain
* Sending IP addresses
* Origin/relay infrastructure
* SPF result
* DKIM result
* DMARC result
* Sender/domain mismatch
* Reply-To anomalies
* Return-Path anomalies
* Suspicious URLs
* Domain information
* Lookalike/typosquatting domains
* IP geolocation
* IP reputation
* Domain reputation
* Threat-intelligence matches
* Phishing indicators
* BEC/impersonation indicators
* Suspicious language/content
* Overall risk score
* Explanation of why the email was considered suspicious
* Investigation timeline
* SMTP route visualization
* Infrastructure relationships
* Forensic report

The platform should eventually combine:

**Email Forensics + Threat Intelligence + Geolocation + NLP/AI + Risk Scoring + Graph Analysis**

---

# 2. Important Technical Principle

Do not start with AI/ML.

Build the system progressively.

The initial system should be:

**Next.js → Express.js → PostgreSQL**

Then gradually add:

**Email parsing → Header analysis → SPF/DKIM/DMARC → IP analysis → URL/domain analysis → Threat Intelligence → Risk Engine → NLP → ML → Graph analysis**

Python should NOT be the main backend.

Use **Node.js + Express + TypeScript** for the primary backend.

If Python becomes useful later for advanced NLP/ML, create it as a separate microservice that communicates with the Express backend through an API.

---

# 3. Preferred Technology Stack

## Frontend

* Next.js
* TypeScript
* React
* Tailwind CSS
* Recharts or another suitable charting library
* React Flow for infrastructure/correlation graphs
* Leaflet or another suitable map library for geolocation

## Backend

* Node.js
* Express.js
* TypeScript
* REST API architecture

## Database

* PostgreSQL
* Prisma ORM

## Email Analysis

Choose appropriate Node.js libraries for:

* `.eml` parsing
* MIME parsing
* email header parsing
* URL extraction

Explain why you select each library.

## Security / Authentication

Later add:

* JWT/session authentication
* role-based access
* rate limiting
* input validation
* secure file upload
* sanitization
* audit logging

## AI / ML

Initially:

* Rule-based detection
* Basic NLP

Later:

* Python
* scikit-learn
* Hugging Face / Transformers
* ML classification

Do not introduce unnecessary technologies.

---

# 4. Architecture

Use this general architecture:

```text
                    ┌─────────────────────┐
                    │      Next.js UI     │
                    │ Dashboard / Reports │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Express.js API    │
                    │   Node.js + TS      │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
 ┌────────────────┐   ┌────────────────┐   ┌─────────────────┐
 │ Email Forensic │   │ Threat Intel   │   │ Risk Engine     │
 │ Analysis       │   │ APIs / Sources │   │                 │
 └───────┬────────┘   └────────────────┘   └─────────────────┘
         │
         ▼
 ┌────────────────────┐
 │ PostgreSQL + Prisma│
 └────────────────────┘

Later:

Express.js
     │
     ▼
Python ML/NLP Service
```

---

# 5. Development Philosophy

I want you to teach me **phase by phase**.

For every phase:

1. Explain the cybersecurity concept first.
2. Explain why the concept matters.
3. Explain how it works in real-world email systems.
4. Explain what we are going to build.
5. Explain the architecture.
6. Create the necessary files/folders.
7. Write the code.
8. Explain the important parts of the code.
9. Tell me how to run it.
10. Give me a small test.
11. Tell me what output I should expect.
12. Give me a few questions I should be able to answer before moving forward.

Do not assume I understand cybersecurity terminology.

Whenever you introduce something such as:

* SMTP
* MIME
* SPF
* DKIM
* DMARC
* DNS
* MX
* PTR
* ASN
* CIDR
* WHOIS/RDAP
* TLS
* SMTP relay
* IOC
* BEC
* phishing
* spoofing
* threat intelligence
* IP reputation
* NLP
* embeddings
* classification
* confidence score

explain it in simple language first.

---

# 6. Phase-Based Development Plan

Follow approximately this progression.

## PHASE 0 — Cybersecurity & Email Fundamentals

Teach me:

* What an email actually is
* How SMTP works
* Mail servers
* SMTP relay
* DNS
* MX records
* Email headers
* MIME
* `.eml`
* SPF
* DKIM
* DMARC
* IP addresses
* Domains
* TLS

Do not build complex code yet.

Give me small practical exercises.

---

# PHASE 1 — Create the Full-Stack Foundation

Create:

```text
project/
├── frontend/
│   └── Next.js
│
└── backend/
    └── Express + TypeScript
```

Configure:

* Express
* TypeScript
* environment variables
* Prisma
* PostgreSQL
* basic REST API
* error handling
* logging
* CORS
* basic project structure

Teach me why each part exists.

---

# PHASE 2 — Email Upload & Parsing

Allow the user to upload a `.eml` file.

The backend should:

1. Receive the file.
2. Validate it.
3. Parse it.
4. Extract:

   * From
   * To
   * CC
   * Subject
   * Date
   * Reply-To
   * Return-Path
   * Message-ID
   * MIME information
   * Text body
   * HTML body
   * Attachments
   * Headers
   * Received headers

Store the necessary normalized information in PostgreSQL.

Explain MIME and email parsing before implementing it.

---

# PHASE 3 — Email Header Forensics

Build a proper header analysis engine.

Analyze:

* From
* Sender
* Reply-To
* Return-Path
* Message-ID
* Date
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
