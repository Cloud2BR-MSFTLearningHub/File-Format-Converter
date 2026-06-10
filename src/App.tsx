import { useCallback, useMemo, useState } from 'react';
import { saveAs } from 'file-saver';
import Header from './components/Header';
import Dropzone from './components/Dropzone';
import FormatSelector from './components/FormatSelector';
import ConvertPanel from './components/ConvertPanel';
import Preview from './components/Preview';
import Footer from './components/Footer';
import { convert, detectFormat, FORMATS, getRoutes } from './converters';
import type { ConversionResult, FormatId } from './converters/types';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [target, setTarget] = useState<FormatId | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);

  const sourceFormat = useMemo<FormatId | null>(
    () => (file ? detectFormat(file.name) : null),
    [file],
  );
  const routes = useMemo(
    () => (sourceFormat ? getRoutes(sourceFormat) : []),
    [sourceFormat],
  );

  const reset = useCallback(() => {
    setTarget(null);
    setError(null);
    setResult(null);
    setProgress(0);
    setProgressMessage('');
  }, []);

  const handleFile = useCallback(
    (next: File) => {
      reset();
      setFile(next);
      const fmt = detectFormat(next.name);
      const available = fmt ? getRoutes(fmt) : [];
      setTarget(available[0]?.target ?? null);
      if (!fmt || !available.length) {
        setError(
          `"${next.name}" isn't a supported input type. Try Markdown, Word, PDF, HTML, text, CSV, or JSON.`,
        );
      }
    },
    [reset],
  );

  const handleClear = useCallback(() => {
    setFile(null);
    reset();
  }, [reset]);

  const handleConvert = useCallback(async () => {
    if (!file || !target) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress(0);
    setProgressMessage('Starting…');
    try {
      const res = await convert(file, target, (fraction, message) => {
        setProgress(fraction);
        if (message) setProgressMessage(message);
      });
      setResult(res);
      setProgress(1);
      setProgressMessage('Done');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [file, target]);

  const handleDownload = useCallback(() => {
    if (result) saveAs(result.blob, result.filename);
  }, [result]);

  return (
    <div className="app">
      <Header />

      <main className="app__main">
        <section className="hero">
          <h1 className="hero__title">
            Convert your files, <span>right in your browser</span>
          </h1>
          <p className="hero__subtitle">
            Markdown, Word, PDF, HTML, text, CSV and JSON — fast, free, and
            private. Nothing is uploaded to a server.
          </p>
        </section>

        <section className="workspace card">
          <div className="workspace__step">
            <span className="step-badge">1</span>
            <h2 className="workspace__heading">Choose a file</h2>
          </div>
          <Dropzone file={file} onFile={handleFile} onClear={handleClear} />

          {sourceFormat && (
            <>
              <div className="workspace__step">
                <span className="step-badge">2</span>
                <h2 className="workspace__heading">Pick a target format</h2>
              </div>
              <FormatSelector
                sourceLabel={FORMATS[sourceFormat].label}
                routes={routes}
                selected={target}
                onSelect={setTarget}
              />

              <div className="workspace__step">
                <span className="step-badge">3</span>
                <h2 className="workspace__heading">Convert &amp; download</h2>
              </div>
              <ConvertPanel
                canConvert={!!target}
                busy={busy}
                progress={progress}
                progressMessage={progressMessage}
                error={error}
                hasResult={!!result}
                onConvert={handleConvert}
                onDownload={handleDownload}
              />
            </>
          )}

          {!sourceFormat && error && (
            <div className="alert alert--error" role="alert">
              {error}
            </div>
          )}
        </section>

        {result && (
          <section className="card">
            <Preview result={result} />
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
