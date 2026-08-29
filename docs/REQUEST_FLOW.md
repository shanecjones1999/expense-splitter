# Request flow through the NestJS backend

How an HTTP request travels from the web client through the API gateway into the microservices, and how writes fan out as domain events.

The gateway is the only HTTP API clients talk to (`:3000`, prefix `/api/v1`). Downstream services (Users, Groups, Expenses, Balances) listen on Redis for request/response messages and keep their own PostgreSQL databases. Expenses also publishes fire-and-forget events that Balances consumes to update its read model.

---

## 1. Services and transports

```mermaid
flowchart LR
  Client["Web client<br/>:5173"] -->|"HTTP /api/v1<br/>Bearer JWT"| Gateway["API Gateway<br/>:3000"]

  Gateway -->|"Redis send(cmd)"| Users["Users<br/>:3001 health"]
  Gateway -->|"Redis send(cmd)"| Groups["Groups<br/>:3002 health"]
  Gateway -->|"Redis send(cmd)"| Expenses["Expenses<br/>:3003 health"]
  Gateway -->|"Redis send(cmd)"| Balances["Balances<br/>:3004 health"]

  Users --> UsersDB[(users_db)]
  Groups --> GroupsDB[(groups_db)]
  Expenses --> ExpensesDB[(expenses_db)]
  Balances --> BalancesDB[(balances_db)]

  Expenses -.->|"Redis emit<br/>expense.*"| Balances
```

**Sync path:** `ClientProxy.send({ cmd })` — request/response over Redis. The gateway waits with `firstValueFrom(...)`.

**Async path:** `eventBus.emit('expense.created' | 'expense.updated' | 'expense.deleted')` — fire-and-forget. Balances handlers are idempotent via a `processed_event` table.

Health checks (`GET /health`) hit each service's HTTP port directly and do not go through Redis.

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
  H -->|Yes — expenses, balances| I["RPC groups.verifyMember"]
  I -->|Not a member| F403[403 Forbidden]
  I -->|Member| J["RPC ClientProxy.send pattern"]
  H -->|No| J

  J --> K[Redis transport]
  K --> L["Downstream @MessagePattern"]
  L --> M[Service + TypeORM]
  M --> N[JSON response]

  L -.->|RpcException| O[RpcExceptionFilter]
  O --> P["HTTP status from error.statusCode"]
```

Public routes: `POST /auth/register`, `POST /auth/login`, `GET /health`. Everything else under `/api/v1` requires a JWT.

---

## 3. Example: create an expense

This is the richest path: auth, a membership RPC, a command RPC, a database write, then an async event that updates balances **after** the HTTP response.

```mermaid
sequenceDiagram
  autonumber
  actor Client
  participant GW as Gateway
  participant Redis
  participant Groups as Groups service
  participant Expenses as Expenses service
  participant ExpDB as expenses_db
  participant Balances as Balances service
  participant BalDB as balances_db

  Client->>GW: POST /api/v1/groups/{groupId}/expenses<br/>Authorization: Bearer JWT
  Note over GW: ValidationPipe checks CreateExpenseBodyDto
  Note over GW: JwtAuthGuard validates JWT, sets user

  GW->>Redis: send groups.verifyMember {groupId, userId}
  Redis->>Groups: @MessagePattern groups.verifyMember
  Groups-->>GW: { isMember: true }

  GW->>Redis: send expenses.create {groupId, amount, splits, ...}
  Redis->>Expenses: @MessagePattern expenses.create
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
  participant Redis
  participant Users as Users service
  participant UsersDB as users_db

  Client->>GW: POST /api/v1/auth/register {email, displayName, password}
  Note over GW: No JwtAuthGuard on this route
  GW->>Redis: send users.register
  Redis->>Users: @MessagePattern users.register
  Users->>UsersDB: hash password, INSERT user
  Users->>Users: JwtService.sign {sub, email}
  Users-->>GW: { accessToken, user }
  GW-->>Client: AuthResponseDto
```

Login is the same shape (`users.login`). The Users service issues the JWT; the gateway only verifies it on later requests via Passport (`JwtStrategy`).

---

## 5. Example: read balances (query, no event)

```mermaid
sequenceDiagram
  autonumber
  actor Client
  participant GW as Gateway
  participant Redis
  participant Groups as Groups service
  participant Balances as Balances service
  participant BalDB as balances_db

  Client->>GW: GET /api/v1/groups/{groupId}/balances<br/>Authorization: Bearer JWT
  GW->>Redis: send groups.verifyMember
  Redis->>Groups: @MessagePattern groups.verifyMember
  Groups-->>GW: { isMember: true }
  GW->>Redis: send balances.getGroup {groupId}
  Redis->>Balances: @MessagePattern balances.getGroup
  Balances->>BalDB: SELECT group_balance
  Balances-->>GW: GroupBalanceResponseDto[]
  GW-->>Client: JSON balances
```

Settlements are a **command** on Balances (`settlements.create`) that writes `settlements` and adjusts `group_balance` in the same request — they do not go through Expenses or domain events.

---

## 6. Errors

Downstream services throw Nest HTTP exceptions (`NotFoundException`, `ConflictException`, …). Over Redis those surface as `RpcException`. The gateway's global `RpcExceptionFilter` maps `{ statusCode, message }` back to an HTTP response so the client still sees a normal REST error.

```mermaid
flowchart LR
  S[Microservice throws] --> R[RpcException over Redis]
  R --> F[RpcExceptionFilter on Gateway]
  F --> H["HTTP JSON { statusCode, message }"]
```

---

## Message patterns (quick reference)

| Direction | Pattern | Used by |
|-----------|---------|---------|
| Gateway → Users | `users.register`, `users.login`, `users.findById`, `users.findByEmail` | Auth, add-member-by-email |
| Gateway → Groups | `groups.create`, `groups.findById`, `groups.listForUser`, `groups.addMember`, `groups.removeMember`, `groups.verifyMember` | Groups CRUD + membership gates |
| Gateway → Expenses | `expenses.create`, `expenses.findById`, `expenses.listByGroup`, `expenses.update`, `expenses.delete` | Expense CRUD |
| Gateway → Balances | `balances.getGroup`, `settlements.create`, `settlements.listByGroup` | Reads and settlements |
| Expenses → Balances (event) | `expense.created`, `expense.updated`, `expense.deleted` | Balance read model |
