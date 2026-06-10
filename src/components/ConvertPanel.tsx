interface ConvertPanelProps {
  canConvert: boolean;
  busy: boolean;
  progress: number;
  progressMessage: string;
  error: string | null;
  hasResult: boolean;
  onConvert: () => void;
  onDownload: () => void;
}

export default function ConvertPanel({
  canConvert,
  busy,
  progress,
  progressMessage,
  error,
  hasResult,
  onConvert,
  onDownload,
}: ConvertPanelProps) {
  return (
    <div className="convert-panel">
      <div className="convert-panel__actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={!canConvert || busy}
          onClick={onConvert}
        >
          {busy ? 'Converting…' : 'Convert'}
        </button>
        {hasResult && (
          <button
            type="button"
            className="btn btn--success"
            onClick={onDownload}
            disabled={busy}
          >
            Download result
          </button>
        )}
      </div>

      {busy && (
        <div className="progress" role="progressbar" aria-valuenow={Math.round(progress * 100)}>
          <div
            className="progress__bar"
            style={{ width: `${Math.max(8, progress * 100)}%` }}
          />
          <span className="progress__label">{progressMessage || 'Working…'}</span>
        </div>
      )}

      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
