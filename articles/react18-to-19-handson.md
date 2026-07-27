---
title: "React 18→19.2をハンズオンで学ぶ（1）比較用Issue管理アプリを作る"
emoji: "⚛️"
type: "tech"
topics: ["react", "typescript", "vite", "hono", "frontend"]
published: false
---

## はじめに

これまで現場では、React 18以前の環境で`useState`や`useEffect`を中心に使ってきました。
なので、React 19では何がどう変わるのか、何が便利なのかわからない状態です。
なので、React19を学ぶシリーズとして、
React 18で作ったIssue管理アプリを19.2へ段階的に移行し、各追加機能の挙動を比較します。検証結果や採用時に考えたことを、自分の学習記録として残していきます。

## シリーズの予定

現時点では、次の流れで検証する予定です。

| 回    | 主な内容                                                                             |
| ----- | ------------------------------------------------------------------------------------ |
| 第1回 | React 18.3.1で比較用のIssue管理アプリを作る                                          |
| 第2回 | React 19.2へ更新し、移行時の警告や変更点を確認する                                   |
| 第3回 | `use`、`<Suspense>`、Error Boundaryで一覧取得を書き換える                            |
| 第4回 | Action、`<form action>`、`useActionState`、`useFormStatus`でフォーム送信を書き換える |
| 第5回 | `useOptimistic`と`useTransition`で投票処理と非同期更新を改善する                     |
| 第6回 | `useEffectEvent`と`<Activity>`の使いどころを検証する                                 |
| 第7回 | `ref`の扱い、Context、メタデータやリソース読み込みなど、Hooks以外の変更点を整理する  |

検証結果や1記事あたりの分量によって、回の分割や順番は変更する可能性があります。

## 対象読者

- `useState`と`useEffect`を使ったReactアプリの実装経験がある方
- APIからのデータ取得やフォーム送信を実装したことがある方
- TypeScript、npm、Viteの基本操作ができる方

React 19の事前知識は必要ありません。一方で、JSX、props、stateなどReactの基本構文は説明しません。

## 今回作るもの

第1回では、作成するのは、次の操作ができるIssue管理アプリです。

- Issue一覧の取得とタイトル検索
- Issueの追加
- ステータス更新
- Issueへの投票
- loading、pending、通信失敗の再現

APIへ人工的な遅延を入れているため、非同期処理中の画面を観察できます。また、Issueタイトルに`fail`を含めると追加が失敗し、「次の投票を失敗させる」を有効にすると投票が失敗します。

今後は同じ操作を維持したまま、次のAPIへ書き換えます。

| 画面の問題     | React 18版                 | React 19.2で試す候補              |
| -------------- | -------------------------- | --------------------------------- |
| 一覧読み込み   | `useEffect`とloading state | `use`と`<Suspense>`               |
| フォーム送信   | `onSubmit`と複数のstate    | `<form action>`と`useActionState` |
| 送信ボタン     | 親からpendingを渡す        | `useFormStatus`                   |
| 投票結果       | API完了後にstate更新       | `useOptimistic`                   |
| 非同期更新     | 手動のpending管理          | Actionと`useTransition`           |
| Effect内の通知 | 依存配列を調整             | `useEffectEvent`                  |
| タブの非表示   | 条件レンダリング           | `<Activity>`                      |

`use`は名前に`use`が付いていますがHookではなく、React APIです。通常のHooksとは呼び出しルールが異なります。

第一回では環境構築と作成したIssue管理アプリの機能やReact18版のコード例を解説するのみとなります。

## 実行環境

この記事のサンプルは、次の構成で作成しています。

| 項目       | バージョン  |
| ---------- | ----------- |
| React      | 18.3.1      |
| React DOM  | 18.3.1      |
| TypeScript | 5.9.3       |
| Vite       | 6.4.3       |
| Hono       | 4.12.32     |
| Node.js    | 20.10.0以上 |
| npm        | 10系        |

正確な依存関係は`package-lock.json`で固定します。

## サンプルコードを準備する

今回のプロジェクトは、フロントエンドとAPIをnpm workspacesでまとめています。

- リポジトリ: https://github.com/kiyomasa05/react18-to-19-handson
- 今回の完成コード: `article-01-react18タグのURL`

```text
react18-to-19-handson/
├── frontend/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── types/
│       └── App.tsx
├── backend/
│   └── src/index.ts
├── articles/
│   └── react18-to-19-handson.md
└── package.json
```

リポジトリを取得したら、ルートで依存関係をインストールします。

```bash
npm install
npm run dev
```

