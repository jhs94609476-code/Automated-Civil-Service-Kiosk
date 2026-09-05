/**
 * @file src/components/CoupangBanner.tsx
 * @description 쿠팡 파트너스 수익화 배너 컴포넌트
 *
 * 세 가지 포지션(top / middle / bottom)을 지원하며,
 * 공정거래위원회 필수 문구 및 SEO 컴플라이언스 속성을 포함합니다.
 */

import Image from "next/image";

// ---------------------------------------------------------------------------
// 타입 정의
// ---------------------------------------------------------------------------

export type BannerPosition = "top" | "middle" | "bottom";

export interface CoupangBannerProps {
  position: BannerPosition;
  className?: string;
}

// ---------------------------------------------------------------------------
// 배너 설정 맵
// ---------------------------------------------------------------------------

interface BannerConfig {
  href: string;
  img: string;
  width: number;
  height: number;
  /** img alt 텍스트 (접근성) */
  alt: string;
}

const BANNER_MAP: Record<BannerPosition, BannerConfig> = {
  top: {
    href: "https://link.coupang.com/a/gNzFuGVlNA",
    img: "https://ads-partners.coupang.com/banners/1026258?trackingCode=AF5508221&subId=&traceId=V0-301-7e6e8eb8ddfa1bfb-I1026258&w=600&h=900",
    width: 600,
    height: 900,
    alt: "쿠팡 파트너스 광고 배너 (상단)",
  },
  middle: {
    href: "https://link.coupang.com/a/gNzIOQGjvM",
    img: "https://ads-partners.coupang.com/banners/1013122?trackingCode=AF5508221&subId=&traceId=V0-301-5f9bd61900e673c0-I1013122&w=728&h=90",
    width: 728,
    height: 90,
    alt: "쿠팡 파트너스 광고 배너 (중간)",
  },
  bottom: {
    href: "https://link.coupang.com/a/gNzLch0DQq",
    img: "https://ads-partners.coupang.com/banners/1026266?trackingCode=AF5508221&subId=&traceId=V0-301-2f679fc6bd8f2e58-I1026266&w=600&h=900",
    width: 600,
    height: 900,
    alt: "쿠팡 파트너스 광고 배너 (하단)",
  },
};

/** 공정거래위원회 필수 표기 문구 */
const DISCLOSURE_TEXT =
  "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";

// ---------------------------------------------------------------------------
// 컴포넌트
// ---------------------------------------------------------------------------

/**
 * 쿠팡 파트너스 배너를 렌더링합니다.
 *
 * @example
 * // 페이지 상단 배너
 * <CoupangBanner position="top" />
 *
 * // 페이지 중간 배너 (추가 클래스 적용)
 * <CoupangBanner position="middle" className="my-8" />
 */
export default function CoupangBanner({
  position,
  className = "",
}: CoupangBannerProps) {
  const config = BANNER_MAP[position];

  return (
    <figure
      aria-label="쿠팡 파트너스 광고"
      className={`flex flex-col items-center gap-1 ${className}`}
    >
      {/* ------------------------------------------------------------------ */}
      {/* 배너 링크 + 이미지                                                   */}
      {/* ------------------------------------------------------------------ */}
      <a
        href={config.href}
        target="_blank"
        rel="nofollow sponsored"
        referrerPolicy="unsafe-url"
        aria-label={config.alt}
        className="block w-full"
      >
        {/*
         * next/image 를 사용해 WebP 자동 변환 및 lazy-load 이점을 활용합니다.
         * unoptimized 는 외부 CDN 이미지를 next.config 의 remotePatterns 없이
         * 렌더링하기 위한 옵션입니다.
         */}
        <Image
          src={config.img}
          alt={config.alt}
          width={config.width}
          height={config.height}
          unoptimized
          className="mx-auto h-auto max-w-full"
          loading="lazy"
        />
      </a>

      {/* ------------------------------------------------------------------ */}
      {/* 공정위 필수 표기 문구                                                  */}
      {/* ------------------------------------------------------------------ */}
      <figcaption className="text-center text-xs text-gray-500">
        {DISCLOSURE_TEXT}
      </figcaption>
    </figure>
  );
}
