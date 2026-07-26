# React 18 → 19 hands-on

React 18.3.1で実装したIssue管理アプリを出発点に、React 19.2のAPIへ段階的に移行する検証プロジェクトです。

現在は比較用の「React 18初回状態」です。データ取得、フォーム送信、送信中表示、エラー処理、投票更新を`useState`と`useEffect`で明示的に管理しています。

## 構成

```text
.
├── frontend/   # Vite + React 18.3.1 + TypeScript
├── backend/    # Honoのインメモリ検証API
└── articles/   # Zenn投稿用Markdown
```

## 最初に読むファイル

上から順に読むと、全体を追いやすくなります。

1. `backend/src/index.ts`：Hono APIの起動、初期データ、各URLの処理
2. `frontend/src/types/issue.ts`：画面とAPIで扱うIssueの型
3. `frontend/src/api/issues.ts`：ReactからAPIを呼び出す関数
4. `frontend/src/App.tsx`：画面全体のstateとイベント処理
5. `frontend/src/components/`：フォーム・一覧・カードの表示
6. `frontend/src/main.tsx`：ReactをHTMLへ描画する入口

`package.json`と`tsconfig.json`はJSONなのでコメントを書けません。各npm scriptの役割は次のとおりです。

| script | 役割 |
| --- | --- |
| `dev` | APIとフロントエンドを同時に起動する |
| `dev:api` | Hono APIだけを起動する |
| `dev:web` | Viteのフロントエンドだけを起動する |
| `typecheck` | frontendとbackendのTypeScriptを検査する |
| `build` | backendとfrontendのproduction buildを作る |
| `zenn` | Zenn記事をローカルプレビューする |

## 起動

```bash
npm install
npm run dev
```

- Web: http://localhost:5173
- API health check: http://localhost:8787/health

APIとWebを個別に起動する場合は、`npm run dev:api`と`npm run dev:web`を別々のターミナルで実行してください。

## 検証

```bash
npm run typecheck
npm run build
```

Zennの記事をプレビューする場合は次を実行します。

```bash
npm run zenn
```

## 再現できる状態

- Issueタイトルに`fail`を含めると、追加APIが意図的に失敗する
- 「次の投票を失敗させる」を有効にすると、次の投票APIが失敗する
- APIには人工的な遅延があり、loadingとpendingを観察できる
- APIサーバーの再起動、または`POST /api/reset`で初期データに戻る

## 今後の移行候補

- `use` + `<Suspense>`
- async Action / `useTransition`
- `<form action>` + `useActionState`
- `useFormStatus`
- `useOptimistic`
- `useEffectEvent`
- `<Activity>`
