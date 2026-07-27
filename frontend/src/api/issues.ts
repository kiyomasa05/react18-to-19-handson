/**
 * フロントエンドからHono APIを呼び出す関数をまとめたファイル。
 * コンポーネント側にfetchやURL組み立ての詳細を持ち込まないための層です。
 */
import type { Issue, IssueStatus } from "../types/issue";

// .envで未指定の場合は、ローカルのHono APIを利用します。
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787/api";

type ApiErrorBody = {
  message?: string;
};

/**
 * 共通のHTTPリクエスト処理です。
 * 2xx以外ではAPIのmessageを取り出してErrorとして呼び出し元へ返します。
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(body.message ?? `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Issue一覧を取得します。
 * titleSearchQueryが空でなければ、タイトル検索用のquery parameterを付けます。
 */
export function fetchIssues(titleSearchQuery: string): Promise<Issue[]> {
  const searchParams = new URLSearchParams();
  if (titleSearchQuery.trim()) {
    searchParams.set("query", titleSearchQuery.trim());
  }

  const queryString = searchParams.size > 0 ? `?${searchParams}` : "";
  // 例: /issues?query=フォーム
  return request<Issue[]>(`/issues${queryString}`);
}

/** タイトルを送信して新しいIssueを作成します。 */
export function createIssue(title: string): Promise<Issue> {
  return request<Issue>("/issues", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

/**
 * 指定したIssueへ1票追加します。
 * shouldFailは、学習用に通信失敗を再現するためのフラグです。
 */
export function voteForIssue(id: number, shouldFail: boolean): Promise<Issue> {
  const suffix = shouldFail ? "?fail=true" : "";
  return request<Issue>(`/issues/${id}/vote${suffix}`, {
    method: "POST",
  });
}

/** 指定したIssueのステータスを更新します。 */
export function updateIssueStatus(
  id: number,
  status: IssueStatus,
): Promise<Issue> {
  return request<Issue>(`/issues/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
