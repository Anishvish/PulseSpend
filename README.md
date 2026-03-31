# PulseSpend

> **Offline-first personal expense intelligence for UPI-heavy lifestyles.**

PulseSpend is a premium React Native (Expo) mobile app that tracks your UPI spending entirely on-device. It ingests transactions from SMS, pasted email statements, and bank CSV/PDF files, stores everything in SQLite, and surfaces rich analytics through a fintech-grade UI — all without any backend or cloud dependency.

---

## ✨ Features

### 🔐 Authentication & Security
- **Local signup & login** — accounts stored securely in on-device SQLite
- **Password hashing** — bcryptjs with Expo Crypto-backed randomness
- **Secure sessions** — persisted via `expo-secure-store`
- **Biometric unlock** — fingerprint / face unlock via `expo-local-authentication`
- **Forgot password** — offline reset flow using local user metadata verification
- **Profile editing** — update name and email locally with duplicate-email protection

### 📥 Multi-Source Transaction Import
- **SMS inbox sync** — auto-parse UPI transaction messages on Android dev/release builds
- **Email statement import** — paste one or more bank email bodies (separate with `---`)
- **Bank CSV import** — handles common column layouts (date, description, debit, credit)
- **Bank PDF import** — extract transactions from text-based PDF statements
- **Smart deduplication** — fuzzy merchant matching, amount tolerance, and date windowing across all sources
- **Metadata merging** — richer merchant/category details from bank imports backfill older SMS entries
- **Import history log** — every import run is recorded with source badges, file names, timestamps, parsed/inserted/duplicate counts

### 📊 Dashboard & Analytics
- **Monthly & daily spend cards** — real-time totals with debit counts
- **Daily trend line chart** — 30-day spending curve via Victory Native
- **Category mix donut chart** — top 5 category breakdown with animated slices
- **Spending heatmap** — visual grid to spot dense spending clusters
- **No-spend streak** — gamified tracking of consecutive zero-spend days
- **Budget progress bar** — configurable monthly budget with progress indicator
- **Smart notes** — AI-style contextual alerts when nearing budget limits

### 💡 Insights
- **Weekly delta** — percentage change vs. prior week
- **Top category & merchant** — auto-detected from cumulative spend
- **Highest single spend** — peak transaction surfaced instantly
- **Favorite merchants** — top 3 merchants by volume
- **Smart budget alerts** — proactive warning when budget utilization exceeds 90%

### 🔍 Transactions & Filters
- **Full transaction ledger** — scrollable list with swipe-to-delete
- **Category chips** — quick filter by detected categories
- **App source filter** — filter by originating app (SMS, Email, Bank)
- **Amount range filter** — min/max amount sliders
- **Date range filter** — start/end date pickers
- **Search** — fuzzy merchant name search
- **Manual category override** — tap to reassign any transaction's category

### ⚙️ Settings & Utilities
- **Theme switching** — dark/light mode with persisted preference
- **CSV export** — share your filtered ledger as a CSV file
- **Dashboard refresh** — force reload all computed metrics
- **Database reset** — wipe all local data with confirmation dialog
- **Logout** — clear secure session with confirmation
- **In-app dialogs** — styled confirmation/alert popups instead of native alerts

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54 + React Native 0.81 |
| Language | TypeScript 5.9 |
| Database | expo-sqlite (SQLite with WAL mode) |
| State | Zustand |
| Navigation | React Navigation (Bottom Tabs + Native Stack) |
| Charts | Victory Native XL + React Native Skia |
| Animations | React Native Reanimated |
| Security | expo-secure-store, expo-local-authentication, expo-crypto, bcryptjs |
| Date Handling | Day.js |
| File Parsing | PapaParse (CSV), pdfjs-dist (PDF) |
| Testing | Jest + jest-expo |

---

## 📁 Project Structure

```text
src/
├── auth/           # Auth service, password hashing, and tests
├── components/     # Reusable UI: GlassCard, MetricCard, HeatmapGrid, etc.
├── db/             # SQLite database init, queries, and migrations
├── hooks/          # useAuth, useBootstrap, useDialog, useSmsSync, useEmailSync
├── navigation/     # RootNavigation with auth stack and bottom tabs
├── screens/        # Dashboard, Transactions, Imports, Filters, Insights, Settings
├── store/          # Zustand transaction store
├── theme/          # Dark/light theme definitions and ThemeProvider
├── types/          # TypeScript type definitions
└── utils/          # SMS/email/CSV/PDF parsers, categorizer, deduplicator, normalizer
assets/             # App icon and splash assets
```

---

## 🗄️ Database Schema

SQLite is initialized with WAL mode in `src/db/database.ts`. Schema migrations are applied automatically on startup.

### Tables

**`users`**

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| name | TEXT | NOT NULL |
| email | TEXT | UNIQUE NOT NULL |
| password_hash | TEXT | NOT NULL |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP |

