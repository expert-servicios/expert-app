import { z } from 'zod';
import { localeSchema } from '@/lib/i18n/config';

export const LEAD_SOURCE_VALUES = [
  'direct',
  'organic_search',
  'paid_search',
  'telegram',
  'whatsapp',
  'social',
  'webinar',
  'referral',
  'partner',
  'email',
  'other',
] as const;

export const LEAD_INTENT_VALUES = [
  'open_business_in_spain',
  'organize_existing_business',
  'change_advisor_or_system',
  'start_using_holded',
  'learn_self_management',
  'resolve_specific_issue',
] as const;

export const CUSTOMER_TYPE_VALUES = [
  'individual',
  'autonomo',
  'sl',
  'other_business',
  'advisory',
] as const;

export const HOLDED_USAGE_VALUES = ['yes', 'no', 'unknown'] as const;

export const leadSourceSchema = z.enum(LEAD_SOURCE_VALUES);
export const leadIntentSchema = z.enum(LEAD_INTENT_VALUES);
export const customerTypeSchema = z.enum(CUSTOMER_TYPE_VALUES);
export const holdedUsageSchema = z.enum(HOLDED_USAGE_VALUES);

export const leadAttributionSchema = z.object({
  locale: localeSchema,
  source: leadSourceSchema.default('direct'),
  campaign: z.string().trim().min(1).max(120).optional(),
  intent: leadIntentSchema.optional(),
  customerType: customerTypeSchema.optional(),
  usesHolded: holdedUsageSchema.default('unknown'),
  originPath: z.string().trim().max(500).optional(),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(160).optional(),
});

export type LeadSource = z.infer<typeof leadSourceSchema>;
export type LeadIntent = z.infer<typeof leadIntentSchema>;
export type CustomerType = z.infer<typeof customerTypeSchema>;
export type HoldedUsage = z.infer<typeof holdedUsageSchema>;
export type LeadAttribution = z.infer<typeof leadAttributionSchema>;
