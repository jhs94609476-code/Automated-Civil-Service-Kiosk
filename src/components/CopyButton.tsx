/**
 * @file src/components/CopyButton.tsx
 * @description 주소 원클릭 복사 버튼 (클라이언트 컴포넌트)
 *
 * Clipboard API 우선 사용, 미지원 브라우저는 execCommand fallback 처리.
 */
"use client";

import { useState } from "react";

interface CopyButtonProps {
  /** 클립보드에 복사할 텍스트 */
  text: string;
}

export default function CopyButton({ text }: CopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback: 구형 브라우저 대응
        const el = document.createElement("textarea");
        el.value = text;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setStatus("copied");
    } catch {
      setStatus("error");
    } finally {
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      aria-label={
        status === "copied"
          ? "주소가 클립보드에 복사되었습니다"
          : "주소를 클립보드에 복사"
      }
      className={[
        "inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
        status === "copied"
          ? "border-green-400 bg-green-50 text-green-700"
          : status === "error"
          ? "border-red-300 bg-red-50 text-red-600"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
      ].join(" ")}
    >
      {status === "copied" ? (
        <>✓ 복사됨!</>
      ) : status === "error" ? (
        <>✗ 복사 실패</>
      ) : (
        <>📋 주소 복사</>
      )}
    </button>
  );
}
