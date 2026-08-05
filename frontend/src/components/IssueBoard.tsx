/**
 * Issue一覧のPromiseを`use`で読み取り、
 * 解決後のIssue一覧をIssueListへ渡すコンポーネントです。
 */
import { use, useMemo, useOptimistic, useTransition } from "react";
import type { Issue, IssueStatus } from "../types/issue";
import { IssueList } from "./IssueList";

type IssueBoardProps = {
  issuesPromise: Promise<Issue[]>;
  updatingStatusId: number | null;
  onVote: (id: number) => Promise<void>;
  onStatusChange: (id: number, status: IssueStatus) => void;
};

type OptimisticVoteState = {
  issues: Issue[];
  votingId: number | null;
};

export function IssueBoard({
  issuesPromise,
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

  /**
   * Actionが実行されていないときに表示する正式なstateです。
   * サーバーから取得したissuesを、楽観的更新の基準となるstateにする
   */
  const confirmedVoteState = useMemo<OptimisticVoteState>(
    () => ({
      issues,
      votingId: null,
    }),
    // 正式なissuesが更新されたときだけ基準stateを作り直す
    [issues],
  );

  /**
   * 投票中だけ、対象Issueの票数を1増やした一覧を返します。
   * votingIdも同時に更新し、票数とpending表示を一致させます。
   */
  const [optimisticVoteState, addOptimisticVote] = useOptimistic(
    // Action中でなければ、この正式なstateをそのまま表示する
    confirmedVoteState,

    (currentState, votingId: number): OptimisticVoteState => ({
      // 投票対象のIssueだけを新しいオブジェクトにし、票数を1増やす
      issues: currentState.issues.map((issue) =>
        issue.id === votingId
          ? {
              ...issue,
              votes: issue.votes + 1,
            }
          : issue,
      ),
      votingId,
    }),
  );

  const [isVotePending, startVoteTransition] = useTransition();

  function handleVote(id: number) {
    // 同じ一覧で複数の投票処理が重ならないようにする
    if (isVotePending) return;

    startVoteTransition(async () => {
      // APIを待たず、まず画面上の票数を1増やす
      addOptimisticVote(id);

      // POSTとIssue一覧の再取得が終わるまでActionを継続する
      await onVote(id);
    });
  }

  return (
    <IssueList
      issues={optimisticVoteState.issues}
      votingId={optimisticVoteState.votingId}
      isVotePending={isVotePending}
      updatingStatusId={updatingStatusId}
      onVote={handleVote}
      onStatusChange={onStatusChange}
    />
  );
}
