import { Activity, useState } from "react";
import { IssueWorkSpace } from "./components/issueWorkSpace";
import {
  IssueDisplayContext,
  VoteUnit,
} from "./components/issueDisplayContext";
import { DocumentMetadata } from "./components/DocumentMetadata";

export default function App() {
  const [isWorkspaceVisible, setIsWorkspaceVisible] = useState(true);
  const [voteUnit, setVoteUnit] = useState<VoteUnit>("votes");

  return (
    <div className="app-shell">
      <DocumentMetadata />
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

      <label>
        票数の表記
        <select
          value={voteUnit}
          onChange={(event) => setVoteUnit(event.target.value as VoteUnit)}
        >
          <option value="votes">votes</option>
          <option value="票">票</option>
        </select>
      </label>
      {/* <IssueDisplayContext.Provider value={voteUnit}> */}
      <IssueDisplayContext value={voteUnit}>
        <Activity mode={isWorkspaceVisible ? "visible" : "hidden"}>
          <IssueWorkSpace />
        </Activity>
      </IssueDisplayContext>
      {/* </IssueDisplayContext.Provider> */}
      <footer>
        <span>React Migration Lab</span>
        <span>Start state · useState + useEffect</span>
      </footer>
    </div>
  );
}
