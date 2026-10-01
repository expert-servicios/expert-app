'use client';

import { useState } from 'react';
import { CheckCircle2, Clipboard, Link2, Loader2 } from 'lucide-react';

type PlanSlug = 'supervision' | 'avanzado' | 'colaborativo';
type EntityType = 'empresa' | 'autonomo';
type Billing = 'monthly' | 'annual';

type InvitationResult = {
  activationUrl: string;
  quoteId: string;
  expiresAt: string;
  plan: { name: string; billing: Billing; interval: 'month' | 'year'; amountEur: number; planPath: string };
};

const PLANS: Array<{ slug: PlanSlug; label: string; monthly: number; annual: number }> = [
  { slug: 'supervision', label: 'Plan Supervisión', monthly: 49, annual: 490 },
  { slug: 'avanzado', label: 'Plan Avanzado', monthly: 99, annual: 990 },
  { slug: 'colaborativo', label: 'Plan Colaborativo', monthly: 199, annual: 1990 },
];

export function SubscriptionInvitationGenerator() {
  const [email, setEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [entityType, setEntityType] = useState<EntityType>('empresa');
  const [proposedEntityName, setProposedEntityName] = useState('');
  const [planSlug, setPlanSlug] = useState<PlanSlug>('avanzado');
  const [billing, setBilling] = useState<Billing>('monthly');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<InvitationResult | null>(null);

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setCopied(false);
    try {
      const response = await fetch('/api/admin/subscriptions/invitations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          clientEmail: email.trim(),
          recipientName: recipientName.trim(),
          entityType,
          planSlug,
          billing,
          proposedEntityName: proposedEntityName.trim() || undefined,
          expiresInDays: 14,
        }),
      });
      const data = await response.json() as InvitationResult & { error?: string };
      if (!response.ok || !data.activationUrl) {
        throw new Error(data.error ?? 'No se pudo generar el enlace.');
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el enlace.');
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!result?.activationUrl) return;
    try {
      await navigator.clipboard.writeText(result.activationUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('No se pudo copiar automáticamente. Selecciona el enlace manualmente.');
    }
  }

  return (
    <section className="rounded-2xl border border-[#d7a33a]/40 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d7a33a]/10">
          <Link2 className="h-5 w-5 text-[#c88b25]" />
        </div>
        <div>
          <h2 className="font-serif text-lg font-bold text-[#07111d]">Generar enlace de suscripción por titular</h2>
          <p className="mt-1 text-xs leading-5 text-[#52606d]">
            No crea usuario ni entidad. El cliente accede con el mismo email, confirma sus datos fiscales y formaliza una única suscripción para ese titular.
          </p>
        </div>
      </div>

      <form onSubmit={generate} className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Email del destinatario *">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="cliente@empresa.com" />
        </Field>
        <Field label="Nombre del destinatario *">
          <input required minLength={2} value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className={inputCls} placeholder="Gabriel García" />
        </Field>
        <Field label="Tipo de titular *">
          <select value={entityType} onChange={(e) => setEntityType(e.target.value as EntityType)} className={inputCls}>
            <option value="empresa">Sociedad / entidad</option>
            <option value="autonomo">Autónomo / empresario individual</option>
          </select>
        </Field>
        <Field label="Plan *">
          <select value={planSlug} onChange={(e) => setPlanSlug(e.target.value as PlanSlug)} className={inputCls}>
            {PLANS.map((plan) => (
              <option key={plan.slug} value={plan.slug}>
                {plan.label} — {billing === 'annual' ? `${plan.annual} €/año` : `${plan.monthly} €/mes`} + IVA
              </option>
            ))}
          </select>
        </Field>
        <Field label="Facturación *">
          <select value={billing} onChange={(e) => setBilling(e.target.value as Billing)} className={inputCls}>
            <option value="monthly">Mensual</option>
            <option value="annual">Anual · 2 meses gratis</option>
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label={entityType === 'empresa' ? 'Razón social prevista' : 'Nombre fiscal / actividad'}>
            <input value={proposedEntityName} onChange={(e) => setProposedEntityName(e.target.value)} className={inputCls} placeholder={entityType === 'empresa' ? 'G5L Ventures, S.L.' : 'Nombre del autónomo'} />
          </Field>
        </div>

        {error && (
          <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>
        )}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading || !email.trim() || !recipientName.trim()}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#07111d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#10253c] disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            {loading ? 'Generando…' : 'Generar enlace EXPERT'}
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-700" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-green-900">
                {result.plan.name} · {result.plan.amountEur} € + IVA/{result.plan.billing === 'annual' ? 'año' : 'mes'}
              </p>
              <p className="mt-1 text-xs text-green-800">
                Enlace válido hasta {new Date(result.expiresAt).toLocaleDateString('es-ES')}.
              </p>
              <div className="mt-3 flex gap-2">
                <input readOnly value={result.activationUrl} className="min-w-0 flex-1 rounded-lg border border-green-200 bg-white px-3 py-2 text-xs text-[#07111d]" />
                <button type="button" onClick={copyLink} className="inline-flex items-center gap-1 rounded-lg border border-green-300 bg-white px-3 py-2 text-xs font-semibold text-green-800 hover:bg-green-100">
                  <Clipboard className="h-3.5 w-3.5" />
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-green-800">
                Quote ID: {result.quoteId}. No envía correo automáticamente: puedes incluir este enlace en la propuesta comercial consolidada.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const inputCls = 'min-h-11 w-full rounded-lg border border-[#d8cbb5] bg-white px-3 text-sm text-[#07111d] outline-none transition focus:border-[#d7a33a] focus:ring-2 focus:ring-[#d7a33a]/20';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#07111d]">{label}</span>
      {children}
    </label>
  );
}
