import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import PptxGenJS from 'pptxgenjs';
import type { ConversionContext, ConversionResult } from './types';
import {
  markdownToHtmlFragment,
  readText,
  wrapHtmlDocument,
  htmlToPdfBlob,
} from './shared';

/** Markdown -> standalone HTML document. */
export async function markdownToHtml(
  ctx: ConversionContext,
): Promise<ConversionResult> {
  const md = await readText(ctx.file);
  const fragment = markdownToHtmlFragment(md);
  const html = wrapHtmlDocument(ctx.baseName, fragment);
  return {
    blob: new Blob([html], { type: 'text/html;charset=utf-8' }),
    filename: `${ctx.baseName}.html`,
    preview: { kind: 'html', content: fragment },
  };
}

/** Markdown -> PDF (rendered HTML to PDF). */
export async function markdownToPdf(
  ctx: ConversionContext,
): Promise<ConversionResult> {
  const md = await readText(ctx.file);
  ctx.onProgress?.(0.2, 'Rendering Markdown');
  const fragment = markdownToHtmlFragment(md);
  ctx.onProgress?.(0.5, 'Generating PDF');
  const blob = await htmlToPdfBlob(fragment, `${ctx.baseName}.pdf`);
  ctx.onProgress?.(1, 'Done');
  return {
    blob,
    filename: `${ctx.baseName}.pdf`,
    preview: { kind: 'html', content: fragment },
  };
}

/**
 * Markdown -> Word (.docx).
 * A pragmatic line-based mapping: headings, bullet/numbered lists, and
 * paragraphs with inline bold/italic/code emphasis.
 */
export async function markdownToDocx(
  ctx: ConversionContext,
): Promise<ConversionResult> {
  const md = await readText(ctx.file);
  const paragraphs = markdownLinesToParagraphs(md);
  const doc = new Document({
    sections: [{ properties: {}, children: paragraphs }],
  });
  const blob = await Packer.toBlob(doc);
  return {
    blob,
    filename: `${ctx.baseName}.docx`,
    preview: { kind: 'html', content: markdownToHtmlFragment(md) },
  };
}

/** Markdown -> PowerPoint (.pptx), one slide per top-level heading. */
export async function markdownToPptx(
  ctx: ConversionContext,
): Promise<ConversionResult> {
  const md = await readText(ctx.file);
  const blob = await buildPptxFromMarkdown(md, ctx.baseName);
  return { blob, filename: `${ctx.baseName}.pptx` };
}

// ---- helpers -------------------------------------------------------------

const HEADING_LEVELS = [
  HeadingLevel.HEADING_1,
  HeadingLevel.HEADING_2,
  HeadingLevel.HEADING_3,
  HeadingLevel.HEADING_4,
  HeadingLevel.HEADING_5,
  HeadingLevel.HEADING_6,
] as const;

function markdownLinesToParagraphs(md: string): Paragraph[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const paragraphs: Paragraph[] = [];

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.trim() === '') {
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = HEADING_LEVELS[heading[1].length - 1];
      paragraphs.push(
        new Paragraph({
          heading: level,
          children: parseInline(heading[2]),
        }),
      );
      continue;
    }

    const bullet = /^[-*+]\s+(.*)$/.exec(line);
    if (bullet) {
      paragraphs.push(
        new Paragraph({ bullet: { level: 0 }, children: parseInline(bullet[1]) }),
      );
      continue;
    }

    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (numbered) {
      paragraphs.push(
        new Paragraph({
          numbering: { reference: 'md-numbering', level: 0 },
          children: parseInline(numbered[1]),
        }),
      );
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      paragraphs.push(
        new Paragraph({
          style: 'IntenseQuote',
          children: parseInline(quote[1]),
        }),
      );
      continue;
    }

    paragraphs.push(new Paragraph({ children: parseInline(line) }));
  }

  return paragraphs.length ? paragraphs : [new Paragraph('')];
}

/** Parse a subset of inline Markdown (**bold**, *italic*, `code`) into runs. */
function parseInline(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun(text.slice(lastIndex, match.index)));
    }
    const token = match[0];
    if (token.startsWith('**') || token.startsWith('__')) {
      runs.push(new TextRun({ text: token.slice(2, -2), bold: true }));
    } else if (token.startsWith('`')) {
      runs.push(
        new TextRun({ text: token.slice(1, -1), font: 'Consolas' }),
      );
    } else {
      runs.push(new TextRun({ text: token.slice(1, -1), italics: true }));
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    runs.push(new TextRun(text.slice(lastIndex)));
  }
  return runs.length ? runs : [new TextRun(text)];
}

export async function buildPptxFromMarkdown(
  md: string,
  title: string,
): Promise<Blob> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'File Format Converter';

  const slides = splitMarkdownIntoSlides(md, title);
  for (const slide of slides) {
    const s = pptx.addSlide();
    s.background = { color: 'FFFFFF' };
    s.addText(slide.title, {
      x: 0.5,
      y: 0.4,
      w: 12.3,
      h: 1,
      fontSize: 30,
      bold: true,
      color: '4F46E5',
    });
    if (slide.bullets.length) {
      s.addText(
        slide.bullets.map((t) => ({ text: t, options: { bullet: true } })),
        {
          x: 0.7,
          y: 1.6,
          w: 11.9,
          h: 5.4,
          fontSize: 18,
          color: '1F2430',
          valign: 'top',
        },
      );
    }
  }

  // pptxgenjs returns a Blob in the browser when given output: 'blob'.
  const out = (await pptx.write({ outputType: 'blob' })) as Blob;
  return out;
}

interface SlideSpec {
  title: string;
  bullets: string[];
}

function splitMarkdownIntoSlides(md: string, fallbackTitle: string): SlideSpec[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const slides: SlideSpec[] = [];
  let current: SlideSpec | null = null;

  const pushCurrent = () => {
    if (current) slides.push(current);
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      pushCurrent();
      current = { title: heading[2], bullets: [] };
      continue;
    }

    if (!current) {
      current = { title: fallbackTitle, bullets: [] };
    }
    const bullet = /^[-*+]\s+(.*)$/.exec(line) || /^\d+[.)]\s+(.*)$/.exec(line);
    current.bullets.push(stripInline(bullet ? bullet[1] : line));
  }
  pushCurrent();

  return slides.length ? slides : [{ title: fallbackTitle, bullets: [] }];
}

function stripInline(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
}
