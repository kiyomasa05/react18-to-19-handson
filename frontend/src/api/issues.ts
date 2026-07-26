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

/** タイトル検索を含むIssue一覧を取得します。
 * タイトル検索用にqueryで検索もできる
 */
export function fetchIssues(query: string): Promise<Issue[]> {
  const searchParams = new URLSearchParams();
  if (query.trim()) searchParams.set("query", query.trim());

  const queryString = searchParams.size > 0 ? `?${searchParams}` : "";
  // ?query=a
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
