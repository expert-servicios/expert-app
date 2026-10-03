import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROLES } from '@/lib/auth/roles';
import { resolveKiaPolicyProfile } from '@/lib/ai/kia/kia-policy-profiles';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA Admin Copilot mode', () => {
  it('uses a dedicated read-only admin policy without feature flags', () => {
    const resolved = resolveKiaPolicyProfile('admin_copilot', {
      role: ROLES.ADMIN,
      planCapabilities: [],
      scopes: ['kia:staff:read'],
      featureFlags: [],
    });

    expect(resolved.ok).toBe(true);
    expect(resolved.profile.channel).toBe('admin');
    expect(resolved.profile.maxRiskTier).toBe('R1');
    expect(resolved.profile.allowedEffects).toEqual(['read']);
    expect(resolved.profile.autonomousOnly).toBe(true);
  });

  it('does not expose the admin policy to client roles', () => {
    const resolved = resolveKiaPolicyProfile('admin_copilot', {
      role: ROLES.CLIENT,
      planCapabilities: [],
      scopes: [],
      featureFlags: [],
    });

    expect(resolved.ok).toBe(false);
    expect(resolved.reason).toBe('role_not_allowed');
  });

  it('routes authenticated Admin pages through the admin policy and suppresses client-style chips', () => {
    const route = source('app/api/ai/kia/route.ts');
    expect(route).toContain("currentPage?.startsWith('/admin')");
    expect(route).toContain("adminCopilotMode ? 'admin_copilot' as const : 'client_dashboard' as const");
    expect(route).toContain("adminCopilotMode ? 'admin' : 'dashboard'");
    expect(route).toContain('const quickReplies = adminCopilotMode');
    expect(route).toContain('const proactiveSuggestions = adminCopilotMode');
  });

  it('passes live Admin page context and performs a silent proactive review', () => {
    const widget = source('components/KiaCopilotWidget.tsx');
    expect(widget).toContain("surface: 'admin'");
    expect(widget).toContain("currentTask: options.currentTask ?? (adminMode ? 'admin_operator' : undefined)");
    expect(widget).toContain("currentTask: 'admin_page_review'");
    expect(widget).toContain('silentUser: true');
    expect(widget).toContain("!adminMode && msg.role === 'assistant' && msg.quickReplies?.length");
    expect(widget).toContain("!adminMode && msg.role === 'assistant' && msg.proactiveSuggestions?.length");
  });

  it('preserves page context when routing into a specialized sub-agent', () => {
    const decision = source('lib/ai/kia/kia-decision-engine.ts');
    const subAgentBlock = decision.slice(
      decision.indexOf('const finalSystemPrompt = subAgentProfile'),
      decision.indexOf('const finalMaxTokens'),
    );
    expect(subAgentBlock).toContain('currentPage: input.contextInput.currentPage');
    expect(subAgentBlock).toContain('currentTask: input.contextInput.currentTask');
    expect(subAgentBlock).toContain('pageData: input.contextInput.pageData');
  });
});
