import { Component, type ReactNode } from "react";

type IssueErrorBoundaryProps = {
  /** 正常時に表示する子コンポーネントです。 */
  children: ReactNode;

  /**
   * Promiseが変わったことを検知する値です。
   * 後でissuesPromiseをそのまま渡します。
   */
  resetKey: unknown;

  /**
   * エラー発生時に表示するUIです。
   * 集計と一覧で異なるエラーUIを渡せるよう、関数で受け取ります。
   */
  fallback: (error: Error) => ReactNode;
};

type IssueErrorBoundaryState = {
  /** 子コンポーネントから送られたエラーを保持します。 */
  error: Error | null;
};

/**
 * Issue一覧の描画中に発生したエラーを受け止め、
 * 通常UIの代わりにfallbackを表示するError Boundaryです。
 */
export class IssueErrorBoundary extends Component<
  IssueErrorBoundaryProps,
  IssueErrorBoundaryState
> {
  state: IssueErrorBoundaryState = {
    error: null,
  };

  /**
   * 子コンポーネントの描画でエラーが発生するとReactから呼ばれます。
   * エラーをstateへ保存し、次のrenderでfallbackへ切り替えます。
   */
  static getDerivedStateFromError(error: unknown): IssueErrorBoundaryState {
    return {
      error:
        error instanceof Error
          ? error
          : new Error("Issue一覧の取得に失敗しました"),
    };
  }

  /**
   * Appから渡されたPromiseが変わったら、
   * 保存していたエラーを消して子コンポーネントを再表示します。
   */
  componentDidUpdate(previousProps: IssueErrorBoundaryProps) {
    const hasPromiseChanged = previousProps.resetKey !== this.props.resetKey;

    if (this.state.error && hasPromiseChanged) {
      this.setState({ error: null });
    }
  }

  render() {
    // エラーがあれば、子コンポーネントの代わりにエラーUIを返す
    if (this.state.error) {
      return this.props.fallback(this.state.error);
    }

    // 正常時はIssueStatsやIssueBoardをそのまま表示する
    return this.props.children;
  }
}
