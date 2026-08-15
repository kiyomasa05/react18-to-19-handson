import { useCallback, useState } from "react";

export function RefCleanupDemo() {
  const [isInputVisible, setIsInputVisible] = useState(true);

  const observeInput = useCallback((node: HTMLInputElement | null) => {
    if (!node) return;

    console.log("[ref] 入力欄の監視を開始");

    const observer = new ResizeObserver(() => {
      console.log("[ref] 入力欄のサイズが変わりました");
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
      console.log("[ref] 入力欄の監視を終了");
    };
  }, []);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsInputVisible((isVisible) => !isVisible)}
      >
        {isInputVisible ? "入力欄を隠す" : "入力欄を表示する"}
      </button>

      {isInputVisible && (
        <input ref={observeInput} placeholder="ref cleanupの確認用" />
      )}
    </div>
  );
}
