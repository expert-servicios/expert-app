'use client';

import { useState } from 'react';
import JSZip from 'jszip';

type Asset = { file: string; width: number; height: number };
const urlFor = (file: string) => `/branding/expert-2026/${file}.svg`;
const pngSize = (asset: Asset) => {
  const scale = Math.min(2.3, 2200 / Math.max(asset.width, asset.height));
  return { width: Math.round(asset.width * scale), height: Math.round(asset.height * scale) };
};

function save(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

async function svgText(file: string) {
  const response = await fetch(urlFor(file), { cache: 'force-cache' });
  if (!response.ok) throw new Error('No se pudo descargar el SVG');
  return response.text();
}

async function pngBlob(svg: string, asset: Asset): Promise<Blob> {
  const source = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new window.Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('No se pudo rasterizar el SVG'));
      image.src = source;
    });
    const { width, height } = pngSize(asset);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('El navegador no permite exportar PNG');
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Error al crear el PNG');
    return blob;
  } finally {
    URL.revokeObjectURL(source);
  }
}

export function BrandDownload(asset: Asset) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function handlePng() {
    setBusy(true);
    setError('');
    try { save(await pngBlob(await svgText(asset.file), asset), `${asset.file}.png`); }
    catch { setError('No se pudo generar el PNG. Puedes descargar el SVG.'); }
    finally { setBusy(false); }
  }
  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-3">
        <a href={urlFor(asset.file)} download={`${asset.file}.svg`} className="rounded-md bg-[#0D1B2A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#23364D]">Descargar SVG</a>
        <button type="button" disabled={busy} onClick={handlePng} className="rounded-md border border-[#0D1B2A]/30 px-4 py-2 text-sm font-semibold hover:bg-[#F8F6F1] disabled:opacity-50">{busy ? 'Generando…' : 'Descargar PNG'}</button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}

export function DownloadBrandPack({ files }: { files: Asset[] }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function handlePack() {
    setBusy(true);
    setError('');
    try {
      const zip = new JSZip();
      for (const asset of files) {
        const svg = await svgText(asset.file);
        zip.file(`svg/${asset.file}.svg`, svg);
        zip.file(`png/${asset.file}.png`, await pngBlob(svg, asset));
      }
      zip.file('README.txt', 'EXPERT Consulting · Identidad corporativa 2026\\nAzul #0D1B2A · Oro #D4A017\\nLos logotipos son transparentes, excepto el icono de aplicacion.\\nhttps://expertconsulting.es/marca\\n');
      save(await zip.generateAsync({ type: 'blob' }), 'EXPERT-Consulting-Brand-Pack-2026.zip');
    } catch {
      setError('No se pudo generar el ZIP. Utiliza las descargas individuales.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <button type="button" onClick={handlePack} disabled={busy} className="rounded-lg bg-[#D4A017] px-6 py-3 text-sm font-bold text-[#0D1B2A] hover:bg-[#F2C14E] disabled:opacity-50">{busy ? 'Preparando archivos…' : 'Descargar pack completo (SVG + PNG)'}</button>
      {error && <p className="mt-2 text-sm text-rose-200" role="alert">{error}</p>}
    </div>
  );
}
