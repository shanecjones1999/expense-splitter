# Request flow through the NestJS backend

How an HTTP request travels from the web client through the API gateway into the microservices, and how writes fan out as domain events.

The gateway is the only **public** HTTP API clients talk to (`:3000`, prefix `/api/v1`). Downstream services expose internal HTTP endpoints on `:3001`–`:3004` (protected by `X-Internal-Token`) and keep their own PostgreSQL databases. Expenses also publishes fire-and-forget events over Redis that Balances consumes to update its read model.

---

## 1. Services and transports

```mermaid
flowchart LR
  Client["Web client<br/>:5173"] -->|"HTTP /api/v1<br/>Bearer JWT"| Gateway["API Gateway<br/>:3000"]

  Gateway -->|"HTTP /internal/*"| Users["Users<br/>:3001"]
  Gateway -->|"HTTP /internal/*"| Groups["Groups<br/>:3002"]
  Gateway -->|"HTTP /internal/*"| Expenses["Expenses<br/>:3003"]
  Gateway -->|"HTTP /internal/*"| Balances["Balances<br/>:3004"]

  Users --> UsersDB[(users_db)]
  Groups --> GroupsDB[(groups_db)]
  Expenses --> ExpensesDB[(expenses_db)]
  Balances --> BalancesDB[(balances_db)]

  Expenses -.->|"Redis emit<br/>expense.*"| Balances
```

**Sync path:** Gateway typed HTTP clients (`UsersClient`, `GroupsClient`, …) call `/internal/*` routes on each service. Errors propagate as normal HTTP status codes.

**Async path:** `eventBus.emit('expense.created' | 'expense.updated' | 'expense.deleted')` — fire-and-forget over Redis. Balances handlers are idempotent via a `processed_event` table.

Health checks (`GET /health`) are public on each service's HTTP port.

---

## 2. Gateway pipeline (every HTTP request)

```mermaid
flowchart TD
  A[HTTP request] --> B[CORS]
  B --> C["Global prefix /api/v1"]
  C --> D["ValidationPipe<br/>whitelist, transform, forbid extra fields"]
  D --> E{Route has JwtAuthGuard?}

  E -->|No — register, login, health| G[Controller]
  E -->|Yes| F["JwtAuthGuard / Passport JWT<br/>Authorization: Bearer"]
  F -->|Invalid or missing token| F401[401 Unauthorized]
  F -->|Valid — req.user = userId, email| G

  G --> H{Need membership check?}
  H -->|Yes — expenses, balances| I["HTTP GET groups/.../verify"]
  I -->|Not a member| F403[403 Forbidden]
  I -->|Member| J["HTTP client to downstream /internal/*"]
  H -->|No| J

  J --> K[Downstream HTTP controller]
  K --> L[Service + TypeORM]
  L --> M[JSON response]
```

Public routes: `POST /auth/register`, `POST /auth/login`, `GET /health`. Everything else under `/api/v1` requires a JWT.

---

## 3. Example: create an expense

This is the richest path: auth, a membership check, an internal HTTP call, a database write, then an async event that updates balances **after** the HTTP response.

```mermaid
sequenceDiagram
  autonumber
  actor Client
  participant GW as Gateway
  participant Groups as Groups service
  participant Expenses as Expenses service
  participant ExpDB as expenses_db
  participant Redis
  participant Balances as Balances service
  participant BalDB as balances_db

  Client->>GW: POST /api/v1/groups/{groupId}/expenses<br/>Authorization: Bearer JWT
  Note over GW: ValidationPipe checks CreateExpenseBodyDto
  Note over GW: JwtAuthGuard validates JWT, sets user

  GW->>Groups: GET /internal/groups/{groupId}/members/{userId}/verify
  Groups-->>GW: { isMember: true }

  GW->>Expenses: POST /internal/expenses {groupId, amount, splits, ...}
  Expenses->>ExpDB: INSERT expense + splits
  Expenses->>Redis: emit expense.created {eventId, splits, ...}
  Expenses-->>GW: ExpenseResponseDto
  GW-->>Client: 201/200 JSON expense

  Note over Redis,Balances: HTTP response already returned
  Redis->>Balances: @EventPattern expense.created
  Balances->>BalDB: skip if eventId already processed
  Balances->>BalDB: credit payer, debit split members
  Balances->>BalDB: mark eventId processed
```

The client may see stale balances for a short window. A later `GET /api/v1/groups/{groupId}/balances` reads the updated snapshot from Balances.

---

## 4. Example: register (no JWT)

```mermaid
sequenceDiagram
  autonumber
  actor Client
  participant GW as Gateway
  participant Users as Users service
  participant UsersDB as users_db

  Client->>GW: POST /api/v1/auth/register {email, displayName, password}
  Note over GW: No JwtAuthGuard on this route
  GW->>Users: POST /internal/users/register
  Users->>UsersDB: hash password, INSERT user
  Users->>Users: JwtService.sign {sub, email}
  Users-->>GW: { accessToken, user }
  GW-->>Client: AuthResponseDto
```

Login is the same shape (`POST /internal/users/login`). The Users service issues the JWT; the gateway only verifies it on later requests via Passport (`JwtStrategy`).

---

## 5. Example: read balances (query, no event)

```mermaid
sequenceDiagram
  autonumber
  actor Client
  participant GW as Gateway
  participant Groups as Groups service
  participant Balances as Balances service
  participant BalDB as balances_db

  Client->>GW: GET /api/v1/groups/{groupId}/balances<br/>Authorization: Bearer JWT
  GW->>Groups: GET /internal/groups/{groupId}/members/{userId}/verify
  Groups-->>GW: { isMember: true }
  GW->>Balances: GET /internal/groups/{groupId}/balances
  Balances->>BalDB: SELECT group_balance
  Balances-->>GW: GroupBalanceResponseDto[]
  GW-->>Client: JSON balances
```

Settlements are a **command** on Balances (`POST /internal/groups/{groupId}/settlements`) that writes `settlements` and adjusts `group_balance` in the same request — they do not go through Expenses or domain events.

---

## 6. Errors

Downstream services throw Nest HTTP exceptions (`NotFoundException`, `ConflictException`, …). The gateway HTTP clients surface these as `HttpException` with the same status code and message, so the client still sees a normal REST error.

---

## Internal routes (quick reference)

| Direction | Route | Used by |
|-----------|-------|---------|
| Gateway → Users | `POST /internal/users/register`, `login`; `GET /internal/users/:id`, `by-email` | Auth, add-member-by-email |
| Gateway → Groups | `POST/GET /internal/groups`, `GET .../verify`, members CRUD | Groups CRUD + membership gates |
| Gateway → Expenses | `POST/PATCH/DELETE /internal/expenses`, `GET .../groups/:id/expenses` | Expense CRUD |
| Gateway → Balances | `GET/POST /internal/groups/:id/balances`, `.../settlements` | Reads and settlements |
| Expenses → Balances (event) | `expense.created`, `expense.updated`, `expense.deleted` | Balance read model |

All internal routes require `X-Internal-Token` (see `INTERNAL_SERVICE_TOKEN` in `.env`).
