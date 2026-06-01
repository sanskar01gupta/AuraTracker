# Aura Alert — Premium Personal Price Tracker

A complete, production-ready, lightweight e-commerce price monitoring application built with a premium, Apple-inspired minimalist user interface and an extremely low-memory backend architecture.

Designed for **personal scale**, Aura Alert lets you track price drops, restocks, and rapid 10% reductions across major e-commerce platforms (Amazon, Flipkart, Myntra, Ajio, etc.) without complex user accounts, sign-ups, or heavyweight databases.

---

## ✦ Key Features

- **Apple Minimalist UI**: Sleek dark/light theme pairing, glassmorphism card layouts, smooth transitions, skeleton states, and mobile responsive design.
- **Zero-Friction Privacy Dashboard**: An local-session dashboard that utilizes the browser’s `localStorage` to cache tracked item IDs. Your tracking list is 100% private to your device!
- **Instant Scan Extraction**: Paste a product link, and the system automatically extracts the title, price, store name, and product image preview in the background.
- **Automated Fallback Inputs**: If a site is highly protected (e.g. strict Cloudflare block), the app gracefully provides a clean manual entry form so you can track *any* link under any circumstances!
- **Unified Email Alerts**: Real-time alerts sent directly to your inbox via **Resend API** (free, easy API setup) or standard **Nodemailer SMTP** integrations.
- **Micro-Memory Architecture**: Utilizes a local SQLite database file (`data/price_alerts.db`) for lightweight local storage with zero hosting database subscription overhead.

---

## ✦ Project Structure

```
price-alert-app/
├── data/
│   └── price_alerts.db     # SQLite local database (generated automatically)
├── scripts/
│   └── cron-check.js       # Standalone Node trigger utility for daily schedules
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── alerts/
│   │   │   │   ├── route.ts        # CRUD handler (Create, Update, Delete)
│   │   │   │   └── batch/route.ts  # LocalStorage syncing batched getter
│   │   │   ├── cron/route.ts       # Core Daily verification runner
│   │   │   └── extract/route.ts    # Universal metadata/HTML scraper
│   │   ├── globals.css     # Premium themes, glass effects, animations
│   │   ├── layout.tsx      # Layout & FOUC-immune dark/light scripts
│   │   └── page.tsx        # Responsive hero landing layout
│   ├── components/
│   │   ├── AlertsDashboard.tsx # Filtered list controls & inline card editors
│   │   ├── SetAlertModal.tsx   # Automated scraper form with active success stages
│   │   ├── SupportedStores.tsx # Store lists
│   │   └── ThemeToggle.tsx     # Apple theme toggler (Sun / Moon)
│   └── lib/
│       ├── db.ts           # SQLite better-sqlite3 wrapper & schema
│       ├── email.ts        # Minimal premium HTML mail templates & SMTP/Resend bindings
│       └── scraper.ts      # Cheerio + Axios rotation scraper engine
├── .env.example            # Environment variables templates
├── .env.local              # Local credentials file (auto-generated for zero-setup dev)
├── package.json            # Fast Next.js standard dependencies
└── tsconfig.json           # Type configs
```

---

## ✦ Local Development & Quick Start

Aura Alert is preconfigured with zero-setup defaults so you can test it immediately!

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Local Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The application will immediately run in either Light or Dark mode depending on your system configuration.

### 3. Add an Alert
- Paste any product link from Amazon, Flipkart, Myntra, or Ajio.
- Click **"Scan Link"** to preview the title, current price, store, and image.
- Set your target price and email.
- Click **"Create Alert"**. The alert will be stored, and the dashboard will immediately populate!

---

## ✦ Setting up Daily Price Checks (Cron)

Aura Alert runs checks once every 24 hours. The API endpoint `/api/cron` processes checks, checks rules, and fires emails.

### How to trigger checks automatically:
A standalone trigger utility resides in `scripts/cron-check.js`.

#### Option A: Linux/macOS Crontab
Open your crontab editor:
```bash
crontab -e
```
Add the following line to execute once daily at 6:00 AM:
```bash
0 6 * * * APP_URL="https://your-production-app.vercel.app" CRON_SECRET="your_secret_token" node /path/to/price-alert-app/scripts/cron-check.js >> /var/log/price-alert-cron.log 2>&1
```

#### Option B: Windows Task Scheduler
1. Create a basic task in Windows Task Scheduler.
2. Trigger: **Daily**.
3. Action: **Start a program**.
4. Program/script: `node`.
5. Add arguments: `C:\path\to\price-alert-app\scripts\cron-check.js`.
6. Configure environment variables in `.env.local` to let it know the right `APP_URL` and `CRON_SECRET`.

#### Option C: Vercel Cron Jobs (for Serverless)
If you deploy on Vercel, you can configure standard Vercel Crons. Create a `vercel.json` file in the root directory:
```json
{
  "crons": [
    {
      "path": "/api/cron?secret=your_cron_secret",
      "schedule": "0 6 * * *"
    }
  ]
}
```

---

## ✦ Production Deployment Configuration

### 1. Environment Setup (`.env.production`)
Create a production environment file and configure the secure elements:
```env
CRON_SECRET=a_very_long_secure_random_string
APP_URL=https://your-app-domain.com

# Setup your preferred email delivery system:
EMAIL_FROM="Aura Alert <no-reply@yourdomain.com>"

# Option A: Resend Integration (Recommended)
RESEND_API_KEY=re_your_resend_api_key

# Option B: SMTP Nodemailer integration
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

### 2. Platform Selection
- **Railway / Render / VPS (Recommended for SQLite)**:
  Since SQLite relies on a local filesystem, platforms with persistent storage are highly recommended. Simply link your GitHub repository, configure variables, and run!
- **Vercel (Serverless)**:
  You can deploy on Vercel's free tier. Note that SQLite filesystem writes are ephemeral on serverless platforms. For zero-infra database persistence on Vercel:
  - You can link a free serverless PostgreSQL database (e.g. Neon, Supabase) in `src/lib/db.ts` or simply run the SQLite database, acknowledging that the Vercel server restarts will clear active database tracks occasionally (perfect for single-user local development servers).

---

## ✦ Core Rule Triggers

Alerts are sent to your configured inbox under three simple circumstances:
1. **Target Met**: Scraped Price $\le$ Target Price.
2. **Stock Return** *(Optional Toggle)*: Scraped Stock went from Out of Stock to In Stock.
3. **10% Price Drop** *(Optional Toggle)*: Scraped Price decreases by $\ge 10\%$ compared to your initially saved current price.

Once triggered, the alert's status switches to `triggered` so you don't get repeated daily emails for the same item. You can easily click the inline Edit icon on your dashboard card, update your target price or settings, and it will immediately re-activate tracking!
