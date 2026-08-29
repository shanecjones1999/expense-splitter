export const ExpensesPatterns = {
  CREATE: { cmd: 'expenses.create' },
  FIND_BY_ID: { cmd: 'expenses.findById' },
  LIST_BY_GROUP: { cmd: 'expenses.listByGroup' },
  UPDATE: { cmd: 'expenses.update' },
  DELETE: { cmd: 'expenses.delete' },
} as const;
