import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';
import { getResendClient } from '@/lib/integrations/resend';
import { appendKiaSignature } from '@/lib/email/kia-signature';

export async function POST(request: NextRequest) {
  const admin = await requireAdminClient(request);
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const resend = getResendClient();

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'EXPERT <info@expertconsulting.es>',
    to: ['cliente@ejemplo.com'],
    subject: 'Valora tu servicio en EXPERT',
    html: appendKiaSignature('<p>Gracias por confiar en EXPERT. Comparte tu valoración con este enlace seguro.</p>')
  });

  return NextResponse.json({ ok: true });
}
