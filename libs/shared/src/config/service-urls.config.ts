export const ServiceUrls = {
  users: () => process.env.USERS_SERVICE_URL ?? 'http://localhost:3001',
  groups: () => process.env.GROUPS_SERVICE_URL ?? 'http://localhost:3002',
  expenses: () => process.env.EXPENSES_SERVICE_URL ?? 'http://localhost:3003',
  balances: () => process.env.BALANCES_SERVICE_URL ?? 'http://localhost:3004',
} as const;
