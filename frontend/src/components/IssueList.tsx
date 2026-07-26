/** Issue一覧のloading・error・空表示・正常表示を切り替えるファイルです。 */
import type { Issue, IssueStatus } from '../types/issue'
import { IssueCard } from './IssueCard'

type IssueListProps = {
  issues: Issue[]
  isLoading: boolean
  error: string | null
  votingId: number | null
  updatingStatusId: number | null
  onRetry: () => void
  onVote: (id: number) => void
  onStatusChange: (id: number, status: IssueStatus) => void
}

/**
 * Issue一覧の現在状態に応じたUIを返します。
 * React 18版ではSuspenseを使わず、isLoadingとerrorを明示的に分岐します。
 */
export function IssueList({
  issues,
  isLoading,
  error,
  votingId,
  updatingStatusId,
  onRetry,
  onVote,
  onStatusChange,
}: IssueListProps) {
  // 読み込み中は実データと同じ3列のスケルトンを表示します。
  if (isLoading) {
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
    )
  }

  // 取得失敗時はエラー内容と再読み込み操作を表示します。
  if (error) {
    return (
      <div className="state-card" role="alert">
        <strong>Issueを取得できませんでした</strong>
        <p>{error}</p>
        <button type="button" onClick={onRetry}>
          再読み込み
        </button>
      </div>
    )
  }

  // 検索結果が0件の場合は、正常な空状態として案内を表示します。
  if (issues.length === 0) {
    return (
      <div className="state-card">
        <strong>該当するIssueはありません</strong>
        <p>検索語を変えるか、新しいIssueを追加してください。</p>
      </div>
    )
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
  )
}
