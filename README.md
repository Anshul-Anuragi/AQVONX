# AQVONX — Intelligence Hub & Extension Control Plane

<p align="center">
  <img src="frontend/public/logo.svg" alt="AQVONX Logo" width="360" />
</p>

<p align="center">
  <strong>The Unified Central Platform for Next-Gen Browser AI Extensions</strong><br>
  Featuring Zero Client Key Leakage, Token-Gated Licensing, Neon Serverless PostgreSQL Quotas, and Gemini Flash Multimodal Ingest.
</p>

---

## 🚀 Supported Chrome Extensions

1. **NotesGPT Studio (`/notesgpt`)**: Real-time video transcript distiller, markdown notes formatter, and dynamic vector SVG flowchart generator.
2. **PortalSnap Pro (`/portalsnap`)**: Intelligent PDF form scanner, field auto-mapper, and eligibility verification rules engine.
3. **EditorialLens**: Contextual research HUD, semantic cross-referencer, and source citation engine.

---

## 📁 Monorepo Directory Architecture

```text
AQVONX/
├── frontend/                     # Next.js 15 (App Router, React 19, TypeScript, Tailwind CSS)
│   ├── app/
│   │   ├── (marketing)/
│   │   │   ├── page.tsx          # Studio Home with hero, live metrics & extension cards
│   │   │   ├── notesgpt/page.tsx # NotesGPT standalone product landing & ₹149/mo pricing table
│   │   │   └── portalsnap/page.tsx
│   │   ├── docs/                 # Documentation section
│   │   │   ├── layout.tsx        # Sticky collapsible sidebar & nested search
│   │   │   ├── page.tsx          # Getting Started & Architecture Overview
│   │   │   └── [extension]/      # Dynamic MDX documentation route
│   │   │       └── page.tsx
│   │   ├── dashboard/            # User account & extension handshake JWT token generator
│   │   ├── layout.tsx            # Global layout with modern AQVONX logo navbar
│   │   └── globals.css           # Futuristic cyber-palette & typography
│   ├── components/               # React components (Logo, Navbar, Footer, Features)
│   ├── lib/                      # Typed backend API client & utilities
│   ├── content/docs/             # Markdown / MDX documentation content files
│   │   ├── notesgpt.mdx
│   │   └── portalsnap.mdx
│   ├── public/                   # Vector assets (logo.svg, icon.svg)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example              # Frontend environment variables template
│   └── .env.local                # Ready to paste real frontend credentials
│
├── backend/                      # FastAPI (Python 3.11+, Pydantic v2, Async Neon PG Engine)
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py       # JWT verification & extension handshake
│   │   │   │   ├── license.py    # Multi-product subscription verification & checkouts
│   │   │   │   ├── notes.py      # Secure Gemini Flash proxy (replaces extension client keys)
│   │   │   │   └── webhooks.py   # Razorpay & LemonSqueezy payment webhooks
│   │   │   └── router.py
│   │   ├── core/
│   │   │   ├── config.py         # App settings & environment variables
│   │   │   └── security.py       # JWT & rate-limiting logic
│   │   ├── db/
│   │   │   ├── session.py        # Neon PostgreSQL asyncpg connection pool
│   │   │   └── models.py         # SQLAlchemy 2.0 async database models
│   │   ├── services/             # Gemini Flash API calling & vector flowchart synthesis
│   │   └── main.py               # FastAPI entrypoint with CORS & security middleware
│   ├── requirements.txt
│   ├── .env.example              # Backend environment variables template
│   └── .env                      # Ready to paste real backend keys
│
├── shared/                       # Shared TypeScript interfaces & API contracts
│   └── types/
│       ├── user.ts
│       ├── license.ts
│       └── notes.ts
├── schema.sql                    # Complete Neon PostgreSQL initialization migration
└── README.md
```

---

## ⚡ Quick Start: Environment & Setup

### 1. Configure Backend `.env`
Open `backend/.env` and paste your real keys:
```env
# Neon PostgreSQL Connection URL
DATABASE_URL="postgresql+asyncpg://neondb_owner:YOUR_NEON_PASSWORD@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?ssl=require"

# Google Gemini API Key
GEMINI_API_KEY="AIzaSy_YOUR_REAL_GEMINI_API_KEY_HERE"

# JWT Signing Secret (Generate using: openssl rand -hex 32)
JWT_SECRET_KEY="your_secure_random_64_character_hex_secret_key"

# Payment Gateways (Razorpay & LemonSqueezy)
RAZORPAY_KEY_ID="rzp_test_xxxx"
RAZORPAY_KEY_SECRET="xxxx"
RAZORPAY_WEBHOOK_SECRET="xxxx"
```

### 2. Run Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Interactive OpenAPI Swagger docs will be live at: `http://localhost:8000/docs`

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to preview the AQVONX parent platform.

---

## 🗄️ Neon PostgreSQL Migration

Execute `schema.sql` inside your Neon Console SQL Editor to establish:
- `users`: User profiles with ban/active flags
- `subscriptions`: Multi-product tier status (`free`, `pro_monthly`, `pro_annual`)
- `daily_usage`: Daily atomic request counter enforcing the 5 free / 250 pro limits

