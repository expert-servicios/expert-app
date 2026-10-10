import type { ReactNode } from 'react';

function inline(text: string): ReactNode[] {
  const result: ReactNode[] = [];
  const pattern = /(\*\*([^*\n]+)\*\*|(?<![\w*])\*([^*\n\s](?:[^*\n]*?[^*\n\s])?)\*(?![\w*])|`([^`\n]+)`)/g;
  let offset = 0;
  for (const m of text.matchAll(pattern)) {
    const index = m.index ?? 0;
    if (index > offset) result.push(text.slice(offset, index));
    const key = `${index}-${m[0].length}`;
    if (m[2]) result.push(<strong key={key} className="font-semibold">{m[2]}</strong>);
    else if (m[3]) result.push(<em key={key}>{m[3]}</em>);
    else if (m[4]) result.push(<code key={key} className="break-words rounded bg-black/5 px-1 py-0.5 text-[.9em]">{m[4]}</code>);
    offset = index + m[0].length;
  }
  if (offset < text.length) result.push(text.slice(offset));
  return result;
}

/** Safe restricted markdown: only paragraphs, strong/emphasis, inline code and lists.
 * No raw HTML interpretation, images, active links, custom attributes or scripts.
 */
export function KiaReadableMessage({ text }: { text: string }) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let paragraphs: string[] = [];
  let listItems: { ordered: boolean; content: string; number?: number }[] = [];
  const flushParagraph = () => {
    if (!paragraphs.length) return;
    blocks.push(<p key={`p-${blocks.length}`} className="whitespace-pre-line leading-relaxed">{inline(paragraphs.join('\n'))}</p>);
    paragraphs = [];
  };
  const flushList = () => {
    if (!listItems.length) return;
    const ordered = listItems[0].ordered;
    const children = listItems.map((x, i) => <li key={i} value={ordered ? x.number : undefined} className="pl-0.5">{inline(x.content)}</li>);
    blocks.push(ordered
      ? <ol key={`l-${blocks.length}`} className="list-decimal space-y-1 pl-5">{children}</ol>
      : <ul key={`l-${blocks.length}`} className="list-disc space-y-1 pl-5">{children}</ul>);
    listItems = [];
  };
  for (const line of lines) {
    const match = /^\s*(?:([-•])\s+|([1-9]\d?)[.)]\s+)(.+)$/.exec(line);
    if (match) {
      flushParagraph();
      const ordered = Boolean(match[2]);
      if (listItems.length && listItems[0].ordered !== ordered) flushList();
      listItems.push({ ordered, content: match[3], number: ordered ? Number(match[2]) : undefined });
    } else if (!line.trim()) {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraphs.push(line);
    }
  }
  flushParagraph();
  flushList();
  return <div className="min-w-0 break-words space-y-2.5">{blocks}</div>;
}
