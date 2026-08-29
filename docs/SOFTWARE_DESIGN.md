# Expense Splitter — Software Design

> A learning project for NestJS microservices. Split bills among friends, track who owes whom, and settle up.

---

## 1. Goals

### Primary (learning)

- Build a **multi-service** NestJS application from scratch
- Practice **service boundaries**, **inter-service communication**, and **event-driven design**
- Run services locally with **Docker Compose** and optional **Kubernetes** later
- Keep each service small enough to understand in an afternoon

### Secondary (product)

- Create groups (e.g. "Roommates", "Trip to NYC")
- Add expenses with flexible split rules (equal, exact amounts, percentages)
- See running balances per member
- Record settlements when someone pays someone back

### Non-goals (for v1)

- Mobile apps, OAuth providers beyond email/password
- Multi-currency conversion
- Receipt OCR, payment integrations (Venmo, Stripe)
- Production-grade observability (add incrementally)

---

## 2. Domain Overview

### Core concepts

| Concept | Description |
|---------|-------------|
| **User** | A person with an account |
| **Group** | A shared context (trip, household) with members |
| **Expense** | Money spent by one member, split among others |
| **Split** | How an expense is divided (per-member share) |
| **Balance** | Net amount a member owes or is owed within a group |
| **Settlement** | A payment that reduces balances between two members |

### Example flow

1. Alice creates group "Weekend Trip" and invites Bob and Carol
2. Alice adds expense: $90 dinner, paid by Alice, split equally → each owes $30
3. Bob adds expense: $60 gas, paid by Bob, split equally
4. Balances: Alice owes Bob $10, Carol owes Alice $30 and Bob $20
5. Carol records settlement: paid Alice $30 → balances update

---

## 3. Architecture

### High-level diagram

```
                    ┌─────────────────┐
                    │   Web Client    │
                    │  (React / Next) │
                    └────────┬────────┘
                             │ HTTPS
                    ┌────────▼────────┐
                    │   API Gateway   │  NestJS HTTP + auth
                    │   (port 3000)   │
                    └────────┬────────┘
         ┌───────────────────┼───────────────────┐
         │ TCP/Redis         │                   │
    ┌────▼─────┐      ┌──────▼──────┐     ┌──────▼──────┐
    │  Users   │      │   Groups    │     │  Expenses   │
    │  :3001   │      │   :3002     │     │   :3003     │
    └────┬─────┘      └──────┬──────┘     └──────┬──────┘
         │                   │                   │
    users_db            groups_db            expenses_db
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │ events (Redis/NATS)
                    ┌────────▼────────┐
                    │   Balances      │  read model + settlements
                    │   :3004         │
                    └────────┬────────┘
                             │
                       balances_db
```

### Service responsibilities

| Service | Owns | Exposes |
|---------|------|---------|
| **API Gateway** | Routing, JWT validation, request aggregation | REST `/api/v1/*` to clients |
| **Users** | Accounts, profiles, credentials | Messages: `users.create`, `users.findById` |
| **Groups** | Groups, membership, invites | Messages: `groups.create`, `groups.addMember`, … |
| **Expenses** | Expenses, split lines | Messages: `expenses.create`, `expenses.listByGroup` |
| **Balances** | Balance snapshots, settlements | Messages: `balances.getGroup`, `settlements.create`; emits/consumes events |

Each service has its **own database** (database-per-service). No shared tables across services.

---

## 4. Communication Patterns

### Client → Gateway

- **REST/JSON** over HTTP
- JWT in `Authorization: Bearer <token>`
- Gateway validates token, forwards user context to downstream services

### Gateway → Services

- **NestJS microservices transport** (recommend **Redis** or **TCP** for local dev simplicity)
- Gateway acts as a **client**; services are **listeners**
- Request/response for queries and commands that need an immediate answer

```typescript
// Gateway calls Expenses service
this.expensesClient.send({ cmd: 'expenses.create' }, payload);
```

### Service → Service (async events)

Use a **message broker** for domain events so services stay loosely coupled:

| Event | Publisher | Subscribers |
|-------|-----------|-------------|
| `user.created` | Users | (optional) analytics |
| `group.member.added` | Groups | Balances (initialize member balance) |
| `expense.created` | Expenses | Balances (recalculate) |
| `expense.updated` | Expenses | Balances |
| `expense.deleted` | Expenses | Balances |
| `settlement.created` | Balances | (optional) Notifications |

**Pattern:** Expenses publishes events; Balances subscribes and maintains a **denormalized balance read model**. Avoid synchronous chains (Gateway → Expenses → Balances → Groups) for writes.

### Idempotency

Event handlers in Balances should be **idempotent** (store `eventId` or use upsert logic) so redelivery does not double-apply splits.

---

## 5. Data Models (per service)

### Users service

```typescript
User {
  id: uuid
  email: string
  displayName: string
  passwordHash: string
  createdAt: timestamp
}
```

### Groups service

