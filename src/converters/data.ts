import Papa from 'papaparse';
import type { ConversionContext, ConversionResult } from './types';
import { readText } from './shared';

/** CSV -> JSON (array of row objects using the header row as keys). */
export async function csvToJson(
  ctx: ConversionContext,
): Promise<ConversionResult> {
  const text = await readText(ctx.file);
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  if (parsed.errors.length) {
    throw new Error(`CSV parse error: ${parsed.errors[0].message}`);
  }
  const json = JSON.stringify(parsed.data, null, 2);
  return {
    blob: new Blob([json], { type: 'application/json;charset=utf-8' }),
    filename: `${ctx.baseName}.json`,
    preview: { kind: 'text', content: json },
  };
}

/** JSON -> CSV. Accepts an array of objects (or a single object). */
export async function jsonToCsv(
  ctx: ConversionContext,
): Promise<ConversionResult> {
  const text = await readText(ctx.file);
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new Error(
      `Invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  const rows = Array.isArray(data) ? data : [data];
  const csv = Papa.unparse(rows as Record<string, unknown>[]);
  return {
    blob: new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    filename: `${ctx.baseName}.csv`,
    preview: { kind: 'text', content: csv },
  };
}
