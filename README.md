# PulseSpend

PulseSpend is a premium offline-first Expo app for tracking UPI spending from local sources. It stores everything in SQLite, supports secure local authentication, imports transactions from SMS, pasted email statements, and bank statement files, and surfaces analytics through a polished fintech-style UI.

## Highlights

- Offline-first architecture with local SQLite storage
- Secure local auth with signup, login, session restore, biometrics, and password reset
- SMS import for Android development/release builds
- Offline email statement import from pasted bank email content
- Bank statement import from CSV and text-based PDF files
- Duplicate-aware transaction ingestion across SMS, email, and bank sources
- Import history with source badges and duplicate summaries
- Indexed transaction queries with dynamic filters
- Dashboard with charts, heatmap, streaks, and merchant insights
- CSV export for sharing or backup
- Dark theme by default with persisted theme switching

## Stack

- Expo SDK 54
- React Native
- TypeScript
- Expo SQLite
- Expo Secure Store
- Expo Local Authentication
- Expo Crypto
- Zustand
- React Navigation
- Victory Native XL
- Reanimated
- Day.js
- bcryptjs
- Jest + jest-expo

## Project Structure

```text
src/
  auth/
  components/
  db/
  hooks/
  navigation/
  screens/
  store/
  theme/
  types/
  utils/
assets/
```

## Core Features

### Authentication

- Offline signup with locally stored users
- Password hashing with `bcryptjs` plus Expo crypto-backed randomness
- Secure session persistence with `expo-secure-store`
- Optional biometric unlock using `expo-local-authentication`
- Forgot password flow based on local user metadata
- Local profile editing for name and email

### Transaction Ingestion

- SMS parsing for UPI-style messages
- Email import from pasted statement/email text
- Bank statement import from CSV and text-based PDF files
- Shared normalization and deduplication across SMS, email, and bank sources
- Import history log with source badges, timestamps, and duplicate counts
- Rule-based categorization with manual override support

### Dashboard and Insights

- Monthly and daily spend cards
- Daily trend chart
- Category mix chart
- Spending heatmap
- No-spend streak
- Favorite merchants
- Weekly comparison
- Smart budget alerts

### Utilities

- Advanced filters
- CSV export
- Local database reset
- Themed in-app dialogs instead of plain native alerts

## Database

SQLite is initialized in [src/db/database.ts](C:\Users\KK COMPUTERS\Documents\PulseSpend\src\db\database.ts) with WAL mode enabled.

### Tables

`users`

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `name TEXT NOT NULL`
- `email TEXT UNIQUE NOT NULL`
- `password_hash TEXT NOT NULL`
- `created_at TEXT DEFAULT CURRENT_TIMESTAMP`

`transactions`

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `amount REAL NOT NULL`
- `merchant TEXT`
- `category TEXT`
- `app_source TEXT`
- `type TEXT`
- `date TEXT`
- `created_at TEXT DEFAULT CURRENT_TIMESTAMP`

`import_events`

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `source TEXT NOT NULL`
- `file_name TEXT`
- `total_parsed INTEGER NOT NULL DEFAULT 0`
- `inserted_count INTEGER NOT NULL DEFAULT 0`
- `duplicates_skipped INTEGER NOT NULL DEFAULT 0`
- `notes TEXT`
- `created_at TEXT DEFAULT CURRENT_TIMESTAMP`

### Indexes

- `idx_users_email`
- `idx_date`
- `idx_category`
- `idx_app_source`
- `idx_source`
- `idx_import_events_created_at`
- `idx_import_events_source`

## Auth Flow

Main auth logic lives in [src/auth/authService.ts](C:\Users\KK COMPUTERS\Documents\PulseSpend\src\auth\authService.ts) and [src/hooks/useAuth.tsx](C:\Users\KK COMPUTERS\Documents\PulseSpend\src\hooks\useAuth.tsx).

Implemented flows:

- `signup(name, email, password)`
- `login(email, password)`
- `logout()`
- `getCurrentUser()`
- `resetPassword(name, email, newPassword)`
- `updateProfile(userId, name, email)`
- biometric unlock

## Import System

### SMS

SMS parsing is implemented in [src/utils/smsParser.ts](C:\Users\KK COMPUTERS\Documents\PulseSpend\src\utils\smsParser.ts).

Important note:

