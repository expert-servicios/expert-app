import { describe, expect, it } from 'vitest';
import {
  resolveKiaContactGroup,
  mayUsePrivateKiaEmailTools,
  canAutoReplyToKiaContact,
} from '@/lib/ai/kia/kia-contact-groups';

describe('KIA contact groups and least-privilege permissions', () => {
  it('distinguishes visitors, known leads and verified clients without creating auth users', () => {
    expect(resolveKiaContactGroup({})).toBe('visitor');
    expect(resolveKiaContactGroup({ leadId: 'lead-id' })).toBe('lead');
    expect(resolveKiaContactGroup({ clientId: 'client-id', leadId: 'lead-id' })).toBe('verified_client');
  });

  it('never grants private tools to visitors or known leads', () => {
    expect(mayUsePrivateKiaEmailTools('visitor')).toBe(false);
    expect(mayUsePrivateKiaEmailTools('lead')).toBe(false);
    expect(mayUsePrivateKiaEmailTools('verified_client')).toBe(true);
  });

  it('requires separate opt-in for lead and visitor auto-replies', () => {
    expect(canAutoReplyToKiaContact({ group: 'lead', safeUnknownProspect: true, newLeadAutoSend: false })).toBe(false);
    expect(canAutoReplyToKiaContact({ group: 'lead', safeUnknownProspect: false, newLeadAutoSend: true })).toBe(true);
    expect(canAutoReplyToKiaContact({ group: 'visitor', safeUnknownProspect: false, newLeadAutoSend: true })).toBe(false);
    expect(canAutoReplyToKiaContact({ group: 'visitor', safeUnknownProspect: true, newLeadAutoSend: true })).toBe(true);
    expect(canAutoReplyToKiaContact({ group: 'verified_client', safeUnknownProspect: false, newLeadAutoSend: false })).toBe(true);
  });
});
