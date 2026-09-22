import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CompanyHoldedAdminPanel } from './CompanyHoldedAdminPanel';

export default async function CompanyIntegrationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-[#f8f4eb] px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <Link href={`/admin/directorio`} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#52606d] hover:text-[#07111d]">
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al Directorio 360
        </Link>
        <CompanyHoldedAdminPanel companyId={id} />
      </div>
    </main>
  );
}
