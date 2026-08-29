export type SplitType = 'equal' | 'exact' | 'percentage';
export type MemberRole = 'owner' | 'member';

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface GroupMember {
  id: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  createdBy: string;
  currency: string;
  createdAt: string;
  members?: GroupMember[];
}

export interface ExpenseSplitInput {
  userId: string;
  amount?: number;
  percentage?: number;
}

export interface ExpenseSplit {
  id: string;
  userId: string;
  amount: number;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidByUserId: string;
  splitType: SplitType;
  expenseDate: string;
  createdAt: string;
  splits: ExpenseSplit[];
}

export interface CreateExpenseBody {
  description: string;
  amount: number;
  paidByUserId: string;
  splitType: SplitType;
  splits: ExpenseSplitInput[];
  expenseDate: string;
}

export interface GroupBalance {
  groupId: string;
  userId: string;
  netBalance: number;
  updatedAt: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  note: string | null;
  createdAt: string;
}
