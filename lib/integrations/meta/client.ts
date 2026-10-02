import { requireMetaMarketingConfig } from './config';
import type { MetaGraphErrorBody } from './types';

type MetaGraphRequest = {
  path: string;
  method?: 'GET' | 'POST' | 'DELETE';
  searchParams?: Record<string, string | number | boolean | undefined>;
  body?: Record<string, unknown>;
  formBody?: Record<string, string | number | boolean | undefined>;
};

export class MetaGraphError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: number,
    readonly subcode?: number,
    readonly traceId?: string,
  ) {
    super(message);
    this.name = 'MetaGraphError';
  }
}

export async function metaGraphRequest<T>({ path, method = 'GET', searchParams, body, formBody }: MetaGraphRequest): Promise<T> {
  const config = requireMetaMarketingConfig();
  const baseUrl = `https://graph.facebook.com/${config.graphApiVersion}`;
  const url = new URL(`${baseUrl}/${path.replace(/^\//, '')}`);

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  if (body && formBody) {
    throw new Error('Meta Graph request cannot use body and formBody together');
  }

  const encodedFormBody = formBody
    ? new URLSearchParams(
        Object.entries(formBody)
          .filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined)
          .map(([key, value]) => [key, String(value)]),
      )
    : null;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${config.systemUserAccessToken}`,
      'Content-Type': encodedFormBody ? 'application/x-www-form-urlencoded' : 'application/json',
    },
    body: encodedFormBody?.toString() ?? (body ? JSON.stringify(body) : undefined),
    cache: 'no-store',
  });

  const payload = (await response.json().catch(() => ({}))) as T & MetaGraphErrorBody;
  if (!response.ok) {
    const metaError = payload.error;
    throw new MetaGraphError(
      metaError?.message || `Meta Graph API request failed (${response.status})`,
      response.status,
      metaError?.code,
      metaError?.error_subcode,
      metaError?.fbtrace_id,
    );
  }

  return payload;
}

export async function testMetaMarketingConnection() {
  const config = requireMetaMarketingConfig();
  if (!config.catalogId) throw new Error('Meta catalog ID is not configured');

  return metaGraphRequest<{ id: string; name?: string }>({
    path: config.catalogId,
    searchParams: { fields: 'id,name' },
  });
}