```typescript
Group {
  id: uuid
  name: string
  createdBy: uuid        // userId (reference only, not FK)
  currency: string       // ISO 4217, e.g. "USD"
  createdAt: timestamp
}

GroupMember {
  id: uuid
  groupId: uuid
  userId: uuid
  role: 'owner' | 'member'
  joinedAt: timestamp
}
```

### Expenses service

```typescript
Expense {
  id: uuid
  groupId: uuid
  description: string
  amount: decimal        // store as integer cents or numeric(12,2)
  paidByUserId: uuid
  splitType: 'equal' | 'exact' | 'percentage'
  expenseDate: date
  createdAt: timestamp
}

ExpenseSplit {
  id: uuid
  expenseId: uuid
  userId: uuid
  amount: decimal        // owed share (computed or explicit)
}
```

**Split rules (v1):**

- `equal` — divide among selected members; gateway/service computes shares
- `exact` — caller supplies amounts; must sum to expense total
- `percentage` — caller supplies percentages; must sum to 100

### Balances service

```typescript
GroupBalance {
  groupId: uuid
  userId: uuid
  netBalance: decimal    // positive = owed to them, negative = they owe
  updatedAt: timestamp
}

Settlement {
  id: uuid
  groupId: uuid
  fromUserId: uuid
  toUserId: uuid
  amount: decimal
  note: string | null
  createdAt: timestamp
}
```

Balances can be **recomputed from expense events** or **incrementally updated**. For learning, start with incremental updates; add a `balances.rebuild` admin command later to verify correctness.

---

## 6. API Design (Gateway)

Base path: `/api/v1`

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Returns JWT |
| GET | `/auth/me` | Current user profile |

### Groups

| Method | Path | Description |
|--------|------|-------------|
| POST | `/groups` | Create group |
| GET | `/groups` | List user's groups |
| GET | `/groups/:id` | Group detail + members |
| POST | `/groups/:id/members` | Add member by userId or email |
| DELETE | `/groups/:id/members/:userId` | Remove member |

### Expenses

| Method | Path | Description |
|--------|------|-------------|
| POST | `/groups/:groupId/expenses` | Create expense |
| GET | `/groups/:groupId/expenses` | List expenses |
| GET | `/expenses/:id` | Expense detail |
| PATCH | `/expenses/:id` | Update |
| DELETE | `/expenses/:id` | Delete |

### Balances & settlements

| Method | Path | Description |
|--------|------|-------------|
| GET | `/groups/:groupId/balances` | Per-member net balances |
| GET | `/groups/:groupId/balances/simplified` | Pairwise debts (optional algorithm) |
| POST | `/groups/:groupId/settlements` | Record payment |

### Example: create expense

```http
POST /api/v1/groups/{groupId}/expenses
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "description": "Dinner",
  "amount": 90.00,
  "paidByUserId": "uuid-alice",
  "splitType": "equal",
  "memberIds": ["uuid-alice", "uuid-bob", "uuid-carol"],
  "expenseDate": "2026-08-28"
}
```

---

## 7. Authorization Rules

- Only **group members** can view group data, expenses, and balances
- Only **expense creator** or **group owner** can edit/delete an expense (pick one rule and stay consistent)
- Settlements: `fromUserId` must match authenticated user (you can only record that *you* paid someone)

**Implementation:** Groups service is the source of truth for membership. Gateway or downstream services call `groups.verifyMember(groupId, userId)` before mutating.

---

## 8. Balance Calculation

### Net balance (per user in a group)

For each expense:

- **Payer** is credited the full `amount`
- Each **split member** is debited their `share`

```
net[user] = sum(credits as payer) - sum(debits as split member) + settlementsReceived - settlementsPaid
```

### Simplified debts (optional v1.1)

Reduce N net balances to minimal pairwise transfers (graph simplification). Good stretch goal; not required for MVP.

---

## 9. Technology Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **NestJS** (monorepo) | First-class microservices, DI, modules |
| Transport | **Redis** (ioredis) | Easy local setup; supports pub/sub |
| API docs | **Swagger** (@nestjs/swagger) | Learning + manual testing |
| ORM | **TypeORM** or **Prisma** | Pick one across services |
| Databases | **PostgreSQL** per service | Realistic, one container each |
| Auth | **JWT** (@nestjs/jwt, passport) | Standard, lives in Gateway + Users |
| Validation | **class-validator** | DTOs at Gateway boundary |
| Frontend | **Next.js** or **React (Vite)** | Thin client; not the learning focus |
| Local infra | **Docker Compose** | Postgres × N, Redis, all services |
| Testing | **Jest** + **supertest** | Unit + e2e per service |

### Monorepo layout (recommended)

```
expense-splitter/
├── apps/
│   ├── gateway/
│   ├── users/
│   ├── groups/
│   ├── expenses/
│   └── balances/
├── libs/
│   ├── shared/          # DTOs, event types, constants (no DB code)
│   └── auth/            # JWT guards, decorators (gateway + optional reuse)
├── docker-compose.yml
├── nest-cli.json
└── package.json
```

Use **NestJS monorepo** (`nest generate app`) so shared types stay in sync without a published npm package.

---

## 10. Cross-Cutting Concerns

### Configuration

