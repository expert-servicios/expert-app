import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';
import { sendEmail } from '@/lib/email/send';

export async function POST(request: NextRequest) {
  const admin = await requireAdminClient(request);
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await sendEmail({
    from: process.env.RESEND_FROM_EMAIL ?? 'EXPERT <info@expertconsulting.es>',
    to: 'cliente@ejemplo.com',
    eventType: 'review.request',
    subject: 'Valora tu servicio en EXPERT',
    html: '<p>Gracias por confiar en EXPERT. Comparte tu valoración con este enlace seguro.</p>',
    metadata: { source: 'reviews_request' },
  });

  return NextResponse.json({ ok: true });
}
