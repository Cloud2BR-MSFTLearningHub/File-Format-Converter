export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <path
                d="M9 3h5l4 4v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                fill="rgba(255,255,255,.22)"
                stroke="#fff"
                strokeWidth="1.4"
              />
              <path
                d="M10.5 12h3m0 0-1.2-1.2M13.5 12l-1.2 1.2"
                stroke="#fff"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="brand__text">
            <span className="brand__name">File Format Converter</span>
            <span className="brand__tag">Private, in-browser conversions</span>
          </div>
        </div>
        <nav className="site-header__nav">
          <a
            className="pill-link"
            href="https://github.com/Cloud2BR-MSFTLearningHub/File-Format-Converter"
            target="_blank"
            rel="noreferrer"
          >
            View on GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
