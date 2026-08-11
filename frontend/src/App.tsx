import { IssueWorkSpace } from "./components/issueWorkSpace";

export default function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <a
          className="brand"
          href="#top"
          aria-label="React Migration Lab ホーム"
        >
          <span className="brand-mark" aria-hidden="true">
            R
          </span>
          <span>
            <strong>Migration Lab</strong>
            <small>React 18 → 19.2</small>
          </span>
        </a>
        <span className="version-pill">BASELINE · REACT 18.3.1</span>
      </header>
      <IssueWorkSpace />
      <footer>
        <span>React Migration Lab</span>
        <span>Start state · useState + useEffect</span>
      </footer>
    </div>
  );
}
