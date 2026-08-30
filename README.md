# Expense Splitter

NestJS microservices learning project — split expenses among group members and track balances.

## Architecture

- **Gateway** (HTTP `:3000`) — REST API, JWT auth, Swagger at `/docs`
- **Users** — accounts and login (`:3001`)
- **Groups** — groups and membership (`:3002`)
- **Expenses** — expenses and splits; publishes domain events (`:3003`)
- **Balances** — balance read model and settlements; consumes events (`:3004`)
- **Web** — React UI (`:5173`), proxies `/api` to the gateway

Services communicate over **internal HTTP** (`/internal/*` routes, `X-Internal-Token` header). **Redis** is used only for async domain events (Expenses → Balances). Each service has its own **PostgreSQL** database.

## Prerequisites

- Node.js 20+
- Docker and Docker Compose

## Quick start

```bash
# 1. Install dependencies
npm install
npm --prefix apps/web install

# 2. Copy environment file
cp .env.example .env

# 3. Start Postgres (x4) and Redis
npm run docker:up

# 4. Run all services + the React UI (single terminal)
npm run start:dev

# 5. Open the app
open http://localhost:5173
```

API docs stay at [http://localhost:3000/docs](http://localhost:3000/docs). The Vite dev server proxies `/api` to the gateway, so you do not need CORS for local development.

Or run services individually:

```bash
npm run start:dev:gateway
npm run start:dev:users
# ...
```

## Example flow

```bash
# Register
curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","displayName":"Alice","password":"password123"}'

# Create group (use token from register response)
curl -s -X POST http://localhost:3000/api/v1/groups \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Weekend Trip"}'

# Add expense, check balances — see Swagger at /docs
```

## Frontend

React + Vite app in `apps/web`. Happy path:

1. Register two accounts (two browsers, or log out and back in)
2. Create a group
3. Add the second person by email
4. Add an expense and watch balances update
5. Record a settlement when someone pays back

## Project layout

```
apps/
  gateway/    REST API
  users/      Auth + user profiles
  groups/     Groups + membership
  expenses/   Expenses + split logic
  balances/   Balances + settlements
  web/        React UI (Vite, :5173)
libs/
  shared/     DTOs, message patterns, events
docs/
  SOFTWARE_DESIGN.md
```

See [docs/SOFTWARE_DESIGN.md](docs/SOFTWARE_DESIGN.md) for the full design.
