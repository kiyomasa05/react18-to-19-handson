/**
 * `use`へ渡すIssue一覧のPromiseを、検索条件ごとに管理します。
 *
 * 同じ検索条件では同じPromiseを返し、
 * 不要な再取得やuncached Promiseの警告を防ぎます。
 */
import type { Issue } from "../types/issue";
import { fetchIssues } from "./issues";

/**
 * タイトル検索文字列と、Issue一覧取得Promiseの対応表です。
 * 検索条件が増えると、Mapの中の要素が増えます。
 */
const issuesPromiseByTitleSearchQuery = new Map<string, Promise<Issue[]>>();

/**
 * Map前後の空白を除去し、同じ検索文字列として扱えるようにします。
 */
function normalizeTitleSearchQuery(titleSearchQuery: string) {
  return titleSearchQuery.trim();
}
/**
 * 同じ検索条件のPromiseがあれば再利用し、
 * なければAPI通信を開始してPromiseを保存します。
 */
export function getIssuesPromise(titleSearchQuery: string): Promise<Issue[]> {
  const normalizedTitleSearchQuery =
    normalizeTitleSearchQuery(titleSearchQuery);

  const cachedIssuesPromise = issuesPromiseByTitleSearchQuery.get(
    normalizedTitleSearchQuery,
  );

  // すでに同じ検索条件のPromiseがあれば再利用する
  if (cachedIssuesPromise) {
    return cachedIssuesPromise;
  }
  // 初めて使う検索条件だけGET通信を開始する
  const issuesPromise = fetchIssues(normalizedTitleSearchQuery);

  // 通信完了を待たず、pending中のPromiseをすぐ保存する
  issuesPromiseByTitleSearchQuery.set(
    normalizedTitleSearchQuery,
    issuesPromise,
  );

  return issuesPromise;
}

/**
 * データ更新後に保存済みPromiseを破棄し、
 * 最新一覧を取得するPromiseを作り直します。
 * キャッシュの削除をする
 *
 * この関数は後のMutation検証で使用します。
 */
export function refetchIssues(
  titleSearchQuery: string,
): Promise<Issue[]> {
  // Map自体は残し、中に保存した要素だけを削除する
  issuesPromiseByTitleSearchQuery.clear()

  return getIssuesPromise(titleSearchQuery)
}
