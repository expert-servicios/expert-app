import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/integrations/supabase';
import { detectHoldedPermissions } from '@/lib/integrations/holded/holded-permission-probes';
import { holdedErrorMessage } from '@/lib/integrations/holded/holded-errors';

const bodySchema = z.object({
  apiKey: z.string().min(8).max(256).trim(),
  apiVersion: z.enum(['v1','v2']).default('v2'),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'API key inválida o demasiado corta' }, { status: 400 });
    }

    // Raw key used only for this test — never logged, never stored here.
    const result = await detectHoldedPermissions(parsed.data.apiKey, parsed.data.apiVersion);
    return NextResponse.json(result);
  } catch (err) {
    const msg = holdedErrorMessage(err);
    console.error('[holded/test] connection failed:', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
