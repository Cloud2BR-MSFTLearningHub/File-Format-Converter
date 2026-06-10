import { marked } from 'marked';

/** Read a File as UTF-8 text. */
export async function readText(file: File): Promise<string> {
  return file.text();
}

/** Read a File as an ArrayBuffer. */
export async function readArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

/** Escape a string for safe inclusion in HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Render Markdown to an HTML fragment. */
export function markdownToHtmlFragment(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

/** Wrap an HTML fragment in a styled, standalone document. */
export function wrapHtmlDocument(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light; }
  body {
    font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.65;
    color: #1f2430;
    max-width: 820px;
    margin: 40px auto;
    padding: 0 24px;
  }
  h1, h2, h3 { line-height: 1.25; }
  h1 { border-bottom: 2px solid #eceef3; padding-bottom: .3em; }
  code {
    background: #f3f4f8;
    padding: .15em .35em;
    border-radius: 4px;
    font-size: .92em;
  }
  pre {
    background: #1f2430;
    color: #f5f6fa;
    padding: 16px;
    border-radius: 10px;
    overflow: auto;
  }
  pre code { background: transparent; padding: 0; color: inherit; }
  blockquote {
    border-left: 4px solid #6366f1;
    margin: 1em 0;
    padding: .2em 1em;
    color: #4b5161;
    background: #f7f8fb;
  }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #e3e6ee; padding: 8px 12px; text-align: left; }
  th { background: #f3f4f8; }
  img { max-width: 100%; }
  a { color: #4f46e5; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

/**
 * Render an HTML fragment to a PDF Blob using html2pdf.js.
 * Runs fully in-browser via html2canvas + jsPDF.
 */
export async function htmlToPdfBlob(
  bodyHtml: string,
  filename: string,
): Promise<Blob> {
  // html2pdf.js relies on the DOM, so build a detached, off-screen element.
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '794px'; // ~A4 width at 96dpi
  container.style.background = '#ffffff';
  container.style.padding = '40px';
  container.style.color = '#1f2430';
  container.style.fontFamily =
    '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  container.style.lineHeight = '1.6';
  container.innerHTML = bodyHtml;
  document.body.appendChild(container);

  try {
    const { default: html2pdf } = await import('html2pdf.js');
    const worker = html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .from(container);

    const blob: Blob = await worker.outputPdf('blob');
    return blob;
  } finally {
    document.body.removeChild(container);
  }
}
