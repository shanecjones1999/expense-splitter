import type { McpServerConfig } from './config.js';

interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
}

export class GatewayClient {
  private token: string | null = null;
  private user: AuthResponse['user'] | null = null;
  private loginPromise: Promise<void> | null = null;

  constructor(private readonly config: McpServerConfig) {}

  get currentUser(): AuthResponse['user'] | null {
    return this.user;
  }

  async login(): Promise<void> {
    if (this.loginPromise) {
      await this.loginPromise;
      return;
    }

    this.loginPromise = this.performLogin();
    try {
      await this.loginPromise;
    } finally {
      this.loginPromise = null;
    }
  }

  private async performLogin(): Promise<void> {
    const response = await fetch(`${this.config.gatewayUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: this.config.email,
        password: this.config.password,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Login failed (${response.status}): ${body || response.statusText}`,
      );
    }

    const data = (await response.json()) as AuthResponse;
    this.token = data.accessToken;
    this.user = data.user;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1] ?? '', 'base64url').toString(),
      ) as { exp?: number };
      if (!payload.exp) {
        return true;
      }
      // Refresh one minute before expiry.
      return Date.now() >= payload.exp * 1000 - 60_000;
    } catch {
      return true;
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (this.token && !this.isTokenExpired(this.token)) {
      return;
    }
    await this.login();
  }

  async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    await this.ensureAuthenticated();

    let response = await this.sendRequest(method, path, body);
    if (response.status === 401) {
      this.token = null;
      await this.login();
      response = await this.sendRequest(method, path, body);
    }

    const text = await response.text();
    if (!response.ok) {
      throw new Error(
        `API ${method} ${path} failed (${response.status}): ${text || response.statusText}`,
      );
    }

    return text ? (JSON.parse(text) as T) : (undefined as T);
  }

  private sendRequest(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<Response> {
    const url = `${this.config.gatewayUrl}${path.startsWith('/') ? path : `/${path}`}`;
    return fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
}
