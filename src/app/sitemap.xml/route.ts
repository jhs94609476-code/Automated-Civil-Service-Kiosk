/**
 * @file src/app/sitemap.xml/route.ts
 * @description Next.js 14 App Router - Route Handler 방식 sitemap.xml 정적 XML 출력
 *
 * MetadataRoute.Sitemap 내장 방식 대신 순수 XML 문자열 템플릿 리터럴로 직접 생성하여
 * 네이버 서치어드바이저 / 구글 서치콘솔의 파서 호환성을 완벽하게 보장합니다.
 *
 * - <?xml …?> 선언 앞 공백 없음 보장 (trim() 적용)
 * - 한글 URL은 encodeURI()로 퍼센트 인코딩
 * - <lastmod>는 YYYY-MM-DD (ISO-8601) 형식
 * - Content-Type: application/xml; charset=utf-8
 *
 * @see https://sitemaps.org/protocol.html
 */

import { getAllRegions } from "@/lib/machines";

const SITE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL ??
  "https://automated-civil-service-kiosk.vercel.app"
).replace(/\/$/, "");

/** GET /sitemap.xml */
export async function GET(): Promise<Response> {
  const regions = await getAllRegions();
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // ── 홈 엔트리 ──────────────────────────────────────────────────────────────
  const homeUrl = `${SITE_URL}/`;

  // ── 지역별 URL 엔트리 ───────────────────────────────────────────────────────
  const regionEntries = regions
    .map(({ sido, sigungu }) => {
      // 한글 경로를 반드시 퍼센트 인코딩 (네이버·구글 파서 호환)
      const encodedUrl = encodeURI(`${SITE_URL}/${sido}/${sigungu}`);
      return `  <url>
    <loc>${encodedUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join("\n");

  // ── 최종 XML 조립 ──────────────────────────────────────────────────────────
  // trim()으로 앞뒤 공백·개행 제거 → 첫 글자가 반드시 '<' 가 되도록 보장
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${homeUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${regionEntries}
</urlset>`.trim();

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // 캐시: 빌드 직후 CDN에 12시간, 이후 백그라운드 재검증
      "Cache-Control": "public, max-age=43200, stale-while-revalidate=86400",
    },
  });
}
