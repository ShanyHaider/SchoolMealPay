# SchoolMealPay

A production-grade, multi-tenant SaaS platform for school canteen management — built as a Final Year Project and fully deployed.

🔗 **Live Demo:** https://schoolmealpay.vercel.app

---

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Server Actions, Drizzle ORM
- **Database:** PostgreSQL
- **Auth:** Clerk (multi-tenant, role-based)
- **Payments:** Stripe (subscription billing + PKR wallet)
- **Deployment:** Vercel + AWS CloudFront
- **AI:** Groq API (llama-3.3-70b) for meal suggestions
- **PWA:** Push notifications via VAPID + Service Worker

---

## Features

- **4 user roles:** System Admin, School Admin, Canteen Staff, Parent
- Multi-tenant architecture with isolated data access per school
- Stripe subscription tiers (Free/Premium) for schools and parents
- PKR-denominated wallet with atomic transactions (`FOR UPDATE` locking)
- PWA with real-time push notifications
- AI-powered meal suggestions
- 70-case test suite including edge and negative cases
- Fully responsive across Chrome, Safari, Firefox, and Edge

---

## Screenshots

*Coming soon*

---

## Local Development

```bash
git clone https://github.com/ShanyHaider/SchoolMealPay
cd fyp
npm install
cp .env.example .env.local  # Add your environment variables
npm run dev
```

---

Built with Next.js 15 · TypeScript · PostgreSQL · Deployed on Vercel
