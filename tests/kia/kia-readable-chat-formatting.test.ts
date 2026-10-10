import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { KiaReadableMessage } from '@/components/kia/KiaReadableMessage';
import { createElement } from 'react';
describe('KIA chat readable text', () => {
  const render = (text: string) => renderToStaticMarkup(createElement(KiaReadableMessage,{text}));
  it('renders paragraph spacing, bold, italics and lists', () => {
    const html = render('Primer párrafo con **dato importante**.\n\nSegundo párrafo.\n\n- Paso uno\n- Paso dos\n\n1. Primero\n2. Después');
    expect(html).toContain('<strong');
    expect(html).toContain('dato importante</strong>');
    expect(html).toContain('<p');
    expect(html).toContain('<ul');
    expect(html).toContain('<ol');
  });
  it('escapes HTML and does not render links or injected attributes', () => {
    const html = render('<script>alert(1)</script> **bien** [click](javascript:alert(1)) <img src=x onerror=alert(1)>');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<a ');
    expect(html).toContain('&lt;script&gt;');
  });
  it('preserves arithmetic asterisks and ordered list numbering', () => {
    const html = render('2 * 3 * 4 = 24\n\n3. Tercer paso\n4. Cuarto paso');
    expect(html).toContain('2 * 3 * 4 = 24');
    expect(html).toContain('value="3"');
    expect(html).toContain('value="4"');
  });
  it('does not mistake tax form numbers for steps', () => {
    const html = render('303. Declaración trimestral');
    expect(html).toContain('303. Declaración trimestral');
    expect(html).not.toContain('<ol');
  });
  it('renders existing plain responses unchanged as text', () => {
    expect(render('Una consulta normal sin marcas')).toContain('Una consulta normal sin marcas');
  });
});