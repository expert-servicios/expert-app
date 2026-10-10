import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { lockedRegistryFields } from '@/lib/companies/registry-locks';

function normalizeTaxId(value: string | null | undefined): string | null {
  const normalized = String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return normalized || null;
}

const FORMA_JURIDICA = ['autonomo','sl','sa','slne','cb','cooperativa','fundacion','otra'] as const;

const companySchema = z.object({
  razon_social: z.string().min(2).max(200),
  nombre_comercial: z.string().max(200).optional().nullable(),
  cif_nif: z.string().max(20).optional().nullable(),
  forma_juridica: z.enum(FORMA_JURIDICA),
  direccion: z.string().max(300).optional().nullable(),
  ciudad: z.string().max(100).optional().nullable(),
  provincia: z.string().max(100).optional().nullable(),
  codigo_postal: z.string().max(10).optional().nullable(),
  pais: z.string().length(2).default('ES'),
  telefono: z.string().max(25).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')).transform(v => v || null),
  web: z.string().max(200).optional().nullable(),
  _appliedSuggestionId: z.string().uuid().optional(),
  _registrySource: z.string().max(80).optional(),
  _registrySourceUrl: z.string().url().optional(),
  _registryRetrievedAt: z.string().datetime().optional(),
  _registryOfficial: z.boolean().optional(),
  _registrySnapshot: z.record(z.string(), z.unknown()).optional()
});

type CompanyMembershipRow = {
  role: string;
  company: Record<string, unknown> | Record<string, unknown>[] | null;
};

