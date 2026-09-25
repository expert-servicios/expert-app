import { KiaFeedbackReviewQueue } from '@/components/admin/KiaFeedbackReviewQueue';

export default function KiaFeedbackPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b18416]">KIA</p>
        <h1 className="mt-1 text-2xl font-semibold text-[#07111d]">Feedback y aprendizaje</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#657283]">
          Revisa respuestas útiles antes de permitir que KIA las reutilice como ejemplos de tono y estructura.
          El feedback del cliente nunca entra automáticamente en aprendizaje.
        </p>
      </div>
      <KiaFeedbackReviewQueue />
    </div>
  );
}
