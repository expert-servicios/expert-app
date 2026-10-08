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


export type MetaLeadData = {
  id: string;
  created_time?: string;
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  form_id?: string;
  is_organic?: boolean;
  platform?: string;
  field_data?: Array<{ name?: string; values?: string[] }>;
};

export async function retrieveMetaLead(leadgenId: string): Promise<MetaLeadData> {
  const id = leadgenId.trim();
  if (!id) throw new Error('Meta lead id is required');

  return metaGraphRequest<MetaLeadData>({
    path: id,
    searchParams: {
      fields: [
        'id',
        'created_time',
        'ad_id',
        'ad_name',
        'adset_id',
        'adset_name',
        'campaign_id',
        'campaign_name',
        'form_id',
        'is_organic',
        'platform',
        'field_data',
      ].join(','),
    },
  });
}

export function normalizeMetaLeadFields(fieldData: MetaLeadData['field_data']) {
  const values = new Map<string, string>();
  for (const field of fieldData ?? []) {
    const key = field.name?.trim().toLowerCase();
    const value = field.values?.map(String).map((item) => item.trim()).filter(Boolean).join(', ');
    if (key && value) values.set(key, value);
  }

  const first = (...keys: string[]) => {
    for (const key of keys) {
      const value = values.get(key);
      if (value) return value;
    }
    return null;
  };

  const firstName = first('first_name', 'firstname', 'nombre');
  const lastName = first('last_name', 'lastname', 'apellidos', 'surname');
  const derivedName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const fullName = first('full_name', 'fullname', 'name', 'nombre_completo')
    ?? (derivedName || null);

  return {
    fullName,
    email: first('email', 'correo', 'correo_electronico'),
    phone: first('phone_number', 'phone', 'telefono', 'teléfono'),
    city: first('city', 'ciudad', 'localidad'),
    companyName: first('company_name', 'company', 'empresa'),
    fieldNames: [...values.keys()],
  };
}
