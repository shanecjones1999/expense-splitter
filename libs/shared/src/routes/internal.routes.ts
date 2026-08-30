export const InternalRoutes = {
  users: {
    register: '/internal/users/register',
    login: '/internal/users/login',
    byEmail: '/internal/users/by-email',
    byId: (id: string) => `/internal/users/${id}`,
  },
  groups: {
    list: '/internal/groups',
    create: '/internal/groups',
    byId: (groupId: string) => `/internal/groups/${groupId}`,
    addMember: (groupId: string) => `/internal/groups/${groupId}/members`,
    removeMember: (groupId: string, userId: string) =>
      `/internal/groups/${groupId}/members/${userId}`,
    verifyMember: (groupId: string, userId: string) =>
      `/internal/groups/${groupId}/members/${userId}/verify`,
  },
  expenses: {
    create: '/internal/expenses',
    byId: (expenseId: string) => `/internal/expenses/${expenseId}`,
    listByGroup: (groupId: string) => `/internal/groups/${groupId}/expenses`,
  },
  balances: {
    groupBalances: (groupId: string) => `/internal/groups/${groupId}/balances`,
    settlements: (groupId: string) => `/internal/groups/${groupId}/settlements`,
  },
} as const;
