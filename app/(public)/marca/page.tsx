import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
export const metadata: Metadata = {
 title: 'Logotipos oficiales y manual de marca | EXPERT Consulting',
 description: 'Logotipo e isotipo aprobados EXPERT Consulting para fondo claro y oscuro, descargables en PNG y WebP junto con el manual de marca.',
 alternates: {canonical:'https://expertconsulting.es/marca'}
};
const assets = [
 {title:'Logotipo sobre fondo claro',file:'horizontal-claro',wide:true,dark:false},
 {title:'Logotipo sobre fondo oscuro',file:'horizontal-oscuro',wide:true,dark:true},
 {title:'Isotipo EX sobre fondo claro',file:'isotipo-claro',wide:false,dark:false},
 {title:'Isotipo EX sobre fondo oscuro',file:'isotipo-oscuro',wide:false,dark:true},
] as const;
export default function MarcaPage(){
 return <main className="min-h-screen bg-[#F8F6F1] text-[#0D1B2A]">
  <section className="bg-[#0D1B2A] px-6 py-12 text-[#F8F6F1]">
   <div className="mx-auto max-w-6xl">
    <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">EXPERT CONSULTING</p>
    <h1 className="mt-3 font-serif text-4xl font-bold">Identidad corporativa</h1>
    <p className="mt-4 max-w-2xl text-sm leading-7">Descarga los diseños finales aprobados, con el monograma EX sin líneas superpuestas, y el manual de aplicación.</p>
    <div className="mt-6 flex flex-wrap gap-3">
     <a href="/branding/expert-approved/Pack-de-marca.zip" download className="rounded-lg bg-[#D4A017] px-5 py-3 text-sm font-bold text-[#0D1B2A]">Descargar pack completo ZIP</a>
     <a href="/branding/expert-approved/Manual-de-marca.pdf" target="_blank" rel="noreferrer" className="rounded-lg border border-[#D4A017] px-5 py-3 text-sm font-bold text-white">Consultar manual PDF</a>
    </div>
   </div>
  </section>
  <section className="mx-auto max-w-6xl px-6 py-12">
   <h2 className="font-serif text-2xl font-bold">Logotipos e isotipos</h2>
   <p className="mt-2 text-sm text-[#23364D]">Imágenes originales aprobadas, procesadas para transparencia y uso digital. No se presentan como SVG vectorial: el diseño metálico maestro es rasterizado.</p>
   <div className="mt-8 grid gap-7 md:grid-cols-2">
    {assets.map(item=><article key={item.file} className="overflow-hidden rounded-xl border border-[#D4A017]/25 bg-white shadow-sm">
      <div className={`flex h-56 items-center justify-center p-7 ${item.dark?'bg-[#0D1B2A]':'bg-[#FFFFFF]'}`}>
       <Image src={`/branding/expert-approved/${item.file}.webp`} alt={item.title} width={item.wide?600:512} height={item.wide?150:512} unoptimized className="max-h-full w-auto object-contain"/>
      </div>
      <div className="p-5"><h3 className="font-semibold">{item.title}</h3>
       <div className="mt-4 flex gap-4 text-sm font-semibold">
        <a className="underline underline-offset-4" href={`/branding/expert-approved/${item.file}.png`} download>Descargar PNG</a>
        <a className="underline underline-offset-4" href={`/branding/expert-approved/${item.file}.webp`} download>Descargar WebP</a>
       </div>
      </div>
    </article>)}
   </div>
   <section className="mt-12 border-t border-[#D4A017]/30 pt-8">
    <h2 className="font-serif text-2xl font-bold">Paleta y reglas de uso</h2>
    <p className="mt-3 text-sm">Azul marino #0D1B2A · Dorado #D4A017 · Oro claro #F2C14E · Crema #F8F6F1.</p>
    <p className="mt-3 text-sm">Mantener siempre el símbolo EX original y el nombre EXPERT / Consulting en dos líneas; no añadir trazos ni deformar proporciones. <Link href="/contacto" className="underline">Contacto</Link>.</p>
   </section>
  </section>
 </main>
}