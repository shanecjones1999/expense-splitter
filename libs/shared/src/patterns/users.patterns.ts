export const UsersPatterns = {
  REGISTER: { cmd: 'users.register' },
  LOGIN: { cmd: 'users.login' },
  FIND_BY_ID: { cmd: 'users.findById' },
  FIND_BY_EMAIL: { cmd: 'users.findByEmail' },
} as const;