**`transactions`**

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| amount | REAL | NOT NULL |
| merchant | TEXT | — |
| category | TEXT | — |
| app_source | TEXT | — |
| source | TEXT | DEFAULT 'sms' |
| type | TEXT | CHECK('debit', 'credit') NOT NULL |
| date | TEXT | NOT NULL |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP |

**`import_events`**

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| source | TEXT | NOT NULL |
| file_name | TEXT | — |
| total_parsed | INTEGER | NOT NULL DEFAULT 0 |
| inserted_count | INTEGER | NOT NULL DEFAULT 0 |
| duplicates_skipped | INTEGER | NOT NULL DEFAULT 0 |
| notes | TEXT | — |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP |

### Indexes

- `idx_users_email` — fast email lookup during login
- `idx_date` — date-range queries on transactions
- `idx_category` — category-based filtering
- `idx_app_source` — filter by originating app
- `idx_source` — filter by import source type
- `idx_import_events_created_at` — recent imports ordering
- `idx_import_events_source` — import history by source

### Migrations

The `source` column on `transactions` was added post-initial release. The init function checks `PRAGMA table_info` and runs `ALTER TABLE` if the column is missing, ensuring the index is created only after the column exists.

---

## 🔄 Auth Flow

Auth is handled by `src/auth/authService.ts` and `src/hooks/useAuth.tsx`.

| Function | Purpose |
|----------|---------|
| `signup(name, email, password)` | Create local account with hashed password |
| `login(email, password)` | Verify credentials and persist session |
| `logout()` | Clear secure session |
| `getCurrentUser()` | Restore session from secure store |
| `resetPassword(name, email, newPassword)` | Offline reset with metadata verification |
| `updateProfile(userId, name, email)` | Edit local profile with duplicate protection |
| Biometric unlock | Optional fingerprint/face via expo-local-authentication |

---

## 📲 Import System

### SMS Sync
- Parses UPI transaction messages from the Android inbox
- **Requires** a development build or release APK (Expo Go cannot access SMS)
- Hook: `src/hooks/useSmsSync.ts` · Parser: `src/utils/smsParser.ts`

### Email Import
- Paste bank email or statement text directly into the app
- Supports multiple email blocks separated by `---`
- Fully offline — no Gmail/IMAP connection needed
- Hook: `src/hooks/useEmailSync.ts` · Parser: `src/utils/emailParser.ts`

### Bank Statement Import
- **CSV**: Auto-detects date/description/debit/credit columns via PapaParse
- **PDF**: Extracts text from selectable-text PDFs (scanned/image PDFs not supported)
- Preview parsed transactions before importing
- Screen: `src/screens/ImportScreen.tsx` · Parsers: `src/utils/csvParser.ts`, `src/utils/pdfParser.ts`

### Deduplication
All import paths share a common deduplication engine (`src/utils/deduplicator.ts`):
- Same transaction type and amount within tolerance
- Date within a ±1 day window
- Fuzzy-normalized merchant name matching
- Richer metadata from bank imports is merged into existing records

---

## 📱 Screens

| Screen | Description |
|--------|-------------|
| **Login** | Email + password with biometric option |
| **Signup** | Create local account |
| **Forgot Password** | Reset via name + email verification |
| **Dashboard** | Spend cards, trend chart, category donut, heatmap, smart notes |
| **Transactions** | Full ledger with search, swipe-delete, category editing |
| **Imports** | Bank CSV/PDF import with preview, import history log |
| **Filters** | Category, app source, amount range, and date filters |
| **Insights** | Weekly delta, top categories/merchants, budget alerts |
| **Settings** | Sync, export, theme, profile, reset, logout |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli` or use `npx expo`)

### Run Locally
```bash
npm install
npx expo start
```

### Android Development Build (for SMS sync & native modules)
```bash
npx expo run:android
```

### EAS Preview Build
An EAS preview profile is included in `eas.json`:
```bash
npx eas build --platform android --profile preview
```
This is recommended for testing SMS import, Secure Store, biometric auth, and other native modules outside Expo Go.

---

## ✅ Validation

```bash
npm run typecheck     # TypeScript compilation check
npm test              # Jest test suite
npx expo-doctor       # Expo dependency health check
```

---

## 🧪 Tests

| Test File | Coverage |
|-----------|----------|
| `src/auth/authService.test.ts` | Signup, duplicate email, login, missing account, password reset, session, profile update |
| `src/utils/importPipeline.test.ts` | CSV parsing, normalization, duplicate detection across merchants/dates |

---

## 🗺️ Roadmap

- [ ] Category budgets with local push notifications
- [ ] Attachment-based `.eml` and CSV import via file picker
- [ ] OCR support for scanned/image PDF bank statements
- [ ] Unit tests for SMS and email parsers
- [ ] Richer profile metadata for stronger password reset verification
- [ ] Monthly/weekly report generation with charts
- [ ] Multi-currency support

---

## 📄 License

This project is private and not currently published under an open-source license.
