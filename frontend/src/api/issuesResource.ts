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
const searchStringToPromiseMap = new Map<string, Promise<Issue[]>>();

/**
 * Map前後の空白を除去し、同じ検索文字列として扱えるようにします。
 */
function trimSearchQuery(searchQuery: string) {
  return searchQuery.trim();
}
/**
 * 同じ検索条件のPromiseがあれば再利用し、
 * なければAPI通信を開始してPromiseを保存します。
 */
export function getIssuesPromise(titleSearchQuery: string): Promise<Issue[]> {
  const trimedSearchQuery =
    trimSearchQuery(titleSearchQuery);

  const cachedIssuesPromise = searchStringToPromiseMap.get(
    trimedSearchQuery
  );

  // すでに同じ検索条件のPromiseがあれば再利する
  if (cachedIssuesPromise) {
    return cachedIssuesPromise;
  }
  // 初めて使う検索条件だけGET通信を開始する
  const issuesPromise = fetchIssues(trimedSearchQuery);

  // 通信完了を待たず、pending中のPromiseをすぐ保存する
  searchStringToPromiseMap.set(trimedSearchQuery, issuesPromise);

  // Promiseがrejectした場合は、その検索条件のキャッシュを削除する
  void issuesPromise.catch(() => {
    const currentIssuesPromise =
      searchStringToPromiseMap.get(trimedSearchQuery);

    /**
     * Mapに残っているPromiseが、今回失敗したPromiseと同じ場合だけ削除する。
     *
     * 古い通信の失敗によって、後から作られた新しいPromiseを
     * 誤って削除しないために同一性を確認します。
     */
    if (currentIssuesPromise === issuesPromise) {
      searchStringToPromiseMap.delete(trimedSearchQuery);
    }
  });

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
  searchQuery: string,
): Promise<Issue[]> {
  // Map自体は残し、中に保存した要素だけを削除する
  searchStringToPromiseMap.clear();

  return getIssuesPromise(searchQuery)
}
