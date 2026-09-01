export interface McpServerConfig {
  gatewayUrl: string;
  email: string;
  password: string;
}

export function loadConfig(): McpServerConfig {
  const gatewayUrl =
    process.env.EXPENSE_SPLITTER_URL ?? 'http://localhost:3000/api/v1';
  const email = process.env.EXPENSE_SPLITTER_EMAIL;
  const password = process.env.EXPENSE_SPLITTER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'EXPENSE_SPLITTER_EMAIL and EXPENSE_SPLITTER_PASSWORD are required',
    );
  }

  return { gatewayUrl, email, password };
}
