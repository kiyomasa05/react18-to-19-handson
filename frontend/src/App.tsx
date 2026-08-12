import { Activity, useState } from "react";
import { IssueWorkSpace } from "./components/issueWorkSpace";

export default function App() {
  const [isWorkspaceVisible, setIsWorkspaceVisible] = useState(true);
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
        <button
          type="button"
          onClick={() => setIsWorkspaceVisible((isVisible) => !isVisible)}
        >
          {isWorkspaceVisible ? "Issue管理画面を隠す" : "Issue管理画面を表示"}
        </button>
      </header>

      <Activity mode={isWorkspaceVisible ? "visible" : "hidden"}>
        <IssueWorkSpace />
      </Activity>
      <footer>
        <span>React Migration Lab</span>
        <span>Start state · useState + useEffect</span>
      </footer>
    </div>
  );
}
