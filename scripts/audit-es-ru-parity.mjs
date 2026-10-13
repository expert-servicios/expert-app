import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const ES_ROOT = 'app/(public)';
const RU_ROOT = 'app/(localized)/ru';

/** Existing approved localized routes; they currently resolve through RU catch-all. */
export const ROUTE_PAIRS = Object.freeze({
  '/': '/ru',
  '/holded': '/ru/holded',
  '/planes': '/ru/plany',
  '/servicios': '/ru/uslugi',
  '/academy': '/ru/academy',
  '/cita': '/ru/konsultatsiya',
  '/servicios/empresas-autonomos': '/ru/autonomo',
  '/servicios/declaraciones-impuestos': '/ru/nalogi',
  '/servicios/extranjeria-nacionalidad/nacionalidad-espanola-menor-nacido-en-espana': '/ru/uslugi/grazhdanstvo-ispanii-rebenok-rozhdennyy-v-ispanii',
  '/blog/proteccion-temporal-ucrania-larga-duracion-2026': '/ru/blog/ukraina-proteccion-temporal-larga-duracion-2026',
  '/blog/guia-ex11-larga-duracion-nacional': '/ru/blog/instruktsiya-ex11-larga-duracion',
  '/servicios/extranjeria-nacionalidad/residencia-larga-duracion-nacional-ucrania': '/ru/uslugi/residencia-larga-duracion-nacional-ucrania',
  '/docs/firmar-pdf-certificado-digital-autofirma': '/ru/docs/podpisat-pdf-cifrovym-sertifikatom-autofirma',
  '/docs/firmar-solicitud-nacionalidad-menor-progenitores': '/ru/docs/podpisat-zayavlenie-grazhdanstvo-rebenka-roditeli',
});

/** Actual catch-all keys from public-routes.ts; do not assume that any RU slug exists. */
export const RU_CATCHALL_ROUTES = new Set([
  '/ru', '/ru/holded', '/ru/plany', '/ru/uslugi', '/ru/academy',
  '/ru/autonomo', '/ru/sl', '/ru/nalogi', '/ru/verifactu',
  '/ru/konsultatsiya', '/ru/uslugi/grazhdanstvo-ispanii-rebenok-rozhdennyy-v-ispanii',
]);

export function normalizePageRoute(file, root) {
  const prefix = root.replaceAll('\\', '/').replace(/\/$/, '');
  const normalized = file.replaceAll('\\', '/');
  if (!normalized.startsWith(prefix + '/') || !normalized.endsWith('/page.tsx')) return null;
  const segment = normalized.slice(prefix.length + 1, -'/page.tsx'.length);
  if (segment === '' || segment === 'page.tsx') return '/';
  return '/' + segment.split('/').filter((s) => !/^\(.*\)$/.test(s)).join('/');
}

function walkPages(abs, root = ROOT) {
  if (!existsSync(abs)) return [];
  const found = [];
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    const absolute = join(abs, entry.name);
    if (entry.isDirectory()) found.push(...walkPages(absolute, root));
    else if (entry.isFile() && entry.name === 'page.tsx')
      found.push(relative(root, absolute).split(sep).join('/'));
  }
  return found;
}

export function auditRouteParity(esPaths, ruPaths) {
  const esRoutes = new Set(esPaths.map((p) => normalizePageRoute(p, ES_ROOT)).filter(Boolean));
  const ruRoutes = new Set(ruPaths.map((p) => normalizePageRoute(p, RU_ROOT)).filter(Boolean)
    .map((route) => route === '/' ? '/ru' : '/ru' + route));
  const pairs = [];
  for (const es of [...esRoutes].sort()) {
    const expected = ROUTE_PAIRS[es] ?? null;
    const dynamic = /\[(?:\[)?[^/]+/.test(es);
    const direct = expected && ruRoutes.has(expected);
    const catchall = expected && RU_CATCHALL_ROUTES.has(expected);
    const kind = direct ? 'direct' : catchall ? 'catchall' : dynamic ? 'dynamic_unverified' : 'unmapped';
    pairs.push({ es, ru: expected, kind });
  }
  const counts = { direct: 0, catchall: 0, dynamic_unverified: 0, unmapped: 0 };
  pairs.forEach((r) => { counts[r.kind] += 1; });
  return { counts, pairs, ruRouteCount: ruRoutes.size, esRouteCount: esRoutes.size };
}

export function auditLayouts(base = ROOT) {
  const es = readFileSync(join(base, ES_ROOT, 'layout.tsx'), 'utf8');
  const ru = readFileSync(join(base, RU_ROOT, 'layout.tsx'), 'utf8');
  const common = {
    header: es.includes('<Header ') || es.includes('<Header />'),
    footer: es.includes('<Footer ') || es.includes('<Footer />'),
    kia: es.includes('<KiaPublicWidget'),
    languages: es.includes('<LanguageSwitcher'),
    cart: es.includes('<CartSidebar'),
  };
  const ruChecks = {
    header: ru.includes('<Header ') || ru.includes('<Header />'),
    footer: ru.includes('<Footer ') || ru.includes('<Footer />'),
    kia: ru.includes('<KiaPublicWidget'),
    languages: ru.includes('<LanguageSwitcher'),
    cart: ru.includes('<CartSidebar'),
  };
  return Object.entries(common).filter(([k, exists]) => exists && !ruChecks[k])
    .map(([feature]) => ({ feature, status: 'shell_mismatch' }));
}

export function buildParityReport(root = ROOT) {
  const esPaths = walkPages(join(root, ES_ROOT), root);
  const ruPaths = walkPages(join(root, RU_ROOT), root);
  return {
    generatedAt: new Date().toISOString(),
    routes: auditRouteParity(esPaths, ruPaths),
    shellDifferences: auditLayouts(root),
    note: 'A direct or catchall match only proves route availability, not visual/content parity. All unmapped and dynamic routes need editorial review.',
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = buildParityReport();
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  if (process.argv.includes('--strict') && (report.routes.counts.unmapped > 0 || report.shellDifferences.length)) process.exitCode = 1;
}
