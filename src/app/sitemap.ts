/**
 * @file src/app/sitemap.ts
 * @description Next.js 14 App Router - sitemap.xml 동적 생성
 *
 * generateSitemaps() 를 함께 export 하면 Next.js 가 URL 50,000개 초과 시
 * /sitemap/0.xml, /sitemap/1.xml … 으로 자동 청크 분할합니다.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */

import type { MetadataRoute } from "next";
import { getAllRegions } from "@/lib/machines";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://xn--2e0b29d6gb0h9r9k.kr"
).replace(/\/$/, "");

/** Next.js 단일 sitemap 파일당 URL 최대 허용 수 */
const CHUNK_SIZE = 50_000;

// ─────────────────────────────────────────────────────────────────────────────
// generateSitemaps – 청크 분할 지원 (URL 수가 CHUNK_SIZE 초과 시 자동 분할)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 전체 URL 수를 CHUNK_SIZE 로 나눈 청크 인덱스 배열을 반환합니다.
 * Next.js 는 이 배열을 보고 sitemap() 을 id 별로 반복 호출합니다.
 *
 * URL 수가 CHUNK_SIZE 이하면 [{ id: 0 }] 을 반환하여 단일 파일로 처리합니다.
 */
export async function generateSitemaps(): Promise<{ id: number }[]> {
  const regions = await getAllRegions();
  // +1 은 홈페이지 엔트리
  const totalUrls = regions.length + 1;
  const chunkCount = Math.ceil(totalUrls / CHUNK_SIZE);
  return Array.from({ length: chunkCount }, (_, i) => ({ id: i }));
}

// ─────────────────────────────────────────────────────────────────────────────
// sitemap – 실제 URL 목록 반환
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param param.id - generateSitemaps() 에서 전달된 청크 인덱스
 *
 * id === 0 : 홈 + 첫 번째 청크 지역 URL
 * id  >  0 : 이후 청크 지역 URL
 */
export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const regions = await getAllRegions();
  const now = new Date();

  // 홈 엔트리는 첫 번째 청크(id=0)에만 포함
  const homeEntry: MetadataRoute.Sitemap = id === 0
    ? [
        {
          url: SITE_URL,
          lastModified: now,
          changeFrequency: "daily",
          priority: 1.0,
        },
      ]
    : [];

  // 청크 범위 계산
  // id=0 : 홈(1개) + 지역 0 ~ CHUNK_SIZE-2
  // id=1 : 지역 CHUNK_SIZE-1 ~ 2*(CHUNK_SIZE-1)-1  …
  const regionOffset = id === 0 ? 0 : id * CHUNK_SIZE - 1; // -1 홈 자리 보정
  const regionSlice = regions.slice(regionOffset, regionOffset + CHUNK_SIZE - (id === 0 ? 1 : 0));

  const regionEntries: MetadataRoute.Sitemap = regionSlice.map(({ sido, sigungu }) => ({
    url: `${SITE_URL}/${encodeURIComponent(sido)}/${encodeURIComponent(sigungu)}`,
    lastModified: now,
    changeFrequency: "weekly",
    // 전국 단위 지역(시/도 직속 단독 sigungu) vs 일반 시/군/구 → 동일 0.8
    priority: 0.8,
  }));

  return [...homeEntry, ...regionEntries];
}
