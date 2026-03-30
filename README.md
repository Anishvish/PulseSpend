# PulseSpend

PulseSpend is a premium offline-first UPI expense tracker built with Expo and React Native. It stores data locally in SQLite, parses UPI-style transaction messages, and surfaces analytics through a polished fintech-style dashboard.

## Highlights

- Offline-first architecture with local SQLite storage
- Indexed transaction queries with dynamic filters
- SMS parsing for UPI expense detection on Android development builds
- Email parsing groundwork for future inbox-based expense ingestion
- Zustand state management
- Dashboard with trends, category mix, heatmap, streaks, and insights
- CSV export for sharing or backup
- Dark theme by default with persisted theme switching

## Stack

- Expo SDK 54
- React Native
- TypeScript
- Expo SQLite
- Zustand
- React Navigation bottom tabs
- Victory Native XL
- Reanimated
- Day.js

## Project Structure

```text
src/
  components/
  db/
  hooks/
  navigation/
  screens/
  store/
  theme/
  types/
  utils/
```

## Features

### Dashboard

- Monthly spend and today spend metric cards
- Daily spending line chart
- Category distribution chart
- Spending heatmap for the last 4 weeks
- No-spend day streak
- Smart budget alert messaging

### Transactions

- Grouped by date
- Swipe actions for delete and category edit
- Manual category override support

### Filters

- Date range filtering
- Multi-select category filtering
- Multi-select app source filtering
- Amount range filtering
- Merchant search

### Insights

- Weekly comparison
- Top category
- Top merchant
- Highest single spend
- Favorite merchant detection

### Settings

- Theme toggle
- SMS re-sync
- CSV export
- Local database reset

## Data Layer

The SQLite database is initialized in [`src/db/database.ts`](C:\Users\KK COMPUTERS\Documents\PulseSpend\src\db\database.ts) and uses WAL mode for better local write performance.

### Schema

`transactions`

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `amount REAL NOT NULL`
- `merchant TEXT`
- `category TEXT`
- `app_source TEXT`
- `type TEXT`
- `date TEXT`
- `created_at TEXT DEFAULT CURRENT_TIMESTAMP`

### Indexes

- `idx_date`
- `idx_category`
- `idx_app_source`

### Query APIs

Implemented in [`src/db/queries.ts`](C:\Users\KK COMPUTERS\Documents\PulseSpend\src\db\queries.ts):

- `insertTransaction`
- `bulkInsertTransactions`
- `getTransactions`
- `getSummary`
- `getCategoryStats`
- `getDailyTrend`
- `getTopMerchants`
- `deleteTransaction`
- `updateCategory`
- `resetDatabase`

## SMS Parsing

Implemented in [`src/utils/smsParser.ts`](C:\Users\KK COMPUTERS\Documents\PulseSpend\src\utils\smsParser.ts).

It detects common UPI transaction patterns such as:

- `Rs.500 debited`
- `₹500 paid to`
- `UPI Ref`

Extracted fields:

- amount
- merchant
- category
- app source
- type
- date

## Email Spending Support

PulseSpend now includes parser groundwork in [`src/utils/emailParser.ts`](C:\Users\KK COMPUTERS\Documents\PulseSpend\src\utils\emailParser.ts) for transaction-style emails such as bank alerts, card charges, and merchant confirmations.

What is included:

- text-based transaction extraction from email subject/body
- app source normalization to `Email`
- automatic categorization using the existing merchant rules
- batch parsing support that returns normalized transaction records

What is not yet included:

- direct Gmail or IMAP sync
- background mailbox permissions flow
- account linking UI

Why this is staged:

- there is no backend in this app by design
- Gmail access requires OAuth and online APIs
- generic email sync is much more sensitive than SMS parsing and needs careful UX and privacy design

Recommended next step:

- support importing `.eml` files or forwarded plain-text statements for a fully offline flow

## Android Notes

SMS inbox reading requires a native Android capability and will not work inside Expo Go. Use an Android development build for the inbox sync feature.

## Run Locally

```bash
npm install
npx expo start
```

To run with native SMS access on Android:

```bash
npx expo run:android
```

## Validation Completed

The project has been validated with:

- `npm run typecheck`
- `npx expo-doctor`

Both pass successfully.

## Production Considerations

- keep SMS/email parsing logic rule-based and testable
- add onboarding and permissions education before inbox access
- introduce import history tracking for ingestion sources
- add local encryption if device-level threat protection becomes a requirement
- consider recurring budget targets and local notifications for alerts

## Future Ideas

- offline email statement import
- recurring merchant detection
- monthly budgets by category
- receipt attachment support
- richer merchant insights and anomaly detection
