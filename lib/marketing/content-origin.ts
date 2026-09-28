export function normalizeContentOrigin(
  origin: string | null | undefined,
  fallback: string,
): string {
  const value = origin?.trim();
  return value || fallback;
}

function humanize(value: string): string {
  return value
    .replace(/^\/+|\/+$/g, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function describeContentOrigin(origin: string | null | undefined): string {
  const raw = origin?.trim();
  if (!raw) return 'Web · origen no identificado';

  const separator = raw.indexOf(':');
  const kind = separator >= 0 ? raw.slice(0, separator) : '';
  const value = separator >= 0 ? raw.slice(separator + 1) : raw;

  if (kind === 'blog') {
    return `Artículo del blog · /blog/${value}`;
  }
  if (kind === 'docs') {
    return `Base de conocimientos · /docs/${value}`;
  }
  if (kind === 'service') {
    return `Ficha de servicio · ${humanize(value) || value}`;
  }
  if (kind === 'form') {
    return `Formulario web · ${humanize(value) || value}`;
  }

  return `Web · ${raw}`;
}
