import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildKiaCaseQuickActionPresentation,
  buildKiaCaseQuickActionSuggestions,
  detectKiaCaseQuickAction,
} from '@/lib/ai/kia/kia-case-quick-actions';
import type { KiaContext } from '@/lib/ai/kia/kia-context-builder';
import type { KiaToolResult } from '@/lib/ai/kia/kia-tool-definitions';

const caseItem: KiaContext['cases'][number] = {
  id: 'ef9f871a-21bd-4cbc-ad2c-8040f0754e46',
  serviceName: 'Nacionalidad menor',
  serviceSlug: 'nacionalidad-espanola-menor-nacido-en-espana',
  status: 'pendiente_cliente',
  nextAction: 'Firmar de nuevo solo la página 5 en el bloque Representante legal.',
};

const documentsResult: KiaToolResult = {
  toolName: 'get_case_documents',
  ok: true,
  result: {
    documents: [
      {
        id: 'obsolete',
        title: 'OBSOLETA — NO FIRMAR',
        state: 'rechazado',
        download_url: '/api/documents/obsolete/download?redirect=1',
      },
      {
        id: 'current',
        title: 'Página 5 — corregir firmas',
        state: 'pendiente',
        download_url: '/api/documents/current/download?redirect=1',
        case_url: '/dashboard/expedientes/ef9f871a-21bd-4cbc-ad2c-8040f0754e46',
      },
    ],
  },
};

describe('KIA contextual case quick actions', () => {
  it('maps Spanish and Russian quick replies to distinct actions', () => {
    expect(detectKiaCaseQuickAction('¿Qué tengo que hacer ahora?')).toBe('next_step');
    expect(detectKiaCaseQuickAction('¿Qué documentos faltan?')).toBe('documents');
    expect(detectKiaCaseQuickAction('Comprobar estado')).toBe('status');
    expect(detectKiaCaseQuickAction('Abrir expediente')).toBe('open_case');
    expect(detectKiaCaseQuickAction('Revisión humana')).toBe('human_review');

    expect(detectKiaCaseQuickAction('Что сейчас нужно сделать?')).toBe('next_step');
    expect(detectKiaCaseQuickAction('Какие документы нужны?')).toBe('documents');
    expect(detectKiaCaseQuickAction('Проверить статус')).toBe('status');
    expect(detectKiaCaseQuickAction('Открыть дело')).toBe('open_case');
    expect(detectKiaCaseQuickAction('Проверка специалистом')).toBe('human_review');
    expect(detectKiaCaseQuickAction('¿Qué documentos necesito para constituir otra empresa?')).toBeNull();
    expect(detectKiaCaseQuickAction('¿Cuál es el siguiente paso para otra solicitud?')).toBeNull();
    expect(detectKiaCaseQuickAction('Мне нужны документы для другой фирмы')).toBeNull();
  });

  it('uses the canonical next action instead of repeating generic case status', () => {
    const presentation = buildKiaCaseQuickActionPresentation({
      action: 'next_step',
      locale: 'es',
      caseItem,
      documentToolResult: documentsResult,
    });
    expect(presentation?.reply).toContain(caseItem.nextAction);
    expect(presentation?.artifacts).toEqual(expect.arrayContaining([
      expect.objectContaining({ url: `/dashboard/expedientes/${caseItem.id}` }),
      expect.objectContaining({ url: '/cita?tipo=consulta-inicial' }),
    ]));
    expect(JSON.stringify(presentation?.artifacts)).not.toContain('obsolete');
    expect(JSON.stringify(presentation?.artifacts)).not.toContain('/api/documents/current/');
  });

  it('falls back to the expediente when the current document has no downloadable file', () => {
    const noFileResult: KiaToolResult = {
      toolName: 'get_case_documents',
      ok: true,
      result: {
        checklist_available: true,
        missing_requirements: ['Página 5 firmada por ambos progenitores'],
        documents: [{
          id: 'current-no-file',
          title: 'Página 5 pendiente de corregir',
          state: 'pendiente',
          download_url: null,
          case_url: `/dashboard/expedientes/${caseItem.id}`,
        }],
      },
    };
    const presentation = buildKiaCaseQuickActionPresentation({
      action: 'documents',
      locale: 'es',
      caseItem,
      documentToolResult: noFileResult,
    });
    expect(presentation?.reply).toContain('Página 5 firmada por ambos progenitores');
    expect(presentation?.artifacts[0]).toMatchObject({
      type: 'link',
      url: `/dashboard/expedientes/${caseItem.id}#documentos`,
    });
  });

  it('keeps delegated preview navigation inside admin while allowing authorized document download', () => {
    const noFileResult: KiaToolResult = {
      toolName: 'get_case_documents',
      ok: true,
      result: {
        checklist_available: true,
        missing_requirements: [],
        documents: [{
          id: 'current-no-file',
          title: 'Página 5 pendiente',
          state: 'pendiente',
          download_url: null,
          case_url: `/dashboard/expedientes/${caseItem.id}`,
        }],
      },
    };
    const presentation = buildKiaCaseQuickActionPresentation({
      action: 'documents',
      locale: 'ru',
      caseItem,
      documentToolResult: noFileResult,
      staffPreview: true,
    });
    expect(presentation?.artifacts[0]).toMatchObject({
      url: `/admin/expedientes/${caseItem.id}#documentos`,
    });
  });

  it('does not turn a failed or absent checklist lookup into a missing-document claim', () => {
    for (const documentToolResult of [undefined, { toolName: 'get_case_documents', ok: false }]) {
      expect(buildKiaCaseQuickActionPresentation({
        action: 'documents', locale: 'es', caseItem, documentToolResult,
      })).toBeNull();
    }
  });

  it('suppresses an untranslated Spanish next action in a Russian reply', () => {
    const presentation = buildKiaCaseQuickActionPresentation({ action: 'next_step', locale: 'ru', caseItem });
    expect(presentation?.reply).not.toContain('Firmar de nuevo');
  });

  it('offers different next actions after each case action', () => {
    expect(buildKiaCaseQuickActionSuggestions('status', 'es')).toEqual([
      '¿Qué hago ahora?',
      '¿Qué documentos faltan?',
      'Abrir expediente',
    ]);
    expect(buildKiaCaseQuickActionSuggestions('documents', 'ru')).toContain('Проверка специалистом');
    expect(buildKiaCaseQuickActionSuggestions('human_review', 'es')).toContain('Abrir expediente');
  });
});

