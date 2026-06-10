import mammoth from 'mammoth';
import TurndownService from 'turndown';
import type { ConversionContext, ConversionResult } from './types';
import {
  htmlToPdfBlob,
  readArrayBuffer,
  wrapHtmlDocument,
} from './shared';

async function docxToHtmlFragment(file: File): Promise<string> {
  const arrayBuffer = await readArrayBuffer(file);
  const { value } = await mammoth.convertToHtml({ arrayBuffer });
  return value;
}

/** Word (.docx) -> standalone HTML document. */
export async function docxToHtml(
  ctx: ConversionContext,
): Promise<ConversionResult> {
  const fragment = await docxToHtmlFragment(ctx.file);
  const html = wrapHtmlDocument(ctx.baseName, fragment);
  return {
    blob: new Blob([html], { type: 'text/html;charset=utf-8' }),
    filename: `${ctx.baseName}.html`,
    preview: { kind: 'html', content: fragment },
  };
}

/** Word (.docx) -> Markdown. */
export async function docxToMarkdown(
  ctx: ConversionContext,
): Promise<ConversionResult> {
  ctx.onProgress?.(0.3, 'Reading document');
  const fragment = await docxToHtmlFragment(ctx.file);
  ctx.onProgress?.(0.7, 'Converting to Markdown');
  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  });
  const markdown = turndown.turndown(fragment);
  return {
    blob: new Blob([markdown], { type: 'text/markdown;charset=utf-8' }),
    filename: `${ctx.baseName}.md`,
    preview: { kind: 'text', content: markdown },
  };
}

/** Word (.docx) -> PDF. */
export async function docxToPdf(
  ctx: ConversionContext,
): Promise<ConversionResult> {
  ctx.onProgress?.(0.3, 'Reading document');
  const fragment = await docxToHtmlFragment(ctx.file);
  ctx.onProgress?.(0.6, 'Generating PDF');
  const blob = await htmlToPdfBlob(fragment, `${ctx.baseName}.pdf`);
  ctx.onProgress?.(1, 'Done');
  return {
    blob,
    filename: `${ctx.baseName}.pdf`,
    preview: { kind: 'html', content: fragment },
  };
}
