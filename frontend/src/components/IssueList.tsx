/** Issue一覧のloading・error・空表示・正常表示を切り替えるファイルです。 */
import type { Issue, IssueStatus } from "../types/issue";
import { IssueCard } from "./IssueCard";

type IssueListProps = {
  issues: Issue[];
  votingId: number | null;
  updatingStatusId: number | null;
  onVote: (id: number) => void;
  onStatusChange: (id: number, status: IssueStatus) => void;
};

/**
 * Issue一覧の現在状態に応じたUIを返します。
 * React 18版ではSuspenseを使わず、isLoadingとerrorを明示的に分岐します。
 */
export function IssueList({
  issues,
  votingId,
  updatingStatusId,
  onVote,
  onStatusChange,
}: IssueListProps) {
  // 検索結果が0件の場合は、正常な空状態として案内を表示します。
  if (issues.length === 0) {
    return (
      <div className="state-card">
        <strong>該当するIssueはありません</strong>
        <p>検索語を変えるか、新しいIssueを追加してください。</p>
      </div>
    );
  }

  return (
    <div className="issue-grid">
      {issues.map((issue) => (
        <IssueCard
          key={issue.id}
          issue={issue}
          isVoting={votingId === issue.id}
          isUpdatingStatus={updatingStatusId === issue.id}
          onVote={onVote}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}

/**
 * Issue一覧のPromiseがpending中に、
 * Suspenseのfallbackとして表示するスケルトンです。
 */
export function IssueListSkeleton() {
  return (
    <div className="issue-grid" aria-label="Issueを読み込み中">
      {[0, 1, 2].map((item) => (
        <div className="issue-card skeleton-card" key={item}>
          <span className="skeleton skeleton-short" />
          <span className="skeleton skeleton-title" />
          <span className="skeleton skeleton-line" />
        </div>
      ))}
    </div>
  );
}
type IssueListErrorFallbackProps = {
  /** APIから受け取ったエラーです。 */
  error: Error;

  /** 再試行ボタンを押したときに呼ぶ処理です。 */
  onRetry: () => void;
};

/**
 * Issue一覧のPromiseがrejectedになったとき、
 * カード一覧の代わりに表示するエラーUIです。
 */
export function IssueListErrorFallback({
  error,
  onRetry,
}: IssueListErrorFallbackProps) {
  return (
    <div className="state-card" role="alert">
      <strong>Issue一覧を取得できませんでした</strong>

      {/* request()が生成したAPIのエラーメッセージを表示する */}
      <p>{error.message}</p>

      <button type="button" onClick={onRetry}>
        再試行
      </button>
    </div>
  );
}
