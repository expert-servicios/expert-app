import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BrandDownload, DownloadBrandPack } from '@/components/site/BrandDownload';

export const metadata: Metadata = {
  title: 'Logotipos y recursos de marca | EXPERT Consulting',
  description: 'Descarga la imagen corporativa de EXPERT Consulting: logos horizontales, isotipo EX, versiones vectoriales SVG y PNG transparentes.',
  alternates: { canonical: 'https://expertconsulting.es/marca' },
  robots: { index: true, follow: true },
};

const assets = [
  { name: 'Logotipo horizontal', file: 'expert-horizontal', width: 1530, height: 360, caption: 'Versión principal de dos líneas · fondo claro', dark: false },
  { name: 'Logotipo horizontal inverso', file: 'expert-horizontal-inverse', width: 1530, height: 360, caption: 'Para fondos azul marino y oscuros', dark: true },
  { name: 'Isotipo EX', file: 'expert-isotipo', width: 474, height: 347, caption: 'Símbolo independiente para redes y documentación', dark: false },
  { name: 'Isotipo inverso', file: 'expert-isotipo-inverse', width: 474, height: 347, caption: 'Símbolo para fondos oscuros', dark: true },
  { name: 'Composición vertical', file: 'expert-vertical', width: 870, height: 880, caption: 'Para formatos cuadrados y verticales', dark: false },
  { name: 'Nombre corporativo', file: 'expert-wordmark', width: 1110, height: 330, caption: 'Tipografía sin símbolo', dark: false },
  { name: 'Versión monocromática', file: 'expert-monochrome', width: 1530, height: 360, caption: 'Una sola tinta para usos administrativos', dark: false },
  { name: 'Icono de aplicación', file: 'expert-app', width: 512, height: 512, caption: 'Versión con fondo azul para aplicaciones y PWA', dark: false },
] as const;

export default function MarcaPage() {
  return (
    <main className="min-h-screen bg-[#F8F6F1] text-[#0D1B2A]">
      <section className="border-b border-[#D4A017]/30 bg-[#0D1B2A] px-6 py-14 text-[#F8F6F1]">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#F2C14E]">EXPERT Consulting</p>
          <h1 className="mt-3 font-serif text-4xl font-bold md:text-5xl">Identidad corporativa</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[#F8F6F1]/85">Logotipos oficiales de consulta y descarga. Todas las variantes de logotipo tienen fondo transparente; el icono de aplicación conserva deliberadamente su fondo azul.</p>
          <div className="mt-8"><DownloadBrandPack files={assets.map(({ file, width, height }) => ({ file, width, height }))} /></div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="font-serif text-2xl font-bold">Logotipos e iconos</h2>
        <p className="mt-2 text-sm text-[#23364D]">Descarga el SVG vectorial o genera un PNG en alta resolución. Ninguno de los archivos de marca contiene fondos blancos simulados.</p>
        <div className="mt-8 grid gap-7 md:grid-cols-2">
          {assets.map((asset) => (
            <article key={asset.file} className="overflow-hidden rounded-2xl border border-[#D4A017]/25 bg-white shadow-sm">
              <div className={`flex h-56 items-center justify-center px-7 py-8 ${asset.dark ? 'bg-[#0D1B2A]' : 'bg-white'}`}>
                <Image src={`/branding/expert-2026/${asset.file}.svg`} alt={asset.name + ' de EXPERT Consulting'} width={asset.width} height={asset.height} unoptimized className="max-h-full w-auto object-contain" />
              </div>
              <div className="border-t border-[#D4A017]/15 p-6">
                <h3 className="text-lg font-bold">{asset.name}</h3>
                <p className="mt-1 text-sm text-[#23364D]">{asset.caption}</p>
                <BrandDownload file={asset.file} width={asset.width} height={asset.height}/>
              </div>
            </article>
          ))}
        </div>
        <section className="mt-14 border-t border-[#D4A017]/30 pt-8">
          <h2 className="font-serif text-2xl font-bold">Colores corporativos</h2>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[['Azul marino','#0D1B2A'], ['Dorado','#D4A017'], ['Dorado claro','#F2C14E'], ['Crema','#F8F6F1']].map(([name, hex]) => (
              <div key={hex}><div className="h-20 rounded-lg border border-[#0D1B2A]/10" style={{ backgroundColor: hex }}/><p className="mt-2 text-sm font-semibold">{name}</p><p className="text-xs text-[#23364D]">{hex}</p></div>
            ))}
          </div>
          <p className="mt-8 max-w-3xl text-sm leading-6 text-[#23364D]">Estas imágenes se facilitan para identificar correctamente a EXPERT Consulting. No se permite manipularlas de forma que sugiera colaboración, aval o patrocinio inexistente. Si necesitas formatos especiales, <Link href="/contacto" className="font-semibold text-[#0D1B2A] underline underline-offset-4">contacta con EXPERT</Link>.</p>
        </section>
      </section>
    </main>
  );
}
