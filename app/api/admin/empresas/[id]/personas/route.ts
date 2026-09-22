import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin, listAllAuthUsers } from '@/lib/integrations/supabase';

const mutationSchema = z.object({
  profileId: z.string().uuid(),
  role: z.enum(['owner', 'admin', 'member']).default('owner'),
}).strict();

async function requireStaff(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status === 'inactive' || !['admin', 'owner'].includes(profile.role)) return null;
  return { admin, actorId: user.id };
}

async function assertCompany(admin: ReturnType<typeof getSupabaseAdmin>, companyId: string) {
  const { data, error } = await admin.from('companies').select('id').eq('id', companyId).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireStaff(request);
    if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id: companyId } = await params;
    if (!(await assertCompany(ctx.admin, companyId))) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';

    const [{ data: memberships, error: membershipError }, authUsers] = await Promise.all([
      ctx.admin.from('profile_companies').select('profile_id,role,created_at').eq('company_id', companyId),
      listAllAuthUsers(),
    ]);
    if (membershipError) return NextResponse.json({ error: membershipError.message }, { status: 500 });

    let profileQuery = ctx.admin
      .from('profiles')
      .select('id,full_name,email,phone,role,status,tax_id,active_company_id')
      .eq('role', 'client')
      .order('full_name')
      .limit(100);

    if (q) {
      profileQuery = profileQuery.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,tax_id.ilike.%${q}%`);
    }

    const { data: profiles, error: profileError } = await profileQuery;
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

    const authEmail = new Map(authUsers.map((user) => [user.id, user.email ?? null]));
    const linkedMap = new Map((memberships ?? []).map((row) => [row.profile_id, row]));

    const candidates = (profiles ?? []).map((profile) => {
      const membership = linkedMap.get(profile.id);
      return {
        id: profile.id,
        name: profile.full_name ?? authEmail.get(profile.id) ?? profile.email ?? profile.id,
        email: authEmail.get(profile.id) ?? profile.email ?? null,
        phone: profile.phone ?? null,
        taxId: profile.tax_id ?? null,
        status: profile.status,
        linked: Boolean(membership),
        membershipRole: membership?.role ?? null,
        isActiveCompany: profile.active_company_id === companyId,
      };
    });

    return NextResponse.json({ candidates });
  } catch (error) {
    console.error('[admin/empresas/[id]/personas GET]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireStaff(request);
    if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id: companyId } = await params;
    if (!(await assertCompany(ctx.admin, companyId))) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    const parsed = mutationSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

    const { data: profile, error: profileError } = await ctx.admin
      .from('profiles')
      .select('id,role,status,active_company_id')
      .eq('id', parsed.data.profileId)
      .maybeSingle();

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
    if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
    if (profile.role !== 'client') {
      return NextResponse.json({ error: 'Solo se pueden vincular perfiles de cliente desde Company 360' }, { status: 409 });
    }

    const { error } = await ctx.admin
      .from('profile_companies')
      .upsert({
        profile_id: parsed.data.profileId,
        company_id: companyId,
        role: parsed.data.role,
      }, { onConflict: 'profile_id,company_id' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (!profile.active_company_id) {
      await ctx.admin
        .from('profiles')
        .update({ active_company_id: companyId, updated_at: new Date().toISOString() })
        .eq('id', parsed.data.profileId);
    }

    await ctx.admin.from('audit_logs').insert({
      actor_id: ctx.actorId,
      action: 'company.admin_person_linked',
      entity: 'companies',
      entity_id: companyId,
      metadata: {
        profile_id: parsed.data.profileId,
        membership_role: parsed.data.role,
        set_active_if_empty: !profile.active_company_id,
      },
    }).then(() => {});

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[admin/empresas/[id]/personas POST]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireStaff(request);
    if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id: companyId } = await params;
    if (!(await assertCompany(ctx.admin, companyId))) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    const parsed = z.object({ profileId: z.string().uuid() }).strict().safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

    const { data: membership, error: membershipError } = await ctx.admin
      .from('profile_companies')
      .select('profile_id,company_id,role')
      .eq('profile_id', parsed.data.profileId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (membershipError) return NextResponse.json({ error: membershipError.message }, { status: 500 });
    if (!membership) return NextResponse.json({ error: 'El vínculo ya no existe' }, { status: 404 });

    const { data: profile } = await ctx.admin
      .from('profiles')
      .select('active_company_id')
      .eq('id', parsed.data.profileId)
      .maybeSingle();

    const { error: deleteError } = await ctx.admin
      .from('profile_companies')
      .delete()
      .eq('profile_id', parsed.data.profileId)
      .eq('company_id', companyId);

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    let replacementCompanyId: string | null = null;
    if (profile?.active_company_id === companyId) {
      const { data: remaining } = await ctx.admin
        .from('profile_companies')
        .select('company_id')
        .eq('profile_id', parsed.data.profileId)
        .order('created_at')
        .limit(1);

      replacementCompanyId = remaining?.[0]?.company_id ?? null;
      await ctx.admin
        .from('profiles')
        .update({ active_company_id: replacementCompanyId, updated_at: new Date().toISOString() })
        .eq('id', parsed.data.profileId);
    }

    await ctx.admin.from('audit_logs').insert({
      actor_id: ctx.actorId,
      action: 'company.admin_person_unlinked',
      entity: 'companies',
      entity_id: companyId,
      metadata: {
        profile_id: parsed.data.profileId,
        previous_membership_role: membership.role,
        active_company_replaced_with: replacementCompanyId,
      },
    }).then(() => {});

    return NextResponse.json({ ok: true, replacementCompanyId });
  } catch (error) {
    console.error('[admin/empresas/[id]/personas DELETE]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
