/** Issue追加フォームが親コンポーネントから受け取る値と操作です。 */
type IssueFormProps = {
  title: string
  isSubmitting: boolean
  error: string | null
  onTitleChange: (title: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

/**
 * Issueタイトルを入力して送信するフォーム。
 * React 18版では入力値・送信中・エラーをAppからpropsで受け取ります。
 */
export function IssueForm({
  title,
  isSubmitting,
  error,
  onTitleChange,
  onSubmit,
}: IssueFormProps) {
  return (
    <section className="panel compose-panel" aria-labelledby="new-issue-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">CREATE</p>
          <h2 id="new-issue-title">新しいIssue</h2>
        </div>
        <span className="manual-state">manual pending state</span>
      </div>

      <form onSubmit={onSubmit} aria-busy={isSubmitting}>
        <label htmlFor="issue-title">タイトル</label>
        <div className="form-row">
          <input
            id="issue-title"
            name="title"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="例: 検索結果の並び順を保存したい"
            autoComplete="off"
            disabled={isSubmitting}
          />
          <button
            className="primary-button"
            type="submit"
            disabled={isSubmitting || title.trim().length === 0}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" aria-hidden="true" />
                追加中
              </>
            ) : (
              'Issueを追加'
            )}
          </button>
        </div>

        <p className="form-hint">
          タイトルに <code>fail</code> を含めると失敗を再現できます。
        </p>

        {/* APIエラーはスクリーンリーダーにも即時通知します。 */}
        {error && (
          <p className="inline-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  )
}
