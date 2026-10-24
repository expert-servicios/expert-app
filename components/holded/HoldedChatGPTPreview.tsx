import Image from 'next/image';
import { FileText, MessageSquareText, ShieldCheck, Sparkles, Users } from 'lucide-react';

/**
 * Demonstration-only composition, not a screenshot or a working integration.
 * Keeps all sample data local and static; never requests real client information.
 */
export function HoldedChatGPTPreview() {
  return (
    <figure className="relative isolate mx-auto w-full max-w-[540px]">
      <div aria-hidden="true" className="pointer-events-none absolute -inset-4 -z-10 rounded-[40px] bg-[#D4A017]/10 blur-3xl" />

      <div className="overflow-hidden rounded-[25px] border border-[#D4A017]/30 bg-[#F8F9FC] text-[#0D1B2A] shadow-[0_25px_65px_rgba(0,0,0,0.27)]">
        <div className="flex items-center justify-between gap-2 border-b border-[#E5EAF1] bg-white px-4 py-4 sm:px-6">
          <Image
            src="/Holded-Logotype-Red_Light.svg"
            alt="Holded"
            width={106}
            height={35}
            className="h-7 w-auto"
          />
          <span className="rounded-full border border-[#DCE4EB] bg-[#F5F7FA] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.10em] text-[#556579]">
            Datos de ejemplo
          </span>
        </div>

        <div className="px-4 pb-16 pt-5 sm:px-6 sm:pb-20 sm:pt-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF5454]/10 text-[#FF5454]">
              <FileText size={20} aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium text-[#6A788A]">Tu empresa</p>
              <h2 className="text-lg font-bold">Vista de facturación</h2>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#E7EBF0] bg-white p-3 sm:p-4">
              <div className="flex items-center gap-2 text-[#566579]"><FileText size={15} aria-hidden /><span className="text-[11px] sm:text-xs">Facturas</span></div>
              <p className="mt-2 text-2xl font-extrabold tabular-nums sm:text-3xl">24</p>
              <p className="mt-1 text-[10px] text-[#708095]">Registros ilustrativos</p>
            </div>
            <div className="rounded-xl border border-[#E7EBF0] bg-white p-3 sm:p-4">
              <div className="flex items-center gap-2 text-[#566579]"><Users size={15} aria-hidden /><span className="text-[11px] sm:text-xs">Clientes</span></div>
              <p className="mt-2 text-2xl font-extrabold tabular-nums sm:text-3xl">18</p>
              <p className="mt-1 text-[10px] text-[#708095]">Registros ilustrativos</p>
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-[#E7EBF0] bg-white">
            <div className="flex items-center justify-between border-b border-[#E7EBF0] px-4 py-3">
              <span className="text-xs font-bold">Facturas recientes</span>
              <span className="text-[10px] text-[#6A788A]">Ejemplo</span>
            </div>
            <div className="flex items-center justify-between gap-2 px-4 py-3 text-xs">
              <span className="font-semibold text-[#526175]">Factura de ejemplo A</span>
              <span className="rounded-full bg-[#FFF3DB] px-2 py-1 font-medium text-[#87600F]">Pendiente</span>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-[#EDF0F4] px-4 py-3 text-xs">
              <span className="font-semibold text-[#526175]">Factura de ejemplo B</span>
              <span className="rounded-full bg-[#E9F7EF] px-2 py-1 font-medium text-[#207246]">Cobrada</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-14 ml-auto w-[96%] rounded-[22px] border border-[#D7E0EB] bg-white p-4 text-[#0D1B2A] shadow-[0_20px_50px_rgba(0,0,0,0.25)] sm:-mt-16 sm:w-[92%] sm:p-5">
        <div className="flex items-center justify-between gap-3 border-b border-[#EDF0F4] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0D1B2A] text-white">
              <MessageSquareText size={17} aria-hidden />
            </div>
            <span className="text-sm font-bold">ChatGPT</span>
          </div>
          <span className="text-[10px] font-medium text-[#68788B]">Consulta ilustrativa</span>
        </div>
        <div className="ml-auto mt-4 max-w-[90%] rounded-2xl rounded-br-sm bg-[#F1F3F7] px-3 py-3 text-xs font-medium leading-5 text-[#23364D] sm:text-sm">
          ¿Qué facturas están pendientes de cobro?
        </div>
        <div className="mt-4 flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#D4A017]/15 text-[#A27A13]">
            <Sparkles size={15} aria-hidden />
          </div>
          <p className="text-xs leading-5 text-[#3A4A5D] sm:text-sm sm:leading-6">
            Consulta la información a la que hayas dado acceso en Holded, según los permisos y herramientas disponibles.
          </p>
        </div>
        <div className="mt-4 flex items-center gap-2 border-t border-[#EDF0F4] pt-3 text-[10px] font-medium leading-4 text-[#64748B] sm:text-xs">
          <ShieldCheck size={14} className="shrink-0 text-[#A27A13]" aria-hidden />
          Tú autorizas la conexión y controlas sus permisos.
        </div>
      </div>

      <figcaption className="mt-4 text-center text-[11px] leading-5 text-white/65">
        Vista conceptual con datos inventados. No es una captura real ni acredita funciones concretas del conector.
      </figcaption>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <span className="text-xs font-medium text-white/60">Con la ayuda de</span>
        <Image
          src="/branding/expert-approved/horizontal-oscuro.webp"
          alt="EXPERT Consulting"
          width={165}
          height={42}
          className="h-auto w-[165px] object-contain"
        />
      </div>
    </figure>
  );
}
