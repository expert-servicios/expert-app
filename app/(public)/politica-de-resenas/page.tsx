import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de reseñas y valoraciones | EXPERT',
  description: 'Cómo EXPERT verifica, modera y publica las reseñas de clientes de forma transparente e imparcial.',
  alternates: { canonical: 'https://expertconsulting.es/politica-de-resenas' },
};

const LAST_UPDATED = '19 de septiembre de 2026';

export default function ReviewPolicyPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <div className="bg-[#0D1B2A] px-6 py-14 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Transparencia</p>
          <h1 className="mt-3 font-serif text-3xl font-bold md:text-4xl">Política de reseñas y valoraciones de clientes</h1>
          <p className="mt-3 text-sm text-white/60">Última actualización: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-14">
        <div className="space-y-10 text-sm leading-7 text-[#23364D]">
          <Section title="1. Qué consideramos una reseña verificada">
            <p>
              EXPERT solo solicita una valoración cuando un expediente real ha sido marcado como finalizado.
              El enlace se asocia internamente al cliente y al expediente correspondiente, es de un solo uso y caduca a los 30 días.
              De este modo, las reseñas identificadas como verificadas proceden de clientes que han utilizado el servicio al que se refieren.
            </p>
          </Section>

          <Section title="2. Qué puede valorar el cliente">
            <p>
              La puntuación de 1 a 5 estrellas es obligatoria. El comentario escrito es opcional.
              Una valoración puede ser positiva, neutra o negativa. EXPERT no elimina, oculta ni rebaja una puntuación por ser desfavorable.
            </p>
          </Section>

          <Section title="3. Autorización para publicar">
            <p>
              Enviar una valoración no implica publicarla. El cliente decide expresamente si autoriza su publicación.
              Actualmente las reseñas públicas se muestran de forma anónima como «Cliente EXPERT», sin publicar nombre, email, NIF ni otros datos identificativos.
            </p>
          </Section>

          <Section title="4. Moderación automatizada por KIA">
            <p>
              Cuando existe un comentario, KIA puede realizar una primera moderación automática conforme a esta política.
              Para reducir sesgos, el sistema de moderación recibe únicamente el texto del comentario: no recibe la puntuación en estrellas,
              el nombre del cliente, su email, su NIF, el precio pagado ni el contenido del expediente.
            </p>
            <p>
              La moderación no tiene como finalidad proteger la reputación de EXPERT. Una crítica sobre precio, atención, demora,
              resultado, expectativas o calidad del servicio es publicable aunque sea claramente negativa.
            </p>
          </Section>

          <Section title="5. Contenido que puede no publicarse">
            <p>El comentario puede quedar oculto cuando contenga de forma clara alguno de estos elementos:</p>
            <ul>
              <li>insultos graves, amenazas, acoso o contenido de odio;</li>
              <li>datos personales o de contacto propios o de terceros que no deban hacerse públicos;</li>
              <li>información confidencial o sensible del expediente;</li>
              <li>spam, publicidad o enlaces promocionales ajenos al servicio.</li>
            </ul>
            <p>
              En estos casos puede mantenerse publicada la puntuación en estrellas y ocultarse únicamente el comentario.
              EXPERT no reescribe ni «suaviza» el texto del cliente para hacerlo más favorable.
            </p>
          </Section>

          <Section title="6. Casos que pasan a revisión humana">
            <p>
              Las acusaciones graves, posibles contenidos ilícitos o difamatorios, situaciones ambiguas y cualquier caso en el que KIA
              no alcance un nivel suficiente de confianza quedan pendientes de revisión humana. Un fallo técnico de la moderación automática
              nunca provoca el rechazo automático de una reseña.
            </p>
          </Section>

          <Section title="7. Criterio independiente de la puntuación">
            <p>
              Las mismas reglas se aplican a una reseña de 1 estrella y a una de 5 estrellas.
              La puntuación no forma parte de los datos que KIA utiliza para decidir si el comentario cumple esta política.
            </p>
          </Section>

          <Section title="8. Sin reseñas falsas ni incentivos condicionados">
            <p>
              EXPERT no crea reseñas ficticias, no encarga reseñas falsas y no condiciona incentivos, descuentos o ventajas a la emisión
              de una opinión positiva. Tampoco presenta como reseña verificada una opinión que no esté vinculada a un servicio realmente utilizado.
            </p>
          </Section>

          <Section title="9. Cómo calculamos las estrellas">
            <p>
              La media mostrada en una página de servicio se calcula únicamente con valoraciones cuya publicación ha sido autorizada
              y que han superado el proceso de moderación. Si un comentario se oculta por privacidad o incumplimiento de esta política,
              la puntuación puede seguir formando parte de la media siempre que la valoración sea verificable y su publicación esté autorizada.
            </p>
          </Section>

          <Section title="10. Revisión, retirada y respuesta de EXPERT">
            <p>
              Si consideras que una decisión de moderación es incorrecta, puedes solicitar revisión humana escribiendo a{' '}
              <a className="font-semibold text-[#D4A017] underline" href="mailto:info@expertconsulting.es">info@expertconsulting.es</a>.
              También puedes solicitar la retirada de una reseña publicada cuando proceda conforme a la normativa aplicable.
              EXPERT podrá responder públicamente a una reseña para aportar contexto o explicar las medidas adoptadas.
            </p>
          </Section>

          <Section title="11. Privacidad y trazabilidad">
            <p>
              Conservamos la información necesaria para acreditar que la valoración procede de un servicio real y para auditar la decisión de moderación.
              Registramos, entre otros datos técnicos, si la decisión fue automática o humana, la versión de la política aplicada y la fecha de moderación.
              Consulta nuestra <Link className="font-semibold text-[#D4A017] underline" href="/privacidad">Política de Privacidad</Link>.
            </p>
          </Section>

          <Section title="12. Marco de transparencia">
            <p>
              Esta política responde al principio de transparencia aplicable a las reseñas de consumidores: informamos de si verificamos
              su origen y de cómo se procesan. La política se revisará cuando cambien nuestras prácticas o la normativa aplicable.
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              <a className="font-semibold text-[#D4A017] underline" href="https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555" target="_blank" rel="noreferrer">Texto refundido de consumidores y usuarios (BOE)</a>
              <a className="font-semibold text-[#D4A017] underline" href="https://eur-lex.europa.eu/eli/dir/2019/2161/oj" target="_blank" rel="noreferrer">Directiva (UE) 2019/2161</a>
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-xl font-bold text-[#0D1B2A] md:text-2xl">{title}</h2>
      <div className="mt-4 space-y-3 [&_li]:ml-5 [&_li]:list-disc">{children}</div>
    </section>
  );
}
