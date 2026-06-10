import TurndownService from 'turndown';
import type { ConversionContext, ConversionResult } from './types';
import { readText } from './shared';

/** HTML -> Markdown via turndown. */
export async function htmlToMarkdown(
  ctx: ConversionContext,
): Promise<ConversionResult> {
  const html = await readText(ctx.file);
  const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html);
  const fragment = bodyMatch ? bodyMatch[1] : html;
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
