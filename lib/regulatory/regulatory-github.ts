type RegulatoryProposal = {
  changeId: string;
  sourceTitle: string;
  sourceUrl: string;
  severity: string;
  changeType: string;
  summary: string;
  effectiveDate: string | null;
  knownDependencies: Array<Record<string, unknown>>;
  dependencyHints: Array<Record<string, unknown>>;
  proposedFiles: string[];
  valueUpdates: Array<Record<string, unknown>>;
};

const DEFAULT_REPO = 'expert-servicios/expert-app';

function githubConfig() {
  const token = process.env.REGULATORY_GITHUB_TOKEN?.trim();
  if (!token) return null;

  const fullRepo = process.env.REGULATORY_GITHUB_REPO?.trim() || DEFAULT_REPO;
  const [owner, repo] = fullRepo.split('/');
  if (!owner || !repo) throw new Error('REGULATORY_GITHUB_REPO must use owner/repo format');

  return {
    token,
    owner,
    repo,
    base: process.env.REGULATORY_GITHUB_BASE_BRANCH?.trim() || 'main',
  };
}

async function gh(url: string, init: RequestInit, token: string) {
  const response = await fetch(url, {
    ...init,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data?.message === 'string' ? data.message : `GitHub HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

function proposalMarkdown(input: RegulatoryProposal) {
  return `# Propuesta regulatoria ${input.changeId}

> Generada automáticamente por KIA Regulatory Monitor. **No implica aprobación ni publicación.**

## Fuente oficial

- **Fuente:** ${input.sourceTitle}
- **URL:** ${input.sourceUrl}
- **Severidad:** ${input.severity}
- **Tipo:** ${input.changeType}
- **Vigencia detectada:** ${input.effectiveDate ?? 'pendiente de revisión'}

## Resumen KIA

${input.summary}

## Dependencias conocidas

\`\`\`json
${JSON.stringify(input.knownDependencies, null, 2)}
\`\`\`

## Dependencias sugeridas por KIA

\`\`\`json
${JSON.stringify(input.dependencyHints, null, 2)}
\`\`\`

## Archivos sugeridos

${input.proposedFiles.length ? input.proposedFiles.map((file) => `- \`${file}\``).join('\n') : '- KIA no ha identificado archivos concretos.'}

## Valores propuestos

\`\`\`json
${JSON.stringify(input.valueUpdates, null, 2)}
\`\`\`

## Gate humano obligatorio

- [ ] Verificar la fuente oficial.
- [ ] Confirmar vigencia y población/supuestos afectados.
- [ ] Revisar valores numéricos.
- [ ] Revisar landing, blog, KB, KIA, viability y blueprints afectados.
- [ ] Ejecutar tests.
- [ ] No fusionar si existe incertidumbre jurídica.
`;
}

export async function createRegulatoryProposalPullRequest(input: RegulatoryProposal) {
  const config = githubConfig();
  if (!config) return null;

  const api = `https://api.github.com/repos/${config.owner}/${config.repo}`;
  const baseRef = await gh(`${api}/git/ref/heads/${encodeURIComponent(config.base)}`, { method: 'GET' }, config.token);
  const baseSha = baseRef?.object?.sha;
  if (typeof baseSha !== 'string') throw new Error('Cannot resolve GitHub base SHA');

  const safeId = input.changeId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 36);
  const branch = `regulatory/change-${safeId}`;

  try {
    await gh(`${api}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
    }, config.token);
  } catch (error) {
    if (!(error instanceof Error) || !/Reference already exists/i.test(error.message)) throw error;
  }

  const content = proposalMarkdown(input);
  const path = `docs/regulatory-proposals/${safeId}.md`;
  await gh(`${api}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `docs: add regulatory proposal ${safeId}`,
      content: Buffer.from(content, 'utf8').toString('base64'),
      branch,
    }),
  }, config.token);

  const pr = await gh(`${api}/pulls`, {
    method: 'POST',
    body: JSON.stringify({
      title: `regulatory: revisar ${input.sourceTitle} [${input.severity}]`,
      head: branch,
      base: config.base,
      body: `Propuesta generada por KIA Regulatory Monitor para el cambio \`${input.changeId}\`. Revisión humana obligatoria antes de modificar producción.`,
      draft: true,
    }),
  }, config.token);

  return {
    number: typeof pr?.number === 'number' ? pr.number : undefined,
    url: typeof pr?.html_url === 'string' ? pr.html_url : undefined,
  };
}
