export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="credit">
          <span className="credit__role">Owner / Founder</span>
          <div className="credit__links">
            <a
              href="https://github.com/brown9804"
              target="_blank"
              rel="noreferrer"
            >
              @brown9804
            </a>
            <span className="credit__sep">·</span>
            <a
              href="https://www.linkedin.com/in/brown9804/"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
          </div>
        </div>

        <div className="credit">
          <span className="credit__role">Organization</span>
          <a
            className="credit__org"
            href="https://github.com/Cloud2BR-MSFTLearningHub"
            target="_blank"
            rel="noreferrer"
          >
            Cloud2BR Open Source Microsoft Cloud Sandbox — Learning Hub
          </a>
          <span className="credit__tag">
            Community demos, learning assets, and lightweight browser tools.
          </span>
        </div>
      </div>
      <div className="site-footer__base">
        Runs entirely in your browser — your files never leave your device.
      </div>
    </footer>
  );
}