- `@nestjs/config` with `.env` per app
- Secrets (JWT secret, DB URLs) via environment variables only

### Logging

- Structured JSON logs with `requestId` propagated from Gateway
- Log service name on every line (`service=expenses`)

### Error handling

- Gateway maps microservice errors to HTTP status codes
- Use NestJS `RpcException` with `{ statusCode, message }` payload

### Health checks

- Each service: `GET /health` (HTTP health module on a side port, or TCP health pattern)
- Docker Compose `depends_on` + healthcheck for startup order

---

## 11. Distributed Design Decisions

### No distributed transactions (2PC)

Creating an expense does **not** synchronously update Balances in the same request. Flow:

1. Expenses persists expense + splits
2. Expenses publishes `expense.created`
3. Balances consumes event and updates read model
4. Client polls or receives updated balances (eventual consistency, typically < 1s locally)

**Tradeoff:** Brief window where expense exists but balance lags. Acceptable for this domain.

### Referential integrity across services

- Store `userId` and `groupId` as UUIDs **without foreign keys** across databases
- Validate existence via RPC when needed (e.g. create expense → verify group membership)
- Optional: cache membership in Expenses with TTL to reduce calls

### Shared library boundaries

`libs/shared` should contain:

- Event type definitions
- DTO interfaces (not entities)
- Message pattern constants (`EXPENSES_CREATE = 'expenses.create'`)

Do **not** share ORM entities between services.

---

## 12. Implementation Phases

### Phase 0 — Scaffold

- [ ] Nest monorepo, Docker Compose (Postgres × 4, Redis)
- [ ] Empty services with health checks wired

### Phase 1 — Users + Auth

- [ ] Register/login, JWT issuance
- [ ] Gateway auth guard

### Phase 2 — Groups

- [ ] CRUD groups, add/remove members
- [ ] Membership check message pattern

### Phase 3 — Expenses

- [ ] Create/list/update/delete with split logic
- [ ] Publish domain events to Redis

### Phase 4 — Balances

- [ ] Subscribe to expense events
- [ ] GET balances, POST settlements

### Phase 5 — Frontend + polish

- [ ] Minimal UI for one happy path
- [ ] Swagger docs, README runbook
- [ ] E2e test: register → group → expense → check balance

### Phase 6 — Stretch goals

- [ ] Simplified debt graph
- [ ] Invite links, email notifications service
- [ ] Kubernetes manifests / Helm chart
- [ ] OpenTelemetry tracing across services

---

## 13. Local Development

```bash
# Start infrastructure
docker compose up -d

# Run all services (separate terminals or concurrently)
npm run start:dev gateway
npm run start:dev users
npm run start:dev groups
npm run start:dev expenses
npm run start:dev balances
```

**Ports (suggested):**

| Service | HTTP | Microservice |
|---------|------|--------------|
| Gateway | 3000 | — |
| Users | 3001 | Redis/TCP |
| Groups | 3002 | Redis/TCP |
| Expenses | 3003 | Redis/TCP |
| Balances | 3004 | Redis/TCP |

---

## 14. Testing Strategy

| Level | Scope |
|-------|--------|
| **Unit** | Split calculation, balance delta logic, DTO validation |
| **Integration** | Service + real Postgres (Testcontainers optional) |
| **E2E** | Gateway HTTP flows with all services running |
| **Contract** | Shared event/DTO shapes in `libs/shared` (TypeScript types as contract) |

---

## 15. Open Questions (for you to decide)

1. **Transport:** Redis vs TCP vs NATS — Redis is simplest for local learning; NATS is closer to production event buses.
2. **ORM:** TypeORM (Nest-native) vs Prisma (better DX) — pick one for consistency.
3. **Frontend:** Include in monorepo or separate repo?
4. **Membership invites:** Add by email only, or shareable invite links in v1?
5. **Balance display:** Show net balances only, or full expense ledger + running total?

---

## 16. Success Criteria

You'll know the project succeeded as a learning exercise when you can:

- Explain why each service owns its data and what breaks if you merge two services
- Trace a create-expense request through Gateway → Expenses → event → Balances
- Run the full stack with one command and demo it to someone else
- Add a new event subscriber (e.g. Notifications) without changing Expenses internals

---

## Appendix A — Message Patterns (draft)

```typescript
// Users
'users.register' | 'users.login' | 'users.findById' | 'users.findByEmail'

// Groups
'groups.create' | 'groups.findById' | 'groups.listForUser'
'groups.addMember' | 'groups.removeMember' | 'groups.verifyMember'

// Expenses
'expenses.create' | 'expenses.findById' | 'expenses.listByGroup'
'expenses.update' | 'expenses.delete'

// Balances
'balances.getGroup' | 'settlements.create' | 'settlements.listByGroup'
```

## Appendix B — Domain Events (draft)

```typescript
interface ExpenseCreatedEvent {
  eventId: string;
  expenseId: string;
  groupId: string;
  paidByUserId: string;
  amount: number;
  splits: { userId: string; amount: number }[];
  occurredAt: string;
}
```

---

*Document version: 0.1 — review and adjust service boundaries or stack choices before scaffolding.*
