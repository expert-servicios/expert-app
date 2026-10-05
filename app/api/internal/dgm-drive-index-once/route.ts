import { NextResponse } from 'next/server';
import { indexCompanyGoogleDrive } from '@/lib/documents/company-drive-index';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DGM_COMPANY_ID = '188a1871-0ea8-4b11-adac-c9acc41c4a4b';

export async function GET(request: Request) {
  const deploymentHost = process.env.VERCEL_URL?.trim().toLowerCase();
  const requestHost = new URL(request.url).host.trim().toLowerCase();

  if (
    process.env.VERCEL_ENV !== 'production'
    || !deploymentHost
    || requestHost !== deploymentHost
  ) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const result = await indexCompanyGoogleDrive(DGM_COMPANY_ID);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Drive indexing failed',
    }, { status: 500 });
  }
}
