/**
 * @file src/app/rss.xml/route.ts
 * @description RSS 2.0 피드 Route Handler
 *
 * /rss.xml 경로에서 서빙됩니다.
 * 네이버·구글 서치콘솔 색인 보조 및 구독 독자용 피드를 제공합니다.
 *
 * - dynamic = 'force-static' : 빌드 시 한 번만 생성 → 정적 파일로 캐싱
 * - revalidate = 86400       : ISR 24h 재생성 (배포 환경)
 */

import { getAllRegions } from "@/lib/machines";

// Next.js 14 Route Handler 정적 캐싱 선언
export const dynamic   = "force-static";
export const revalidate = 86400; // 24시간

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://xn--2e0b29d6gb0h9r9k.kr"
).replace(/\/$/, "");

const FEED_TITLE       = "무인민원발급기 찾기 | 전국 위치·운영시간 안내";
const FEED_DESCRIPTION =
  "전국 무인민원발급기 위치, 도로명 주소, 운영시간을 시/도·시군구별로 확인하세요. " +
  "주민등록등·초본, 가족관계등록부 등 각종 민원서류를 24시간 편리하게 발급받을 수 있습니다.";

/** XML 특수문자 이스케이프 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&apos;");
}

export async function GET(): Promise<Response> {
  const regions   = await getAllRegions();
  const buildDate = new Date().toUTCString();

  // ── <item> 목록 생성 ───────────────────────────────────────────────────
  const items = regions
    .map(({ sido, sigungu }) => {
      const url         = `${SITE_URL}/${encodeURIComponent(sido)}/${encodeURIComponent(sigungu)}`;
      const title       = escapeXml(`${sido} ${sigungu} 무인민원발급기 위치 및 운영시간 안내`);
      const description = escapeXml(
        `${sido} ${sigungu} 지역 무인민원발급기 위치, 도로명 주소, 운영시간 안내. ` +
        "주민등록등·초본, 가족관계등록부, 인감증명서 등 각종 민원서류를 24시간 발급받을 수 있습니다."
      );

      return [
        "    <item>",
        `      <title>${title}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${buildDate}</pubDate>`,
        `      <description>${description}</description>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  // ── RSS 2.0 XML 문서 조립 ──────────────────────────────────────────────
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0"',
    '     xmlns:atom="http://www.w3.org/2005/Atom"',
    '     xmlns:content="http://purl.org/rss/1.0/modules/content/">',
    "  <channel>",
    `    <title>${escapeXml(FEED_TITLE)}</title>`,
    `    <link>${SITE_URL}</link>`,
    `    <description>${escapeXml(FEED_DESCRIPTION)}</description>`,
    "    <language>ko</language>",
    `    <lastBuildDate>${buildDate}</lastBuildDate>`,
    `    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />`,
    items,
    "  </channel>",
    "</rss>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type":  "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
