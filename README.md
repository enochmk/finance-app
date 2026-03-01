# Manual Expenses Tracker

A lightweight personal finance application to manage multiple wallets,
track expenses and income, and analyze transactions with export support.

## 📌 Features

- Multiple wallet support with currency (GHS, USD, etc.)
- Credit and debit transactions per wallet
- Transfer funds between wallets
- Categorize transactions (Fuel, Shopping, Investments, etc.)
- Local authentication using PostgreSQL
- Export transaction data as CSV or XLS
- Filterable transaction views across wallets
- RESTful API with Postman collection
- Responsive React frontend with light/dark mode

## 🛠 Tech Stack

- **Backend:** Node.js, Express
- **Database:** PostgreSQL, Prisma ORM
- **Frontend:** React, TanStack Router, React Query
- **Auth:** Better Auth (or equivalent)
- **Styling:** Tailwind CSS, ShadCN UI

## 🚀 Getting Started

### Prerequisites

- Node.js >= 16
- PostgreSQL
- npm or yarn

### Setup

1. Clone the repository:
   ```bash
   git clone <repo-url> finance-web-app
   cd finance-web-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or yarn
   ```

3. Create a `.env` file based on `.env.example` and configure your
   database URL and other secrets.

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Running the Frontend

If the frontend is separate or served by the same node server, ensure
your React app can start with:
```bash
npm run dev
```

The UI should be available at `http://localhost:3000` (or the port
specified).

## 📄 API Documentation

Import the provided Postman collection (`postman_collection.json`) to
explore and test the backend endpoints.

## 🧩 Project Structure

- `src/` — application source code
- `prisma/` — database schema and migrations
- `prompts/` — requirement and agent documentation

## 📝 Contributing

Feel free to open issues or submit pull requests. Ensure code passes
linting and tests (if applicable) and update documentation accordingly.

## 📂 Related Documents

- See `prompts/INITIAL-REQUIREMENT-PROMPT.md` for feature requirements.
- `AGENTS.md` contains notes regarding AI/agent integration.

## ⚖️ License

[Specify license here]

---

_Last updated: March 1, 2026_