describe('KIA quick-action integration contracts', () => {
  const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

  it('wires quick actions into the canonical dashboard endpoint', () => {
    const route = source('app/api/ai/kia/route.ts');
    expect(route).toContain('detectKiaCaseQuickAction(message)');
    expect(route).toContain("copilotPolicy.toolNames.includes('get_case_documents')");
    expect(route).toContain('buildKiaCaseQuickActionPresentation');
    expect(route).toContain('buildKiaCaseQuickActionSuggestions');
    expect(route).toContain('caseQuickActionPresentation?.reply ?? result.userMessage');
  });

  it('uses the same contextual case actions in verified Telegram', () => {
    const telegram = source('app/api/webhooks/telegram/route.ts');
    expect(telegram).toContain('detectKiaCaseQuickAction(message)');
    expect(telegram).toContain('buildKiaCaseQuickActionPresentation');
    expect(telegram).toContain('buildKiaCaseQuickActionSuggestions');
    expect(telegram).toContain("telegramPolicy.toolNames.includes('get_case_documents')");
    expect(telegram).toContain('caseQuickActionPresentation?.reply ?? result.userMessage');
  });

  it('returns case document navigation without leaking storage paths', () => {
    const executor = source('lib/ai/kia/kia-tool-executor.ts');
    expect(executor).toContain("download?redirect=1");
    expect(executor).toContain('case_url:');
    expect(executor).not.toContain('download_url: doc.file_path,');
    expect(executor).toContain(".is('replaced_by', null)");
  });

  it('keeps document redirect authenticated and ownership checked', () => {
    const route = source('app/api/documents/[id]/download/route.ts');
    expect(route).toContain("doc.client_id !== user.id");
    expect(route).toContain("searchParams.get('redirect') === '1'");
    expect(route).toContain('NextResponse.redirect(signedData.signedUrl)');
  });
});
