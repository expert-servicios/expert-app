import type { MetaMarketingConfig, MetaMarketingConfigStatus } from './types';

const REQUIRED_ENV = [
  'META_MARKETING_GRAPH_API_VERSION',
  'META_MARKETING_APP_ID',
  'META_MARKETING_APP_SECRET',
  'META_MARKETING_SYSTEM_USER_ACCESS_TOKEN',
  'META_MARKETING_BUSINESS_ID',
  'META_MARKETING_CATALOG_ID',
] as const;

function env(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function getMetaMarketingConfig(): MetaMarketingConfig {
  return {
    enabled: env('META_MARKETING_ENABLED') === 'true',
    graphApiVersion: env('META_MARKETING_GRAPH_API_VERSION'),
    appId: env('META_MARKETING_APP_ID'),
    appSecret: env('META_MARKETING_APP_SECRET'),
    systemUserAccessToken: env('META_MARKETING_SYSTEM_USER_ACCESS_TOKEN'),
    businessId: env('META_MARKETING_BUSINESS_ID'),
    catalogId: env('META_MARKETING_CATALOG_ID'),
    adAccountId: env('META_MARKETING_AD_ACCOUNT_ID'),
    pageId: env('META_MARKETING_PAGE_ID'),
    instagramAccountId: env('META_MARKETING_INSTAGRAM_ACCOUNT_ID'),
    datasetId: env('META_MARKETING_DATASET_ID'),
  };
}

export function getMetaMarketingConfigStatus(): MetaMarketingConfigStatus {
  const config = getMetaMarketingConfig();
  const missing = REQUIRED_ENV.filter((name) => !env(name));

  return {
    enabled: config.enabled,
    configured: missing.length === 0,
    missing: [...missing],
    graphApiVersion: config.graphApiVersion,
    assets: {
      appId: config.appId,
      businessId: config.businessId,
      catalogId: config.catalogId,
      adAccountId: config.adAccountId,
      pageId: config.pageId,
      instagramAccountId: config.instagramAccountId,
      datasetId: config.datasetId,
    },
    secrets: {
      appSecretConfigured: Boolean(config.appSecret),
      systemUserAccessTokenConfigured: Boolean(config.systemUserAccessToken),
    },
  };
}

export function requireMetaMarketingConfig(): MetaMarketingConfig {
  const status = getMetaMarketingConfigStatus();
  const config = getMetaMarketingConfig();

  if (!config.enabled) {
    throw new Error('Meta Marketing integration is disabled');
  }

  if (!status.configured) {
    throw new Error(`Meta Marketing configuration missing: ${status.missing.join(', ')}`);
  }

  return config;
}
