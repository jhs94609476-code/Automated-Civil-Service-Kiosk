/**
 * @file src/app/robots.ts
 * @description Next.js 14 App Router - robots.txt 자동 생성
 *
 * 빌드 시 /robots.txt 경로로 서빙됩니다.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */

import type { MetadataRoute } from "next";

const SITE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL ??
  "https://automated-civil-service-kiosk.vercel.app"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // 내부 API 경로, Next.js 정적 파일 경로 등 불필요한 크롤링 차단
        disallow: ["/api/", "/_next/", "/static/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
