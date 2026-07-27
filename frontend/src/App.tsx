/**
 * React 18版の画面全体を組み立てるルートコンポーネント。
 * Issue一覧・検索・追加・投票・ステータス更新のstateをまとめて管理します。
 */
import { useEffect, useMemo, useState } from 'react'
import {
  createIssue,
  fetchIssues,
  updateIssueStatus,
  voteForIssue,
} from './api/issues'
import { IssueForm } from './components/IssueForm'
import { IssueList } from './components/IssueList'
import type { Issue, IssueStatus } from './types/issue'

export default function App() {
  // 一覧表示と検索・再読み込みに使うstateです。
  const [issues, setIssues] = useState<Issue[]>([])
  const [titleSearchQuery, setTitleSearchQuery] = useState('')
  const [reloadCount, setReloadCount] = useState(0)

  // Issue一覧の取得状況を手動で管理します。
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Issue追加フォームの入力値・送信中・エラーを管理します。
  const [draftTitle, setDraftTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // 投票中のIssueと、失敗パターンを再現する設定を管理します。
  const [votingId, setVotingId] = useState<number | null>(null)
  const [voteError, setVoteError] = useState<string | null>(null)
  const [failNextVote, setFailNextVote] = useState(false)

  // ステータス更新中のIssueを識別し、連続操作を防ぎます。
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null)

  /**
   * 検索語または再読み込み回数が変わるたびにIssue一覧を取得します。
   * cleanup後に古いリクエストが完了してもstateを更新しないよう、ignoreで制御します。
   */
  useEffect(() => {
    let ignore = false

    async function load() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const nextIssues = await fetchIssues(titleSearchQuery)
        if (!ignore) setIssues(nextIssues)
      } catch (error) {
        if (!ignore) {
          setLoadError(
            error instanceof Error ? error.message : '読み込みに失敗しました',
          )
        }
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    void load()

    return () => {
      ignore = true
    }
  }, [titleSearchQuery, reloadCount])

  // 表示中のIssueから、ヘッダーに表示する集計値を計算します。
  const stats = useMemo(() => {
    const done = issues.filter((issue) => issue.status === 'done').length
    const votes = issues.reduce((total, issue) => total + issue.votes, 0)
    return { done, votes }
  }, [issues])

  /** フォームを送信し、作成されたIssueを一覧の先頭へ追加します。 */
  async function handleCreateIssue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = draftTitle.trim()

    // 空のタイトルと、送信中の二重送信はここで止めます。
    if (!title || isSubmitting) return

    // 送信開始前: pending状態に切り替え、前回のエラーを消します。
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const createdIssue = await createIssue(title)

      // 送信成功: APIが返したIssueを追加し、入力欄と検索条件をリセットします。
      setIssues((currentIssues) => [createdIssue, ...currentIssues])
      setDraftTitle('')
      if (titleSearchQuery) setTitleSearchQuery('')
    } catch (error) {
      // 送信失敗: 画面へ表示するエラーメッセージをstateへ保存します。
      setSubmitError(
        error instanceof Error ? error.message : 'Issueの追加に失敗しました',
      )
    } finally {
      // 送信終了: 成功・失敗のどちらでもpending状態を解除します。
      setIsSubmitting(false)
    }
  }

  /** 指定したIssueへ投票し、APIから返された正式な票数へ置き換えます。 */
  async function handleVote(id: number) {
    if (votingId !== null) return

    setVotingId(id)
    setVoteError(null)

    try {
      const updatedIssue = await voteForIssue(id, failNextVote)
      setIssues((currentIssues) =>
        currentIssues.map((issue) =>
          issue.id === updatedIssue.id ? updatedIssue : issue,
        ),
      )
    } catch (error) {
      setVoteError(
        error instanceof Error ? error.message : '投票に失敗しました',
      )
    } finally {
      setVotingId(null)
      setFailNextVote(false)
    }
  }

  /** 指定したIssueのステータスを更新し、一覧内の該当データを置き換えます。 */
  async function handleStatusChange(id: number, status: IssueStatus) {
    if (updatingStatusId !== null) return

    setUpdatingStatusId(id)

    try {
      const updatedIssue = await updateIssueStatus(id, status)
      setIssues((currentIssues) =>
        currentIssues.map((issue) =>
          issue.id === updatedIssue.id ? updatedIssue : issue,
        ),
      )
    } catch (error) {
      setVoteError(
        error instanceof Error
          ? error.message
          : 'ステータスの更新に失敗しました',
      )
    } finally {
      setUpdatingStatusId(null)
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="React Migration Lab ホーム">
          <span className="brand-mark" aria-hidden="true">R</span>
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

          <dl className="stats-card">
            <div>
              <dt>表示中</dt>
              <dd>{issues.length}</dd>
            </div>
            <div>
              <dt>完了</dt>
              <dd>{stats.done}</dd>
            </div>
            <div>
              <dt>総投票</dt>
              <dd>{stats.votes}</dd>
            </div>
          </dl>
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
                onChange={(event) => setTitleSearchQuery(event.target.value)}
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

          <IssueList
            issues={issues}
            isLoading={isLoading}
            error={loadError}
            votingId={votingId}
            updatingStatusId={updatingStatusId}
            onRetry={() => setReloadCount((count) => count + 1)}
            onVote={handleVote}
            onStatusChange={handleStatusChange}
          />
        </section>
      </main>

      <footer>
        <span>React Migration Lab</span>
        <span>Start state · useState + useEffect</span>
      </footer>
    </div>
  )
}
