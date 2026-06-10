import type { ConversionContext, ConversionResult } from './types';
import {
  escapeHtml,
  htmlToPdfBlob,
  readText,
  wrapHtmlDocument,
} from './shared';
import { buildPptxFromMarkdown } from './markdown';

/** Plain text -> Markdown (passthrough; text is valid Markdown). */
export async function textToMarkdown(
  ctx: ConversionContext,
): Promise<ConversionResult> {
  const text = await readText(ctx.file);
  return {
    blob: new Blob([text], { type: 'text/markdown;charset=utf-8' }),
    filename: `${ctx.baseName}.md`,
    preview: { kind: 'text', content: text },
  };
}

/** Plain text -> HTML (preserves line breaks in a <pre> block). */
export async function textToHtml(
  ctx: ConversionContext,
): Promise<ConversionResult> {
  const text = await readText(ctx.file);
  const fragment = `<pre style="white-space:pre-wrap;word-wrap:break-word;font-family:inherit">${escapeHtml(
    text,
  )}</pre>`;
  const html = wrapHtmlDocument(ctx.baseName, fragment);
  return {
    blob: new Blob([html], { type: 'text/html;charset=utf-8' }),
    filename: `${ctx.baseName}.html`,
    preview: { kind: 'html', content: fragment },
  };
}

/** Plain text -> PDF. */
export async function textToPdf(
  ctx: ConversionContext,
): Promise<ConversionResult> {
  const text = await readText(ctx.file);
  const fragment = `<pre style="white-space:pre-wrap;word-wrap:break-word;font-family:inherit">${escapeHtml(
    text,
  )}</pre>`;
  ctx.onProgress?.(0.5, 'Generating PDF');
  const blob = await htmlToPdfBlob(fragment, `${ctx.baseName}.pdf`);
  return {
    blob,
    filename: `${ctx.baseName}.pdf`,
    preview: { kind: 'text', content: text },
  };
}

/** Plain text -> PowerPoint (treats the text as Markdown for slide splitting). */
export async function textToPptx(
  ctx: ConversionContext,
): Promise<ConversionResult> {
  const text = await readText(ctx.file);
  const blob = await buildPptxFromMarkdown(text, ctx.baseName);
  return { blob, filename: `${ctx.baseName}.pptx` };
}

/** HTML -> Markdown is handled in docx.ts via turndown; here HTML -> PDF. */
export async function htmlToPdf(
  ctx: ConversionContext,
): Promise<ConversionResult> {
  const html = await readText(ctx.file);
  // Strip the outer document wrapper if present; keep body contents.
  const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html);
  const fragment = bodyMatch ? bodyMatch[1] : html;
  ctx.onProgress?.(0.5, 'Generating PDF');
  const blob = await htmlToPdfBlob(fragment, `${ctx.baseName}.pdf`);
  return {
    blob,
    filename: `${ctx.baseName}.pdf`,
    preview: { kind: 'html', content: fragment },
  };
}
