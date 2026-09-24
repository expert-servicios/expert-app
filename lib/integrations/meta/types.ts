export type MetaMarketingConfig = {
  enabled: boolean;
  graphApiVersion: string | null;
  appId: string | null;
  appSecret: string | null;
  systemUserAccessToken: string | null;
  businessId: string | null;
  catalogId: string | null;
  adAccountId: string | null;
  pageId: string | null;
  instagramAccountId: string | null;
  datasetId: string | null;
};

export type MetaMarketingConfigStatus = {
  enabled: boolean;
  configured: boolean;
  missing: string[];
  graphApiVersion: string | null;
  assets: {
    appId: string | null;
    businessId: string | null;
    catalogId: string | null;
    adAccountId: string | null;
    pageId: string | null;
    instagramAccountId: string | null;
    datasetId: string | null;
  };
  secrets: {
    appSecretConfigured: boolean;
    systemUserAccessTokenConfigured: boolean;
  };
};

export type MetaCatalogPrice = {
  amount: number;
  currency: 'EUR';
  taxIncluded: false;
};

export type MetaServiceCatalogDraft = {
  retailerId: string;
  name: string;
  description: string;
  serviceCategory: string;
  sourceCategorySlug: string;
  landingUrl: string;
  imageUrl: string | null;
  price: MetaCatalogPrice | null;
  marketingReady: boolean;
  warnings: string[];
};

export type MetaGraphErrorBody = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};
