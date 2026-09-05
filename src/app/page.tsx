/**
 * @file src/app/page.tsx
 * @description 홈 페이지 – 시/도·시군구 지역 브라우저 (pSEO 진입점)
 */

import type { Metadata } from "next";
import Link from "next/link";
import { getSidoList, getSigunguList } from "@/lib/machines";

export const metadata: Metadata = {
  title: "전국 무인민원발급기 찾기 | 지역별 위치·운영시간 안내",
  description:
    "전국 무인민원발급기 위치와 운영시간을 시/도·시군구별로 검색하세요. 주민등록등초본, 가족관계등록부 등 각종 민원서류를 가까운 발급기에서 편리하게 출력할 수 있습니다.",
};

// ─── 시/도 섹션 (비동기 서버 컴포넌트) ─────────────────────────────────────
async function SidoSection({ sido }: { sido: string }) {
  const sigungus = await getSigunguList(sido);

  return (
    <details className="group rounded-xl border border-gray-200 bg-white open:border-blue-200 open:shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-semibold text-gray-800 hover:text-blue-700 [&::-webkit-details-marker]:hidden">
        <span>{sido}</span>
        <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600">
          {sigungus.length}개 지역
        </span>
      </summary>
      <div className="flex flex-wrap gap-2 border-t border-gray-100 px-5 py-4">
        {sigungus.map((sigungu) => (
          <Link
            key={sigungu}
            href={`/${encodeURIComponent(sido)}/${encodeURIComponent(sigungu)}`}
            className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
          >
            {sigungu}
          </Link>
        ))}
      </div>
    </details>
  );
}

// ─── 홈 페이지 ──────────────────────────────────────────────────────────────
export default async function HomePage() {
  const sidos = await getSidoList();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* 헤더 */}
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          무인민원발급기 찾기
        </h1>
        <p className="mt-2 text-gray-500">
          지역을 선택하면 근처 무인민원발급기 위치와 운영시간을 바로 확인할 수 있습니다.
        </p>
      </header>

      {/* 시/도 목록 */}
      <div className="space-y-2">
        {sidos.map((sido) => (
          <SidoSection key={sido} sido={sido} />
        ))}
      </div>

      {/* 푸터 안내 */}
      <footer className="mt-12 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
        <p>
          본 사이트는 공공데이터를 기반으로 제공되며, 실제 운영 상황과 다를 수 있습니다.
        </p>
      </footer>
    </main>
  );
}