`npm run dev`は、Hono APIとViteの開発サーバーを同時に起動します。

- フロントエンド: `http://localhost:5173`
- API: `http://localhost:8787`
- health check: `http://localhost:8787/health`

## Honoで検証用APIを作る

今回の主題はReactなので、データベースは使いません。APIサーバーのメモリ上にIssueを保存します。サーバーを再起動すると初期状態へ戻ります。

Issueの型は次のとおりです。

```ts
type IssueStatus = "todo" | "in-progress" | "done";

type Issue = {
  id: number;
  title: string;
  status: IssueStatus;
  votes: number;
  createdAt: string;
};
```

用意したエンドポイントは次の4つです。

| method  | path                     | 用途           | 人工遅延 |
| ------- | ------------------------ | -------------- | -------- |
| `GET`   | `/api/issues`            | 一覧取得・検索 | 700ms    |
| `POST`  | `/api/issues`            | Issue追加      | 900ms    |
| `POST`  | `/api/issues/:id/vote`   | 投票           | 1100ms   |
| `PATCH` | `/api/issues/:id/status` | ステータス更新 | 900ms    |

![Issue管理画面とAPIの対応](/images/react18-to-19-handson/api-ui-map.png)

図中の番号は、それぞれ次のUI操作に対応しています。

1. `GET /api/issues`: タイトル検索とIssue一覧の取得
2. `POST /api/issues`: 新しいIssueの追加
3. `POST /api/issues/:id/vote`: Issueへの投票
4. `PATCH /api/issues/:id/status`: Issueのステータス更新

新しいIssueの追加APIでは、失敗条件を再現できるようにしています。

```ts
// `fail`がタイトルに含まれているとAPIでは500を返して失敗する
if (title.toLocaleLowerCase("en").includes("fail")) {
  return c.json(
    { message: "検証用エラー: Issueを追加できませんでした。" },
    500,
  );
}
```

成功例だけでは、React 19のエラー処理や楽観的更新のロールバックを検証できません。失敗条件を固定しておくと、移行前後を同じ操作で比較できます。

以降は各機能ごとのReact18での実装詳細となります。

## Issue一覧を取得するコード

- `useEffect`から一覧取得関数を呼び、結果をstateへ保存します。
- タイトル検索機能はqueryパラメータを使って、検索語が変わるたびに`useEffect`が再実行されます。
- 検索語の入力途中に前のリクエストが完了する可能性があるため、cleanupで古い結果を反映しないようにしています。
- データ本体とは別に、loadingとerrorも管理します。

```tsx
const [issues, setIssues] = useState<Issue[]>([]);
const [titleSearchQuery, setTitleSearchQuery] = useState("");
const [isLoading, setIsLoading] = useState(true);
const [loadError, setLoadError] = useState<string | null>(null);

useEffect(() => {
  let ignore = false;

  async function load() {
    setIsLoading(true);
    setLoadError(null);

    try {
      const nextIssues = await fetchIssues(titleSearchQuery);
      if (!ignore) setIssues(nextIssues);
    } catch (error) {
      if (!ignore) {
        setLoadError(
          error instanceof Error ? error.message : "読み込みに失敗しました",
        );
      }
    } finally {
      if (!ignore) setIsLoading(false);
    }
  }

  void load();

  return () => {
    ignore = true;
  };
}, [titleSearchQuery]);
```

この実装自体が間違いというわけではありません。React 19へ移行した後も、外部システムとの同期には`useEffect`を使います。今回確認したいのは、データ読み込みの境界をSuspense側へ移した場合に、コンポーネントの責務がどう変わるかです。

## Issueを追加するコード

Issue追加では、入力値に加えて送信中と送信エラーのstateを用意します。

```tsx
const [draftTitle, setDraftTitle] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);
const [submitError, setSubmitError] = useState<string | null>(null);
```

送信処理では、開始前、成功時、失敗時、終了時をそれぞれ更新します。

```tsx
async function handleCreateIssue(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const title = draftTitle.trim();

  // 空のタイトルと、送信中の二重送信はここで止める
  if (!title || isSubmitting) return;

  // 送信開始前: pending状態に切り替え、前回のエラーを消す
  setIsSubmitting(true);
  setSubmitError(null);

  try {
    const createdIssue = await createIssue(title);

    // 送信成功: 作成されたIssueを一覧へ追加し、入力欄を空にする
    setIssues((currentIssues) => [createdIssue, ...currentIssues]);
    setDraftTitle("");
  } catch (error) {
    // 送信失敗: 画面へ表示するエラーメッセージを保存する
    setSubmitError(
      error instanceof Error ? error.message : "Issueの追加に失敗しました",
    );
  } finally {
    // 送信終了: 成功・失敗のどちらでもpending状態を解除する
    setIsSubmitting(false);
  }
}
```