- Expo Go cannot read SMS inbox data.
- SMS sync works in an Android development build or release APK because the native SMS module must be included in the app binary.

### Email

Email import is implemented in [src/utils/emailParser.ts](C:\Users\KK COMPUTERS\Documents\PulseSpend\src\utils\emailParser.ts) and [src/hooks/useEmailSync.ts](C:\Users\KK COMPUTERS\Documents\PulseSpend\src\hooks\useEmailSync.ts).

Current offline approach:

- Paste one or more bank emails or statement blocks into the app
- Use `---` between email blocks if importing multiple messages
- Transactions are parsed locally and inserted into SQLite

This app does not currently connect to Gmail or IMAP because the product is intentionally offline-first and backend-free.

### Bank Statements

Bank statement import is implemented in:

- [src/screens/ImportScreen.tsx](C:\Users\KK COMPUTERS\Documents\PulseSpend\src\screens\ImportScreen.tsx)
- [src/utils/csvParser.ts](C:\Users\KK COMPUTERS\Documents\PulseSpend\src\utils\csvParser.ts)
- [src/utils/pdfParser.ts](C:\Users\KK COMPUTERS\Documents\PulseSpend\src\utils\pdfParser.ts)
- [src/utils/normalizer.ts](C:\Users\KK COMPUTERS\Documents\PulseSpend\src\utils\normalizer.ts)
- [src/utils/deduplicator.ts](C:\Users\KK COMPUTERS\Documents\PulseSpend\src\utils\deduplicator.ts)

Current support:

- CSV statements with common date/description/debit/credit column names
- Text-based PDF statements
- preview before import
- import history with counts for parsed, inserted, and duplicate rows

Note:

- Scanned image PDFs are not OCR-processed yet. The current parser expects selectable text inside the PDF.

### Duplicate Handling

Bulk imports in [src/db/queries.ts](C:\Users\KK COMPUTERS\Documents\PulseSpend\src\db\queries.ts) skip duplicates using:

- same transaction type
- amount within tolerance
- date within a 1-day window
- fuzzy-normalized merchant matching
- metadata merge when a bank import has richer merchant/category/source details

This helps avoid duplicate inserts when the same expense appears in SMS, email, and bank statement imports.

### Import History

Every import path now logs an event into SQLite:

- SMS inbox sync
- pasted email import
- bank CSV/PDF import

The Imports screen shows:

- source badges
- timestamps
- file names or notes
- total parsed rows
- inserted rows
- duplicates skipped

## Screens

- Login
- Signup
- Forgot Password
- Dashboard
- Transactions
- Imports
- Filters
- Insights
- Settings

## Run Locally

```bash
npm install
npx expo start
```

For native capabilities such as SMS reading and full auth/native module validation:

```bash
npx expo run:android
```

## Preview Build

An EAS preview profile is included in [eas.json](C:\Users\KK COMPUTERS\Documents\PulseSpend\eas.json).

To create an Android preview build:

```bash
npx eas build --platform android --profile preview
```

This is the recommended path for testing:

- SMS import
- Secure Store
- biometric auth
- other native modules outside Expo Go

## Validation

Validated commands:

- `npm run typecheck`
- `npm test`
- `npx expo-doctor`

## Tests

Auth tests live in [src/auth/authService.test.ts](C:\Users\KK COMPUTERS\Documents\PulseSpend\src\auth\authService.test.ts).
Import and dedup tests live in [src/utils/importPipeline.test.ts](C:\Users\KK COMPUTERS\Documents\PulseSpend\src\utils\importPipeline.test.ts).

Covered scenarios:

- signup success
- duplicate email rejection
- login success
- login missing-account failure
- password reset success
- password reset metadata mismatch failure
- session creation
- profile update success
- profile update duplicate-email rejection
- CSV parsing normalization
- duplicate detection across near-match merchant/date combinations

## Improvement Notes

Areas already improved in this pass:

- consistent in-app popup styling
- centered auth screens
- reduced startup work before auth
- lazy tab screen loading
- more resilient account creation and password hashing
- offline email import and duplicate-aware ingestion
- bank statement import with CSV/PDF parsing
- import history tracking with source badges and duplicate summaries
- local profile editing

Recommended next improvements:

- import history with source labels and timestamps
- unit tests for SMS/email parsing and dedupe rules
- category budgets with local notifications
- attachment-based `.eml` or CSV statement import
- richer profile metadata for stronger password reset verification
