/**
 * React 18版の画面全体を組み立てるルートコンポーネント。
 * Issue一覧・検索・追加・投票・ステータス更新のstateをまとめて管理します。
 */
import { Suspense, useState, useRef } from "react";
import { createIssue, updateIssueStatus, voteForIssue } from "./api/issues";
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

  // Issue追加フォームの入力値・送信中・エラーを管理します。
  const [draftTitle, setDraftTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  /** フォームを送信し、作成されたIssueを一覧の先頭へ追加します。 */
  async function handleCreateIssue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draftTitle.trim();

    // 空のタイトルと、送信中の二重送信はここで止めます。
    if (!title || isSubmitting) return;

    // 送信開始前: pending状態に切り替え、前回のエラーを消します。
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // いままではissueをawait createIssueでやって、stateに入れる形で返り値を処理していた
      // 今回はsetIssuePromiseで再度一覧をキャッシュ付きで返すため、返り値に使っていない
      if (titleSearchQuery) setTitleSearchQuery("");
      // POSTが完了するまで待つ
      await createIssue(title);

      // 作成成功後、入力欄と検索条件を空に戻す
      setDraftTitle("");
      latestTitleSearchQueryRef.current = "";
      setTitleSearchQuery("");

      // 全キャッシュを破棄し、全IssueをGETし直す
      setIssuesPromise(refetchIssues(""));
    } catch (error) {
      // 送信失敗: 画面へ表示するエラーメッセージをstateへ保存します。
      setSubmitError(
        error instanceof Error ? error.message : "Issueの追加に失敗しました",
      );
    } finally {
      // 送信終了: 成功・失敗のどちらでもpending状態を解除します。
      setIsSubmitting(false);
    }
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

        <IssueForm
          title={draftTitle}
          isSubmitting={isSubmitting}
          error={submitError}
          onTitleChange={setDraftTitle}
          onSubmit={handleCreateIssue}
        />

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
