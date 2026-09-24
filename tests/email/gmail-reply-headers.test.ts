import { describe, expect, it } from 'vitest';
import { gmailReplyHeaders } from '@/lib/email/reply-headers';
describe('Gmail native replies', () => {
  it('preserves the real subject and reply ancestry', () => {
    expect(gmailReplyHeaders([{ name: 'Message-ID', value: '<latest@example.test>' },
      { name: 'References', value: '<first@example.test> <latest@example.test>' },
      { name: 'Subject', value: 'Expediente · Вопрос' }])).toEqual({
      subject: 'Expediente · Вопрос', inReplyTo: '<latest@example.test>',
      references: '<first@example.test> <latest@example.test>',
    });
  });
  it('rejects missing anchors and injected headers', () => {
    expect(() => gmailReplyHeaders([])).toThrow();
    expect(() => gmailReplyHeaders([{ name: 'Message-ID', value: '<good@example.test>' },
      { name: 'Subject', value: 'Subject\r\nBcc: unexpected@example.test' }])).toThrow();
  });
});
