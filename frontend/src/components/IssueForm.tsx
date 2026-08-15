import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createIssue } from "../api/issues";
import type { Ref } from "react";

type IssueFormProps = {
  /** Issue作成成功後に、親で一覧を再取得する処理です。 */
  onCreated: () => void;
  /** 親からタイトル入力欄を参照するためのrefです。 */
  ref?: Ref<HTMLInputElement>;
};

type CreateIssueActionState = {
  error: string | null;
};

const initialActionState: CreateIssueActionState = {
  error: null,
};

/** 親フォームの送信状態を読み、送信中の表示と連続操作を制御します。 */
function IssueSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="primary-button"
      type="submit"
      disabled={disabled || pending}
    >
      {pending ? (
        <>
          <span className="spinner" aria-hidden="true" />
          追加中
        </>
      ) : (
        "Issueを追加"
      )}
    </button>
  );
}

/**
 * Issueタイトルを入力して送信するフォーム。
 * Actionの戻り値とpendingをReact 19のフォームAPIへ接続します。
 */
export function IssueForm({ onCreated, ref }: IssueFormProps) {
  // API失敗時に入力値を保持するため、タイトルはcontrolled inputにします。
  const [title, setTitle] = useState("");

  async function createIssueAction(
    _previousState: CreateIssueActionState,
    formData: FormData,
  ): Promise<CreateIssueActionState> {
    const titleValue = formData.get("title");
    const nextTitle = typeof titleValue === "string" ? titleValue.trim() : "";

    if (!nextTitle) {
      return { error: "Issueのタイトルを入力してください" };
    }

    try {
      await createIssue(nextTitle);
    } catch (error) {
      // APIが返す既知の失敗はActionのstateとしてフォーム内へ表示します。
      return {
        error:
          error instanceof Error ? error.message : "Issueの追加に失敗しました",
      };
    }

    // POST成功後に入力欄を空にし、親へ一覧の再取得を依頼します。
    setTitle("");
    onCreated();

    return { error: null };
  }

  const [actionState, formAction, isPending] = useActionState(
    createIssueAction,
    initialActionState,
  );

  return (
    <section className="panel compose-panel" aria-labelledby="new-issue-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">CREATE</p>
          <h2 id="new-issue-title">新しいIssue</h2>
        </div>
        <span className="manual-state">Action pending state</span>
      </div>

      <form action={formAction} aria-busy={isPending}>
        <label htmlFor="issue-title">タイトル</label>
        <div className="form-row">
          <input
            ref={ref}
            id="issue-title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例: 検索結果の並び順を保存したい"
            autoComplete="off"
            disabled={isPending}
            required
          />
          <IssueSubmitButton disabled={title.trim().length === 0} />
        </div>

        <p className="form-hint">
          タイトルに <code>fail</code> を含めると失敗を再現できます。
        </p>
        <br />

        {/* APIエラーはスクリーンリーダーにも即時通知します。 */}
        {actionState.error && (
          <p className="inline-error" role="alert">
            {actionState.error}
          </p>
        )}
      </form>
    </section>
  );
}