フォームのJSXでは、`isSubmitting`を使って入力欄とボタンを無効化します。

```tsx
<form onSubmit={handleCreateIssue} aria-busy={isSubmitting}>
  <input
    name="title"
    value={draftTitle}
    onChange={(event) => setDraftTitle(event.target.value)}
    disabled={isSubmitting}
  />

  <button disabled={isSubmitting || draftTitle.trim().length === 0}>
    {isSubmitting ? "追加中" : "Issueを追加"}
  </button>
</form>
```

親が管理するpendingを送信ボタンへ渡す構造です。React 19では、フォームをActionへ変更し、`useActionState`と`useFormStatus`で同じ要件を再実装します。

## 投票数を更新するコード

- 投票は`Issue`型の`votes: number`で管理しています。
- 投票を押すと`votes`の値がAPIを通して増加させます。

```tsx
async function handleVote(id: number) {
  setVotingId(id);
  setVoteError(null);

  try {
    const updatedIssue = await voteForIssue(id, failNextVote);

    setIssues((currentIssues) =>
      currentIssues.map((issue) =>
        issue.id === updatedIssue.id ? updatedIssue : issue,
      ),
    );
  } catch (error) {
    setVoteError(error instanceof Error ? error.message : "投票に失敗しました");
  } finally {
    setVotingId(null);
  }
}
```

APIには1100msの遅延があるため、投票ボタンを押してから数字が増えるまで待ち時間があります。

React 19版では`useOptimistic`で一時的な投票結果を表示し、APIが失敗した場合に正式なstateへ戻る挙動を確認します。

## ステータスを更新するコード

- ステータスは`Issue`型の`status`で管理しています。
- セレクトボックスを変更すると、`PATCH /api/issues/:id/status`を呼び出します。
- 更新中のIssue IDを`updatingStatusId`へ保存し、通信中の連続操作を防ぎます。

```tsx
async function handleStatusChange(id: number, status: IssueStatus) {
  if (updatingStatusId !== null) return;

  setUpdatingStatusId(id);

  try {
    const updatedIssue = await updateIssueStatus(id, status);

    setIssues((currentIssues) =>
      currentIssues.map((issue) =>
        issue.id === updatedIssue.id ? updatedIssue : issue,
      ),
    );
  } catch (error) {
    setVoteError(
      error instanceof Error ? error.message : "ステータスの更新に失敗しました",
    );
  } finally {
    setUpdatingStatusId(null);
  }
}
```

APIから更新後のIssueが返されたら、`map`で同じIDのIssueだけを置き換えます。元の配列を直接変更せず、新しい配列として`issues`を更新しています。

この処理にも900msの遅延があり、更新開始と終了を手動で管理しています。React 19版ではActionと`useTransition`を使った場合に、pending管理やエラー処理がどのように変わるかを比較します。

## React 18版で増えたstateを観察する

初回状態の`App`には、次のstateがあります。

```text
issues
titleSearchQuery
reloadCount
isLoading
loadError
draftTitle
isSubmitting
submitError
votingId
voteError
failNextVote
updatingStatusId
```

stateが多いことだけを理由に、実装が悪いとは判断できません。それぞれ異なる画面状態を表しています。

ただし、非同期処理ごとに次のコードが繰り返されています。

1. pendingを開始する
2. 前回のerrorを消す
3. APIを呼ぶ
4. 成功結果をstateへ反映する
5. errorを表示する
6. pendingを終了する

React 19のActionsは、このうちどこをまとめ、どこを引き続きアプリ側で設計するのでしょうか。以降の検証では、コード行数だけでなく、連続操作、通信失敗、入力保持、アクセシビリティを比較します。

## まとめ

第1回では、React 19へ移行する前の比較用アプリをReact 18.3.1で作りました。

- Issue管理機能として、Issue一覧取得、追加、投稿、status更新機能を用意
- それぞれAPIで遅延を入れている
- 各API通信部では、データ、loading、errorを別々のstateで管理している

次はReact 18.3.1で非推奨APIの警告を確認してからReact 19.2へ更新し、まず`use`とSuspenseの境界を検証します。

## 参考資料

- [React v19](https://react.dev/blog/2024/12/05/react-19)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [React 19.2](https://react.dev/blog/2025/10/01/react-19-2)
- [Hono Node.js](https://hono.dev/docs/getting-started/nodejs)
