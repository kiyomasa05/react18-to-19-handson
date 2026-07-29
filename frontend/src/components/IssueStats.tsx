import { use } from "react";
import type { Issue } from "../types/issue";

/**
 * Issue一覧のPromiseを読み取り、
 * 表示件数・完了数・総投票数を表示します。
 * 画面右上のカウント表示のコンポーネント
 */
type IssueStatsProps = {
  issuesPromise: Promise<Issue[]>;
};
export const IssueStats = ({ issuesPromise }: IssueStatsProps) => {
  const issues = use(issuesPromise);

  const done = issues.filter((issue) => issue.status === "done").length;

  const votes = issues.reduce((total, issue) => total + issue.votes, 0);

  return (
    <dl className="stats-card">
      <div>
        <dt>表示中</dt>
        <dd>{issues.length}</dd>
      </div>

      <div>
        <dt>完了</dt>
        <dd>{done}</dd>
      </div>

      <div>
        <dt>総投票</dt>
        <dd>{votes}</dd>
      </div>
    </dl>
  );
};

/**
 * 集計値のPromiseがpending中に、
 * Suspenseのfallbackとして表示します。
 */
export function IssueStatsFallback() {
  return (
    <dl
      className="stats-card"
      aria-label="Issueの集計を読み込み中"
    >
      {['表示中', '完了', '総投票'].map((label) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd aria-hidden="true">—</dd>
        </div>
      ))}
    </dl>
  )
}
