/**
 * Issue一覧のPromiseを`use`で読み取り、
 * 解決後のIssue一覧をIssueListへ渡すコンポーネントです。
 */
import { use } from "react";
import type { Issue, IssueStatus } from "../types/issue";
import { IssueList } from "./IssueList";

type IssueBoardProps = {
  issuesPromise: Promise<Issue[]>;
  votingId: number | null;
  updatingStatusId: number | null;
  onVote: (id: number) => void;
  onStatusChange: (id: number, status: IssueStatus) => void;
};

export function IssueBoard({
  issuesPromise,
  votingId,
  updatingStatusId,
  onVote,
  onStatusChange,
}: IssueBoardProps) {
  /**
   * pendingの場合は、このコンポーネントの描画を一時停止します。
   * fulfilledの場合は、Promiseの解決値であるIssue[]を返します。
   * rejectedの場合は、エラーを上へ送出します。
   */
  const issues = use(issuesPromise);

  return (
    <IssueList
      issues={issues}
      votingId={votingId}
      updatingStatusId={updatingStatusId}
      onVote={onVote}
      onStatusChange={onStatusChange}
      // 以下の3つは移行途中だけ必要な値です。
      // 後でloadingをSuspenseへ移したら削除します。
      isLoading={false}
      error={null}
      onRetry={() => {}}
    />
  );
}
