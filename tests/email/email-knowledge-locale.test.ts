import { describe, expect, it } from 'vitest';
import {
  keepEmailKnowledgeLinksInLocale,
  resolveEmailContentLocale,
} from '@/lib/email/email-knowledge-locale';

describe('email knowledge link locale', () => {
  it('removes Spanish EXPERT guides from Russian emails but keeps Russian resources', () => {
    const html = [
      '<p>Здравствуйте! Подробная инструкция для вашего дела.</p>',
      '<a href="https://expertconsulting.es/docs/guia-es">Guía ES</a>',
      '<a href="https://expertconsulting.es/ru/docs/instrukciya">Инструкция RU</a>',
      '<a href="https://expertconsulting.es/blog/articulo-es">Artículo ES</a>',
      '<a href="https://expertconsulting.es/ru/blog/statya">Статья RU</a>',
    ].join(' ');

    const result = keepEmailKnowledgeLinksInLocale({
      subject: 'Следующий шаг по вашему делу',
      html,
      metadata: { locale: 'ru' },
    });

    expect(result).not.toContain('href="https://expertconsulting.es/docs/guia-es"');
    expect(result).not.toContain('href="https://expertconsulting.es/blog/articulo-es"');
    expect(result).toContain('href="https://expertconsulting.es/ru/docs/instrukciya"');
    expect(result).toContain('href="https://expertconsulting.es/ru/blog/statya"');
  });

  it('keeps official external Spanish-language sources in Russian emails', () => {
    const html = '<p>Официальный источник: <a href="https://www.boe.es/buscar/act.php?id=X">BOE</a></p>';
    const result = keepEmailKnowledgeLinksInLocale({
      subject: 'Официальный источник',
      html,
      metadata: { language: 'ru' },
    });
    expect(result).toContain('href="https://www.boe.es/buscar/act.php?id=X"');
  });

  it('does the inverse for Spanish emails', () => {
    const html = [
      '<a href="/docs/guia-es">Guía ES</a>',
      '<a href="/ru/docs/instrukciya">Инструкция RU</a>',
    ].join(' ');
    const result = keepEmailKnowledgeLinksInLocale({
      subject: 'Siguiente paso',
      html,
      metadata: { locale: 'es' },
    });
    expect(result).toContain('href="/docs/guia-es"');
    expect(result).not.toContain('href="/ru/docs/instrukciya"');
  });

  it('can infer Russian when legacy callers do not pass locale metadata', () => {
    expect(resolveEmailContentLocale({
      subject: 'Документы по вашему делу',
      html: '<p>Здравствуйте. Мы получили документы и проверяем следующий шаг по вашему делу. Дополнительно отправлять ничего не нужно.</p>',
    })).toBe('ru');
  });
});
