import { describe, expect, it } from 'vitest';
import { shouldTryGeminiFallbackModel } from '../../lib/ai/kia/kia-provider-router';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
describe('Gemini resilient provider routing',()=>{
 it('retries transient overload on an alternative model',()=>{
  expect(shouldTryGeminiFallbackModel('gemini-3.8-flash','HTTP 503')).toBe(true);
  expect(shouldTryGeminiFallbackModel('gemini-3.8-flash','HTTP 503: experiencing high demand')).toBe(true);
  expect(shouldTryGeminiFallbackModel('gemini-3.8-flash','HTTP 402: payment required')).toBe(true);
 });
 it('does not conceal auth, malformed request or repeats on alternative',()=>{
  expect(shouldTryGeminiFallbackModel('gemini-3.8-flash','HTTP 400')).toBe(false);
  expect(shouldTryGeminiFallbackModel('gemini-3.8-flash','HTTP 401 invalid API key')).toBe(false);
  expect(shouldTryGeminiFallbackModel('gemini-3.5-flash','HTTP 503')).toBe(false);
 });
 it('retries only clearly model-specific 400',()=>{
  expect(shouldTryGeminiFallbackModel('gemini-3.8-flash','HTTP 400: model not supported')).toBe(true);
  expect(shouldTryGeminiFallbackModel('gemini-3.8-flash','HTTP 400: invalid tool schema')).toBe(false);
 });
 it('cools down Anthropic missing workspace configuration',()=>{
  const router=readFileSync(resolve(process.cwd(),'lib/ai/kia/kia-provider-router.ts'),'utf8');
  expect(router).toContain('anthropic-workspace-id|not scoped to a workspace');
 });
});
