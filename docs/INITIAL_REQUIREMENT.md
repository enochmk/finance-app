# Initial Requirement Prompt

This document captures the core requirements for the **Manual Expenses Tracker** application. Use this as a guide when planning, building, or reviewing the project.

---

## 🎯 Goal

Provide a lightweight finance management tool where users can track expenses and income across multiple wallets. The app should support authentication, currency handling, transaction categorization, and exports, with a responsive UI that includes theme switching.

---

## 🔧 Functional Requirements

### Wallets

- Users can create, update, and delete multiple wallets.
- Each wallet specifies a currency (e.g., **GHS/cedis** or **USD**).
- Transfers between wallets are allowed.

### Transactions

- Record credits (income) and debits (expenses) per wallet.
- Assign transactions to categories. Default list:
  - Fuel, Shopping, Vehicle, Investments, Internet, Housing, Food & Drinks,
    Fitness, Gym, Transportation, Gifts, Loan
  - Users should be able to extend/customize categories.
- Filter and view transactions across all wallets or by selected wallet(s).

### Authentication

- Local user authentication backed by PostgreSQL.
- Store passwords securely.
- Implement session or token-based authentication flows.

### Data Export

- Export transaction history to **CSV** and **XLS** formats.
- Support exporting data for individual wallets or all wallets combined.

### API & Documentation

- Build a RESTful API with clear endpoints.
- Provide a Postman collection covering all routes.

### User Interface

- Responsive front-end built with React.
- Light and dark theme toggle.

---

## 🛠 Technical Stack

- **Backend:** Node.js + Express with TypeScript
- **Frontend:** Tanstack Start/React, React Query, ShadCN UI components, and Tailwind CSS for styling
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** Better Auth for local authentication
- **Styling:** Tailwind CSS and **ShadCN** UI components
- **Validation** Zod for schema validation on the backend and frontend forms

---

## 📁 Related Artifacts

- `README.md` – project setup, running instructions, and architecture notes
- `AGENTS.md` – guidelines or notes related to AI/agent use in the project

---

> This prompt may be updated as features evolve or new requirements arise.

---

_End of prompt._
