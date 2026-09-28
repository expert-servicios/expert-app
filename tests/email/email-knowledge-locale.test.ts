import { describe, expect, it } from 'vitest';
import {
  keepEmailKnowledgeContentInLocale,
  keepEmailKnowledgeLinksInLocale,
  keepEmailKnowledgeTextLinksInLocale,
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

  it('filters knowledge index routes too', () => {
    const html = [
      '<a href="https://expertconsulting.es/docs?tema=fiscal">Docs ES</a>',
      '<a href="https://expertconsulting.es/blog">Blog ES</a>',
      '<a href="https://expertconsulting.es/ru/docs">Docs RU</a>',
    ].join(' ');

    const result = keepEmailKnowledgeLinksInLocale({
      subject: 'Материалы',
      html,
      metadata: { preferred_language: 'ru' },
    });

    expect(result).not.toContain('href="https://expertconsulting.es/docs?tema=fiscal"');
    expect(result).not.toContain('href="https://expertconsulting.es/blog"');
    expect(result).toContain('href="https://expertconsulting.es/ru/docs"');
  });

  it('removes wrong-locale bare knowledge URLs from visible HTML text without touching attributes', () => {
    const html = [
      '<p>Инструкция: https://expertconsulting.es/docs/guia-es.</p>',
      '<p>Русская версия: https://expertconsulting.es/ru/docs/instrukciya.</p>',
      '<img src="https://expertconsulting.es/docs/image.png" alt="decorative">',
    ].join('');

    const result = keepEmailKnowledgeLinksInLocale({
      subject: 'Документы',
      html,
      metadata: { locale: 'ru' },
    });

    expect(result).not.toContain('Инструкция: https://expertconsulting.es/docs/guia-es');
    expect(result).toContain('https://expertconsulting.es/ru/docs/instrukciya');
    expect(result).toContain('src="https://expertconsulting.es/docs/image.png"');
  });

  it('filters the plain-text alternative using the same locale', () => {
    const text = 'Подробнее: https://expertconsulting.es/docs/guia-es\nRU: https://expertconsulting.es/ru/docs/instrukciya';
    const result = keepEmailKnowledgeTextLinksInLocale({
      subject: 'Следующий шаг',
      text,
      metadata: { locale: 'ru' },
    });

    expect(result).not.toContain('https://expertconsulting.es/docs/guia-es');
    expect(result).toContain('https://expertconsulting.es/ru/docs/instrukciya');
  });

  it('filters HTML and text together', () => {
    const result = keepEmailKnowledgeContentInLocale({
      subject: 'Следующий шаг',
      html: '<p>https://expertconsulting.es/docs/guia-es</p>',
      text: 'https://expertconsulting.es/docs/guia-es',
      metadata: { locale: 'ru' },
    });
    expect(result.html).not.toContain('https://expertconsulting.es/docs/guia-es');
    expect(result.text).not.toContain('https://expertconsulting.es/docs/guia-es');
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
