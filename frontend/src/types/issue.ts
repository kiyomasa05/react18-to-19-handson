/** Issueが取り得る進行状態です。 */
export type IssueStatus = 'todo' | 'in-progress' | 'done'

/** フロントエンドとAPIで扱うIssue 1件分のデータ構造です。 */
export type Issue = {
  /** APIが採番する一意なID。 */
  id: number
  /** 一覧に表示するIssueのタイトル。 */
  title: string
  /** 未着手・進行中・完了のいずれか。 */
  status: IssueStatus
  /** ユーザーから集まった票数。 */
  votes: number
  /** 作成日時を表すISO 8601形式の文字列。 */
  createdAt: string
}
