/** Issue一覧・検索・投票・ステータス更新を組み立てるルートコンポーネント。 */
import { Suspense, useState, useRef } from "react";
import { updateIssueStatus, voteForIssue } from "./api/issues";
import { getIssuesPromise, refetchIssues } from "./api/issuesResource";
import { IssueBoard } from "./components/IssueBoard";
import { IssueForm } from "./components/IssueForm";
import {
  IssueListErrorFallback,
  IssueListSkeleton,
} from "./components/IssueList";
import {
  IssueStats,
  IssueStatsFallback,
  IssueStatsErrorFallback,
} from "./components/IssueStats";
import type { IssueStatus } from "./types/issue";
import { IssueErrorBoundary } from "./components/IssueErrorBoundary";

export default function App() {
  // issues のstateはPromiseとして管理することになった

  // 検索欄へ表示する文字列
  const [titleSearchQuery, setTitleSearchQuery] = useState("");

  // 現在の画面でuseに読み取らせるPromise
  const [issuesPromise, setIssuesPromise] = useState(() =>
    getIssuesPromise(""),
  );

  /**
   * Mutationの通信中に検索文字列が変わっても、
   * 通信完了時点の最新条件を参照するためのrefです。
   */
  const latestTitleSearchQueryRef = useRef(titleSearchQuery);

  // 投票中のIssueと、失敗パターンを再現する設定を管理します。
  const [votingId, setVotingId] = useState<number | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [failNextVote, setFailNextVote] = useState(false);

  // ステータス更新中のIssueを識別し、連続操作を防ぎます。
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  /**
   * 検索文字列と、その検索条件に対応するPromiseを
   * 同じイベント内で切り替えます。
   */
  function handleTitleSearchQueryChange(nextTitleSearchQuery: string) {
    // stateの反映を待たず、最新値をすぐrefへ保存する
    latestTitleSearchQueryRef.current = nextTitleSearchQuery;
    setTitleSearchQuery(nextTitleSearchQuery);

    setIssuesPromise(getIssuesPromise(nextTitleSearchQuery));
  }

  /**
   * 一覧取得エラー後にキャッシュを破棄し、
   * 現在の検索条件で新しいGETを開始します。
   */
  function handleRetryIssues() {
    setIssuesPromise(refetchIssues(latestTitleSearchQueryRef.current));
  }

  /** Issue作成成功後、検索条件とPromiseキャッシュをリセットします。 */
  function handleIssueCreated() {
    latestTitleSearchQueryRef.current = "";
    setTitleSearchQuery("");
    setIssuesPromise(refetchIssues(""));
  }

  /** 指定したIssueへ投票し、APIから返された正式な票数へ置き換えます。 */
  async function handleVote(id: number) {
    if (votingId !== null) return;

    setVotingId(id);
    setVoteError(null);

    try {
      // 投票APIが完了するまで待つ
      await voteForIssue(id, failNextVote);

      // 完了時点の検索文字列で最新一覧を取得する
      setIssuesPromise(refetchIssues(latestTitleSearchQueryRef.current));
    } catch (error) {
      setVoteError(
        error instanceof Error ? error.message : "投票に失敗しました",
      );
    } finally {
      setVotingId(null);
      setFailNextVote(false);
    }
  }

  /** 指定したIssueのステータスを更新し、一覧内の該当データを置き換えます。 */
  async function handleStatusChange(id: number, status: IssueStatus) {
    if (updatingStatusId !== null) return;

    setUpdatingStatusId(id);

    try {
      // ステータス更新APIが完了するまで待つ
      await updateIssueStatus(id, status);

      // 完了時点の検索文字列で最新一覧を取得する
      setIssuesPromise(refetchIssues(latestTitleSearchQueryRef.current));
    } catch (error) {
      setVoteError(
        error instanceof Error
          ? error.message
          : "ステータスの更新に失敗しました",
      );
    } finally {
      setUpdatingStatusId(null);
    }
  }

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

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">ISSUE BOARD / BEFORE</p>
            <h1>
              非同期UIを、
              <span>React 18で組み立てる。</span>
            </h1>
            <p className="hero-description">
              loading、pending、errorを手動で管理した比較用アプリです。
              ここからReact 19.2のActionsと新しいAPIへ移行します。
            </p>
          </div>

          {/* 集計値のPromiseがpending中は「—」を表示する */}
          <IssueErrorBoundary
            resetKey={issuesPromise}
            fallback={() => <IssueStatsErrorFallback />}
          >
            <Suspense fallback={<IssueStatsFallback />}>
              <IssueStats issuesPromise={issuesPromise} />
            </Suspense>
          </IssueErrorBoundary>
        </section>

        <IssueForm onCreated={handleIssueCreated} />

        <section className="board-section" aria-labelledby="issue-board-title">
          <div className="board-toolbar">
            <div>
              <p className="eyebrow">BACKLOG</p>
              <h2 id="issue-board-title">Issue一覧</h2>
            </div>

            <label className="search-field">
              <span className="sr-only">Issueを検索</span>
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={titleSearchQuery}
                onChange={(event) =>
                  handleTitleSearchQueryChange(event.target.value)
                }
                placeholder="タイトルを検索"
              />
            </label>
          </div>

          <div className="experiment-bar">
            <label>
              <input
                type="checkbox"
                checked={failNextVote}
                onChange={(event) => setFailNextVote(event.target.checked)}
              />
              次の投票を失敗させる
            </label>
            <span>API delay: GET 700ms / mutation 900〜1100ms</span>
          </div>

          {voteError && (
            <p className="board-error" role="alert">
              {voteError}
              <button type="button" onClick={() => setVoteError(null)}>
                閉じる
              </button>
            </p>
          )}

          {/* 一覧のPromiseがpending中はスケルトンを表示する */}
          <IssueErrorBoundary
            resetKey={issuesPromise}
            fallback={(error) => (
              <IssueListErrorFallback
                error={error}
                onRetry={handleRetryIssues}
              />
            )}
          >
            <Suspense fallback={<IssueListSkeleton />}>
              <IssueBoard
                issuesPromise={issuesPromise}
                votingId={votingId}
                updatingStatusId={updatingStatusId}
                onVote={handleVote}
                onStatusChange={handleStatusChange}
              />
            </Suspense>
          </IssueErrorBoundary>
        </section>
      </main>

      <footer>
        <span>React Migration Lab</span>
        <span>Start state · useState + useEffect</span>
      </footer>
    </div>
  );
}
