# 🛡️ ScamShield Jobs

**AI-powered job scam detection platform** — helping job seekers verify listings before they apply.

🔗 **Live App:** [scamshieldjobs.vercel.app](https://scamshieldjobs.vercel.app)
🔗 **Portfolio:** [scamshield-portfolio.vercel.app](https://scamshield-portfolio.vercel.app)
📧 **Feedback:** scamshieldjobs@gmail.com

---

## What It Does

Job scams are a growing problem — fake postings that harvest personal data, run advance-fee schemes, or impersonate real companies. ScamShield Jobs lets a user paste in a job posting (URL or text) and get back a legitimacy score, a plain-language explanation of red flags, and a downloadable report they can reference or share.

## 3-Layer Detection System

1. **Known scam domain database** — checks against a maintained list of flagged domains
2. **Google Safe Browsing API** — cross-references Google's threat intelligence
3. **AI analysis (Gemini 2.5 Flash)** — reads the posting itself for scam language patterns, unrealistic pay claims, urgency tactics, and other red flags

This layered approach means a single point of failure (e.g., a brand-new scam domain not yet blocklisted) doesn't leave the user unprotected — the AI layer catches what the databases haven't seen yet.

## Features

- Email/password authentication with per-user data isolation (Firebase Auth + Firestore)
- Real-time analysis with progress tracking
- Job legitimacy scoring with detailed explanations
- Searchable/filterable dashboard of past analyses
- PDF report generation for record-keeping
- Email alerts for flagged listings (via Resend)
- LinkedIn Post Generator (share verified-safe listings)
- Rate limiting and JWT-secured API routes

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15, TypeScript |
| Auth & Database | Firebase Auth, Firestore |
| AI | Google Gemini 2.5 Flash |
| Threat Intel | Google Safe Browsing API |
| Email | Resend |
| PDF Generation | jsPDF |
| Styling | Tailwind CSS |
| Hosting | Vercel |

## Security Considerations

- Per-user Firestore data isolation — no cross-account data access
- JWT authentication enforced on all API routes
- Rate limiting (10 requests/min) to prevent abuse
- Server-side input validation on all user-submitted content
- Strong password requirements enforced at signup

## Status

🚧 **Active beta testing.** Feedback welcome at scamshieldjobs@gmail.com.

## About

Built by Julius Rowe, a Cybersecurity & IAM Engineer, as a practical application of security principles (defense-in-depth, layered detection) to a real-world consumer protection problem.

[Demo Video]((https://www.loom.com/share/8b01b2c2b91f4c9fa7c7d1c84d6ca000)) · [Portfolio](https://scamshield-portfolio.vercel.app)

