export const BalancesPatterns = {
  GET_GROUP: { cmd: 'balances.getGroup' },
  CREATE_SETTLEMENT: { cmd: 'settlements.create' },
  LIST_SETTLEMENTS: { cmd: 'settlements.listByGroup' },
} as const;
