import { config } from './config.js';

export type ExpertCompany = {
  id: string;
  name: string | null;
  tradeName: string | null;
  taxId: string | null;
  status: string | null;
  preferredLanguage: string | null;
  role: string;
  active: boolean;
};

export class ExpertBackendError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ExpertBackendError';
  }
}

export class ExpertBackendClient {
  constructor(private readonly userId: string) {}

  private async request<T>(path: string): Promise<T> {
    if (!config.EXPERT_APP_SHARED_SECRET) {
      throw new ExpertBackendError('EXPERT backend shared secret is not configured', 503);
    }

    const url = new URL(path, config.EXPERT_APP_URL);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'x-expert-shared-secret': config.EXPERT_APP_SHARED_SECRET,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ExpertBackendError(
          `EXPERT backend returned ${response.status}`,
          response.status,
        );
      }

      return await response.json() as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  async listCompanies(): Promise<ExpertCompany[]> {
    const params = new URLSearchParams({ userId: this.userId });
    const payload = await this.request<{ ok: boolean; companies?: ExpertCompany[] }>(
      `/api/integrations/mcp/companies?${params.toString()}`,
    );
    return Array.isArray(payload.companies) ? payload.companies : [];
  }
}
