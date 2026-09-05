/**
 * @file src/app/sitemap.ts
 * @description Next.js 14 App Router - sitemap.xml 동적 생성
 *
 * /sitemap.xml 경로로 전체 사이트맵을 직접 반환합니다.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */

import type { MetadataRoute } from "next";
import { getAllRegions } from "@/lib/machines";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://xn--2e0b29d6gb0h9r9k.kr"
).replace(/\/$/, "");

/**
 * /sitemap.xml 에 포함될 전체 URL 목록을 반환합니다.
 * 한글 경로는 sitemap 표준 규격에 맞게 encodeURI 로 인코딩됩니다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const regions = await getAllRegions();
  const now = new Date();

  // 1. 메인 홈페이지 엔트리
  const homeEntry: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  // 2. 전체 시/도 및 시/군/구 동적 경로 엔트리 (완전한 절대 경로 + encodeURI 처리)
  const regionEntries: MetadataRoute.Sitemap = regions.map(
    ({ sido, sigungu }) => ({
      url: encodeURI(`${SITE_URL}/${sido}/${sigungu}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    })
  );

  return [...homeEntry, ...regionEntries];
}
