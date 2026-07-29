/**
 * 学習用Issue APIのエントリーポイント。
 * Honoでルーティングを定義し、@hono/node-serverでNode.js上に起動します。
 */
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

/** API内部で利用するIssueの進行状態です。 */
type IssueStatus = "todo" | "in-progress" | "done";

/** APIが保持・返却するIssue 1件分のデータです。 */
type Issue = {
  id: number;
  title: string;
  status: IssueStatus;
  votes: number;
  createdAt: string;
};

// サーバー起動時とリセット時に使う固定の初期データです。
const initialIssues: Issue[] = [
  {
    id: 1,
    title: "検索条件をURLに同期する",
    status: "in-progress",
    votes: 12,
    createdAt: "2026-07-22T01:00:00.000Z",
  },
  {
    id: 2,
    title: "投票結果を通信前に反映する",
    status: "todo",
    votes: 8,
    createdAt: "2026-07-23T03:30:00.000Z",
  },
  {
    id: 3,
    title: "フォームの二重送信を防ぐ",
    status: "done",
    votes: 17,
    createdAt: "2026-07-24T06:45:00.000Z",
  },
];

// データベースの代わりにメモリ上でIssueを保持します。
let issues = initialIssues.map((issue) => ({ ...issue }));
let nextId = 4;
// 次のGET /api/issuesだけを500エラーにする検証用フラグです。
let failNextIssuesGet = false;

// Honoアプリケーション本体を作成します。
const app = new Hono();

// Vite開発サーバー（localhost:5173）からのAPI呼び出しを許可します。
app.use(
  "*",
  cors({
    origin: "http://localhost:5173",
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

/** 通信中の表示を観察できるよう、APIへ人工的な遅延を入れます。 */
const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

/** サーバーが起動しているか確認するヘルスチェックです。 */
app.get("/health", (c) => c.json({ status: "ok" }));

/**
 * 次のIssue一覧取得だけを意図的に失敗させます。
 * Error Boundaryと再試行処理を検証するためのAPIです。
 */
app.post("/api/issues/fail-next", (c) => {
  failNextIssuesGet = true;

  return c.json({ status: "armed" });
});

app.get("/api/issues", async (c) => {
  // 今回のGETを失敗させるか、通信開始時点で確定する
  const shouldFail = failNextIssuesGet;

  // 失敗設定は1回のGETで消費する
  failNextIssuesGet = false;

  // Suspenseの待機表示を観察できるよう1200ms待つ
  await wait(1200);

  if (shouldFail) {
    return c.json(
      {
        message: "検証用エラー: Issue一覧を取得できませんでした。",
      },
      500,
    );
  }

  // ここから下は既存処理のまま
  const titleSearchQuery =
    c.req.query("query")?.trim().toLocaleLowerCase("ja") ?? "";

  const result = titleSearchQuery
    ? issues.filter((issue) =>
        issue.title.toLocaleLowerCase("ja").includes(titleSearchQuery),
      )
    : issues;

  return c.json([...result].sort((a, b) => b.id - a.id));
});
/** 新しいIssueを作成します。タイトルにfailを含めると意図的に失敗します。 */
app.post("/api/issues", async (c) => {
  await wait(900);

  const body = await c.req.json<{ title?: string }>();
  const title = body.title?.trim();

  if (!title) {
    return c.json({ message: "Issueタイトルは必須です。" }, 400);
  }

  if (title.toLocaleLowerCase("en").includes("fail")) {
    return c.json(
      { message: "検証用エラー: Issueを追加できませんでした。" },
      500,
    );
  }

  const issue: Issue = {
    id: nextId++,
    title,
    status: "todo",
    votes: 0,
    createdAt: new Date().toISOString(),
  };

  issues = [...issues, issue];
  return c.json(issue, 201);
});

/** Issueへ1票追加します。fail=trueなら通信失敗を再現します。 */
app.post("/api/issues/:id/vote", async (c) => {
  await wait(1100);

  if (c.req.query("fail") === "true") {
    return c.json({ message: "検証用エラー: 投票に失敗しました。" }, 500);
  }

  const id = Number(c.req.param("id"));
  const issue = issues.find((item) => item.id === id);

  if (!issue) {
    return c.json({ message: "Issueが見つかりません。" }, 404);
  }

  const updatedIssue = { ...issue, votes: issue.votes + 1 };
  issues = issues.map((item) => (item.id === id ? updatedIssue : item));
  return c.json(updatedIssue);
});

/** Issueのステータスを未着手・進行中・完了のいずれかへ更新します。 */
app.patch("/api/issues/:id/status", async (c) => {
  await wait(900);

  const id = Number(c.req.param("id"));
  const body = await c.req.json<{ status?: IssueStatus }>();
  const validStatuses: IssueStatus[] = ["todo", "in-progress", "done"];

  if (!body.status || !validStatuses.includes(body.status)) {
    return c.json({ message: "不正なステータスです。" }, 400);
  }

  const issue = issues.find((item) => item.id === id);
  if (!issue) {
    return c.json({ message: "Issueが見つかりません。" }, 404);
  }

  const updatedIssue = { ...issue, status: body.status };
  issues = issues.map((item) => (item.id === id ? updatedIssue : item));
  return c.json(updatedIssue);
});

/** メモリ上のデータを初期状態へ戻す、検証用のリセットAPIです。 */
app.post("/api/reset", (c) => {
  issues = initialIssues.map((issue) => ({ ...issue }));
  nextId = 4;
  return c.json({ status: "reset" });
});

// PORT環境変数がなければ8787番ポートを利用します。
const port = Number(process.env.PORT ?? 8787);

// HonoのfetchハンドラーをNode.jsのHTTPサーバーへ接続します。
serve({
  fetch: app.fetch,
  port,
});

console.log(`Issue API is running on http://localhost:${port}`);
