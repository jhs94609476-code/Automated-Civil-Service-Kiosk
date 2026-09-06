/**
 * @file src/app/rss.xml/route.ts
 * @description RSS 2.0 피드 Route Handler
 *
 * 네이버 서치어드바이저 / 구글 서치콘솔 파서가 요구하는 완전한 RSS 2.0 표준 규격으로
 * 순수 XML 문자열 템플릿 리터럴을 직접 조립하여 반환합니다.
 *
 * 보장 사항:
 *  - <?xml …?> 선언이 출력 첫 문자로 위치 (trim() 적용)
 *  - <rss version="2.0" xmlns:atom="…"> 루트 네임스페이스 선언
 *  - 한글 URL → encodeURI() 적용 (파서 파싱 오류 방지)
 *  - XML 특수문자(&, <, >, ", ') → escapeXml() 치환
 *  - <lastBuildDate> / <pubDate> → RFC 822 UTC 형식 (toUTCString())
 *  - Content-Type: application/xml; charset=utf-8 명시
 *
 * @see https://www.rssboard.org/rss-specification
 * @see https://searchadvisor.naver.com/guide/seo-basic-rss
 */

import { getAllRegions } from "@/lib/machines";

const SITE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL ??
  "https://automated-civil-service-kiosk.vercel.app"
).replace(/\/$/, "");

const FEED_TITLE = "무인민원발급기 찾기 | 전국 위치·운영시간 안내";
const FEED_DESCRIPTION =
  "전국 무인민원발급기 위치, 도로명 주소, 운영시간을 시/도·시군구별로 확인하세요. " +
  "주민등록등·초본, 가족관계등록부 등 각종 민원서류를 24시간 편리하게 발급받을 수 있습니다.";

// ---------------------------------------------------------------------------
// 헬퍼: XML 특수문자 이스케이프
// ---------------------------------------------------------------------------

/**
 * XML 텍스트 노드·속성값 내 5개 예약 문자를 엔티티로 치환합니다.
 * 순서: & 먼저 치환하여 이중 치환 방지.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ---------------------------------------------------------------------------
// GET /rss.xml
// ---------------------------------------------------------------------------

export async function GET(): Promise<Response> {
  const regions = await getAllRegions();
  const buildDate = new Date().toUTCString(); // RFC 822 형식 (네이버 파서 필수)

  // ── <item> 노드 구성 ──────────────────────────────────────────────────────
  const itemNodes = regions
    .map(({ sido, sigungu }) => {
      // 한글 경로 퍼센트 인코딩 → 파서 파싱 오류 방지
      const url = encodeURI(`${SITE_URL}/${sido}/${sigungu}`);
      const title = escapeXml(
        `${sido} ${sigungu} 무인민원발급기 위치 및 운영시간`
      );
      const description = escapeXml(
        `${sido} ${sigungu} 무인민원발급기 설치 장소, 운영시간, 발급 가능 서류 정보`
      );

      return `    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${description}</description>
      <pubDate>${buildDate}</pubDate>
    </item>`;
    })
    .join("\n");

  // ── RSS 2.0 XML 조립 ──────────────────────────────────────────────────────
  // trim()으로 앞뒤 공백·개행 제거 → 첫 문자가 반드시 '<' 가 되도록 보장
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>ko-KR</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${itemNodes}
  </channel>
</rss>`.trim();

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
