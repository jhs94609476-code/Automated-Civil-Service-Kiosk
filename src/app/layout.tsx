/**
 * @file src/app/layout.tsx
 * @description Next.js 루트 레이아웃 – 사이트 공통 <html>/<body> 구조 및 검색엔진 소유권 인증
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "무인민원발급기 찾기 | 전국 위치·운영시간 안내",
    template: "%s | 무인민원발급기 찾기",
  },
  description:
    "전국 무인민원발급기 위치, 운영시간, 도로명 주소를 시/도·시군구별로 한눈에 확인하세요.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ??
    "https://automated-civil-service-kiosk.vercel.app"
  ),
  verification: {
    google: "hNvXWg0ehlmQ3dY5uT1fMkwxAk104_EY265xnfmCVfg",
    other: {
      "naver-site-verification": "9a4d36e3ab70e0214dad362ab618e8b63fe91767",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${inter.className} min-h-screen bg-gray-50 text-gray-900 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
