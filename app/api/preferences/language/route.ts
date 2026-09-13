import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { localeSchema } from '@/lib/i18n/config';

const bodySchema = z.object({ locale: localeSchema });
const COOKIE_NAME = 'expert_locale';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_locale' }, { status: 400 });
  }

  const locale = parsed.data.locale;
  const response = NextResponse.json({ ok: true, locale });
  response.cookies.set(COOKIE_NAME, locale, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return response;
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ preferred_language: locale })
    .eq('id', user.id);

  if (updateError) {
    console.error('[preferences/language] profile update failed:', updateError.message);
    return NextResponse.json({ error: 'profile_update_failed' }, { status: 500 });
  }

  return response;
}
