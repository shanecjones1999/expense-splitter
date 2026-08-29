export interface ExpenseSplitPayload {
  userId: string;
  amount: number;
}

export interface ExpenseCreatedEvent {
  eventId: string;
  expenseId: string;
  groupId: string;
  paidByUserId: string;
  amount: number;
  splits: ExpenseSplitPayload[];
  occurredAt: string;
}

export interface ExpenseUpdatedEvent {
  eventId: string;
  expenseId: string;
  groupId: string;
  // The following type means "all fields from ExpenseCreatedEvent except 'eventId' and 'occurredAt'"
  previous: Omit<ExpenseCreatedEvent, 'eventId' | 'occurredAt'>;
  current: Omit<ExpenseCreatedEvent, 'eventId' | 'occurredAt'>;
  occurredAt: string;
}

export interface ExpenseDeletedEvent {
  eventId: string;
  expenseId: string;
  groupId: string;
  paidByUserId: string;
  amount: number;
  splits: ExpenseSplitPayload[];
  occurredAt: string;
}
