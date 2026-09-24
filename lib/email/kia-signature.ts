/** Applied only to messages explicitly authored by KIA, never to human mail. */
export function appendKiaSignature(html: string, metadata?: Record<string, unknown>): string {
  if (metadata?.kia_author !== true || html.includes('data-kia-signature=')) return html;
  const ru = metadata.preferred_language === 'ru' || metadata.checkout_locale === 'ru';
  const signature = `<div data-kia-signature="true" style="margin-top:24px;font-size:13px;line-height:1.6">
    <strong>KIA · EXPERT 💼</strong><br>
    ${ru ? 'ИИ-помощница по сопровождению вашего дела' : 'Asistente de IA para la tramitación de tu expediente'}<br>
    <a href="mailto:info@expertconsulting.es">info@expertconsulting.es</a>
    </div>`;
  return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${signature}</body>`) : html + signature;
}
