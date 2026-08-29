import type {
  AuthResponse,
  CreateExpenseBody,
  Expense,
  Group,
  GroupBalance,
  Settlement,
  User,
} from './types';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const TOKEN_KEY = 'expense-splitter.token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`/api/v1${path}`, { ...init, headers });

  if (response.status === 401) {
    setToken(null);
    window.dispatchEvent(new Event('auth:logout'));
  }

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) {
        message = body.message.join(', ');
      } else if (body.message) {
        message = body.message;
      }
    } catch {
      // keep statusText
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  register(body: {
    email: string;
    displayName: string;
    password: string;
  }): Promise<AuthResponse> {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  login(body: { email: string; password: string }): Promise<AuthResponse> {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  me(): Promise<User> {
    return request('/auth/me');
  },

  getUser(id: string): Promise<User> {
    return request(`/users/${id}`);
  },

  listGroups(): Promise<Group[]> {
    return request('/groups');
  },

  createGroup(name: string): Promise<Group> {
    return request('/groups', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  getGroup(id: string): Promise<Group> {
    return request(`/groups/${id}`);
  },

  addMember(groupId: string, email: string): Promise<Group> {
    return request(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  removeMember(groupId: string, userId: string): Promise<Group> {
    return request(`/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    });
  },

  listExpenses(groupId: string): Promise<Expense[]> {
    return request(`/groups/${groupId}/expenses`);
  },

  createExpense(groupId: string, body: CreateExpenseBody): Promise<Expense> {
    return request(`/groups/${groupId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  deleteExpense(expenseId: string): Promise<{ deleted: true }> {
    return request(`/expenses/${expenseId}`, { method: 'DELETE' });
  },

  getBalances(groupId: string): Promise<GroupBalance[]> {
    return request(`/groups/${groupId}/balances`);
  },

  listSettlements(groupId: string): Promise<Settlement[]> {
    return request(`/groups/${groupId}/settlements`);
  },

  createSettlement(
    groupId: string,
    body: { toUserId: string; amount: number; note?: string },
  ): Promise<Settlement> {
    return request(`/groups/${groupId}/settlements`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};
