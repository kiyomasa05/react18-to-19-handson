/** 1件のIssueカードを表示するための型とUIを定義します。 */
import type { Issue, IssueStatus } from '../types/issue'

// APIで使うステータス値を、日本語の表示名へ変換します。
const statusLabels: Record<IssueStatus, string> = {
  todo: '未着手',
  'in-progress': '進行中',
  done: '完了',
}

type IssueCardProps = {
  issue: Issue
  isVoting: boolean
  isUpdatingStatus: boolean
  onVote: (id: number) => void
  onStatusChange: (id: number, status: IssueStatus) => void
}

/**
 * Issue 1件のタイトル・ステータス・票数を表示します。
 * 実際の更新処理は親へ委譲し、このコンポーネントは操作を通知するだけです。
 */
export function IssueCard({
  issue,
  isVoting,
  isUpdatingStatus,
  onVote,
  onStatusChange,
}: IssueCardProps) {
  // ISO形式の作成日時を、カード用の短い日本語表記へ変換します。
  const date = new Intl.DateTimeFormat('ja-JP', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(issue.createdAt))

  return (
    <article className="issue-card">
      <div className="issue-card-topline">
        <span className={`status-badge status-${issue.status}`}>
          {statusLabels[issue.status]}
        </span>
        <span className="issue-number">#{issue.id}</span>
      </div>

      <h3>{issue.title}</h3>

      <div className="issue-meta">
        <span>{date}</span>
        <span className="meta-divider" aria-hidden="true" />
        <label>
          <span className="sr-only">{issue.title}のステータス</span>
          <select
            value={issue.status}
            disabled={isUpdatingStatus}
            onChange={(event) =>
              onStatusChange(issue.id, event.target.value as IssueStatus)
            }
          >
            <option value="todo">未着手</option>
            <option value="in-progress">進行中</option>
            <option value="done">完了</option>
          </select>
        </label>
      </div>

      <button
        className="vote-button"
        type="button"
        onClick={() => onVote(issue.id)}
        disabled={isVoting}
        aria-label={`${issue.title}に投票。現在${issue.votes}票`}
      >
        <span aria-hidden="true">▲</span>
        {isVoting ? '送信中…' : `${issue.votes} votes`}
      </button>
    </article>
  )
}