async function getUser(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('profile_companies')
      .select('role, company:companies(*)')
      .eq('profile_id', user.id)
      .order('created_at', { referencedTable: 'companies', ascending: true });

    if (error) {
      console.error('[companies GET]', error);
      return NextResponse.json({ error: 'Error al obtener empresas' }, { status: 500 });
    }

    const companies = ((data ?? []) as unknown as CompanyMembershipRow[])
      .map((row) => {
        const company = Array.isArray(row.company) ? row.company[0] : row.company;
        return company ? { ...company, role: row.role } : null;
      })
      .filter((company): company is Record<string, unknown> & { role: string } => company !== null);

    return NextResponse.json({ companies });
  } catch (err) {
    console.error('[companies GET]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const parse = companySchema.safeParse(await request.json());
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const d = parse.data;
    // Provenance supplied by a browser is a suggestion, never a server attestation.
    const registryOfficial = false;
    const snapshot = d._registrySnapshot ?? {};
    const officialValue = (key: string) =>
      registryOfficial && typeof snapshot[key] === 'string' && String(snapshot[key]).trim()
        ? String(snapshot[key]).trim()
        : null;

    const canonicalRazonSocial = officialValue('name') ?? d.razon_social;
    const canonicalTaxId = officialValue('taxId') ?? d.cif_nif ?? null;
    const canonicalAddress = officialValue('registeredAddress') ?? d.direccion ?? null;
    const canonicalCity = officialValue('city') ?? d.ciudad ?? null;
    const canonicalProvince = officialValue('province') ?? d.provincia ?? null;
    const canonicalPostalCode = officialValue('postalCode') ?? d.codigo_postal ?? null;
    const canonicalCountry = officialValue('country') ?? d.pais ?? 'ES';
    const normalizedTaxId = normalizeTaxId(canonicalTaxId);
    const registryLocks = registryOfficial ? lockedRegistryFields(d._registrySource, snapshot) : [];

    if (normalizedTaxId) {
      const { data: ownedRows, error: ownedError } = await admin
        .from('profile_companies')
        .select('company_id')
        .eq('profile_id', user.id);
      if (ownedError) {
        return NextResponse.json({ error: 'No se pudieron comprobar tus entidades actuales' }, { status: 500 });
      }
      const ownedIds = new Set((ownedRows ?? []).map((row) => row.company_id).filter(Boolean));

      const { data: matches, error: duplicateError } = await admin
        .from('companies')
        .select('id,razon_social,cif_nif')
        .limit(100);
      if (duplicateError) {
        return NextResponse.json({ error: 'No se pudo verificar el CIF/NIF' }, { status: 500 });
      }

      const normalizedMatches = (matches ?? []).filter((row) => normalizeTaxId(row.cif_nif) === normalizedTaxId);
      const ownMatch = normalizedMatches.find((row) => ownedIds.has(row.id));
      if (ownMatch) {
        return NextResponse.json({ error: 'Ya tienes una entidad con este CIF/NIF', code: 'tax_id_duplicate' }, { status: 409 });
      }

      if (normalizedMatches.length > 0) {
        return NextResponse.json({
          error: 'Ya existe una entidad con este CIF/NIF vinculada a otra cuenta. Revisión manual necesaria.',
          code: 'tax_id_conflict',
          existingCompanyIds: normalizedMatches.map((row) => row.id)
        }, { status: 409 });
      }
    }

    const { data: company, error: createError } = await admin
      .from('companies')
      .insert({
        user_id: user.id,
        name: canonicalRazonSocial,
        company_name: canonicalRazonSocial,
        razon_social: canonicalRazonSocial,
        nombre_comercial: d.nombre_comercial,
        cif_nif: normalizedTaxId,
        vat_id: normalizedTaxId,
        forma_juridica: d.forma_juridica,
        direccion: canonicalAddress,
        address: canonicalAddress,
        ciudad: canonicalCity,
        city: canonicalCity,
        provincia: canonicalProvince,
        codigo_postal: canonicalPostalCode,
        pais: canonicalCountry,
        country: canonicalCountry,
        telefono: d.telefono,
        phone: d.telefono,
        email: d.email,
        web: d.web,
        status: 'active',
        registry_source: registryOfficial ? d._registrySource ?? null : null,
        registry_source_url: registryOfficial ? d._registrySourceUrl ?? null : null,
        registry_verified_at: registryOfficial ? d._registryRetrievedAt ?? new Date().toISOString() : null,
        registry_locked_fields: registryLocks,
        registry_snapshot: registryOfficial ? d._registrySnapshot ?? {} : {},
      })
      .select('*')
      .single();

    if (createError || !company) {
      console.error('[companies POST] create', createError);
      if (createError?.code === '23505' && normalizedTaxId) {
        return NextResponse.json({
          error: 'Ya existe una entidad con este CIF/NIF.',
          code: 'tax_id_duplicate',
        }, { status: 409 });
      }
      return NextResponse.json({ error: 'Error al crear la empresa' }, { status: 500 });
    }

    const { error: membershipError } = await admin.from('profile_companies').insert({
      profile_id: user.id,
      company_id: company.id,
      role: 'owner'
    });

    if (membershipError) {
      console.error('[companies POST] membership', membershipError);
      await admin.from('companies').delete().eq('id', company.id);
      return NextResponse.json({ error: 'No se pudo vincular la nueva entidad; no se ha conservado el alta parcial.' }, { status: 500 });
    }

    const { error: activateError } = await admin
      .from('profiles')
      .update({ active_company_id: company.id })
      .eq('id', user.id);

    if (activateError) {
      console.error('[companies POST] active company', activateError);
      await admin.from('profile_companies').delete().eq('profile_id', user.id).eq('company_id', company.id);
      await admin.from('companies').delete().eq('id', company.id);
      return NextResponse.json({ error: 'No se pudo activar la nueva entidad; no se ha conservado el alta parcial.' }, { status: 500 });
    }

    if (d._appliedSuggestionId) {
      await admin
        .from('company_data_suggestions')
        .update({ selected_by_user: true, selected_at: new Date().toISOString() })
        .eq('id', d._appliedSuggestionId)
        .eq('profile_id', user.id)
        .then(() => null, () => null);
    }

    return NextResponse.json({ company }, { status: 201 });
  } catch (err) {
    console.error('[companies POST]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
