import mammoth from 'mammoth/mammoth.browser';
import TurndownService from 'turndown';
import type { ConversionContext, ConversionResult } from './types';
import {
  htmlToPdfBlob,
  readArrayBuffer,
  wrapHtmlDocument,
} from './shared';

function hasZipSignature(bytes: Uint8Array): boolean {
  // ZIP local file header or empty/spanned archive marker.
  const b0 = bytes[0];
  const b1 = bytes[1];
  const b2 = bytes[2];
  const b3 = bytes[3];
  return (
    b0 === 0x50 &&
    b1 === 0x4b &&
    ((b2 === 0x03 && b3 === 0x04) ||
      (b2 === 0x05 && b3 === 0x06) ||
      (b2 === 0x07 && b3 === 0x08))
  );
}

function hasLegacyDocSignature(bytes: Uint8Array): boolean {
  // Old binary .doc / OLE compound file signature.
  return (
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0
  );
}

async function docxToHtmlFragment(file: File): Promise<string> {
  const arrayBuffer = await readArrayBuffer(file);
  const bytes = new Uint8Array(arrayBuffer.slice(0, 8));

  if (hasLegacyDocSignature(bytes)) {
    throw new Error(
      'This file appears to be legacy .doc (binary) or password-protected Word format. Please re-save it as an unprotected .docx and try again.',
    );
  }

  if (!hasZipSignature(bytes)) {
    throw new Error(
      'Invalid DOCX container. Please ensure the file is a real .docx (Open XML) document.',
    );
  }

  try {
    const { value } = await mammoth.convertToHtml({ arrayBuffer });
    return value;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/end of central directory|zip file/i.test(message)) {
      throw new Error(
        'Unable to read this Word file. It may be corrupted, partially downloaded, or not a valid .docx package.',
      );
    }
    throw err;
  }
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
