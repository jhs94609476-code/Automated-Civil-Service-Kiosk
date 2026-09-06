/**
 * @file src/app/[sido]/[sigungu]/page.tsx
 * @description 시/도·시군구별 무인민원발급기 동적 라우트 페이지 (SSG)
 *
 * generateStaticParams → 전체 지역 사전 렌더링 (순수 한글 형태)
 * generateMetadata     → URL 디코딩 적용 및 지역 맞춤 메타데이터 동적 생성
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllRegions,
  getMachinesByRegion,
  type MachineItem,
} from "@/lib/machines";
import CoupangBanner from "@/components/CoupangBanner";
import CopyButton from "@/components/CopyButton";

// ---------------------------------------------------------------------------
// 사이트 기본 URL (환경 변수 → 기본값)
// ---------------------------------------------------------------------------
const SITE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL ??
  "https://automated-civil-service-kiosk.vercel.app"
).replace(/\/$/, "");

// ---------------------------------------------------------------------------
// URL 파라미터 안전 디코딩 헬퍼
// ---------------------------------------------------------------------------
function safeDecode(val: string): string {
  if (!val) return "";
  try {
    return decodeURIComponent(val).trim();
  } catch {
    return val.trim();
  }
}

// ---------------------------------------------------------------------------
// 타입
// ---------------------------------------------------------------------------
type PageProps = {
  params: { sido: string; sigungu: string } | Promise<{ sido: string; sigungu: string }>;
};

// ---------------------------------------------------------------------------
// 1. Static Params (SSG) – 모든 지역 사전 렌더링 (인코딩되지 않은 순수 한글)
// ---------------------------------------------------------------------------
export async function generateStaticParams() {
  const regions = await getAllRegions();
  return regions.map(({ sido, sigungu }) => ({
    sido,
    sigungu,
  }));
}

// ---------------------------------------------------------------------------
// 2. Metadata (동적 생성)
// ---------------------------------------------------------------------------
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const sido = safeDecode(resolvedParams.sido);
  const sigungu = safeDecode(resolvedParams.sigungu);

  const machines = await getMachinesByRegion(sido, sigungu);
  const count = machines.length;

  const title =
    count > 0
      ? `${sido} ${sigungu} 무인민원발급기 위치 ${count}곳 | 운영시간·주소 안내`
      : `${sido} ${sigungu} 무인민원발급기 위치 및 운영시간 안내`;

  const description =
    count > 0
      ? `${sido} ${sigungu} 무인민원발급기 ${count}개소의 위치, 도로명 주소, 운영시간을 한눈에 확인하세요. 주민등록등·초본, 가족관계등록부 등 각종 민원서류를 24시간 무인발급기에서 편리하게 출력할 수 있습니다.`
      : `${sido} ${sigungu} 무인민원발급기 위치 정보 및 운영시간 안내 페이지입니다. 주민등록등·초본, 가족관계등록부 등 민원서류 발급 관련 정보를 확인하세요.`;

  const canonicalUrl = `${SITE_URL}/${encodeURIComponent(sido)}/${encodeURIComponent(sigungu)}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      locale: "ko_KR",
      siteName: "무인민원발급기 찾기",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

// ---------------------------------------------------------------------------
// FAQ 데이터
// ---------------------------------------------------------------------------
const FAQ_LIST: { q: string; a: string }[] = [
  {
    q: "신분증 없이도 무인민원발급기를 이용할 수 있나요?",
    a: "주민등록등·초본 등 일부 서류는 지문 인식으로 신분증 없이 발급이 가능합니다. 단, 인감증명서·가족관계등록부 등 일부 서류는 주민등록증·운전면허증 또는 모바일 신분증이 필요합니다. 기기마다 지원 범위가 다를 수 있으니 현장 안내문을 확인하세요.",
  },
  {
    q: "주말이나 야간에도 무인민원발급기를 이용할 수 있나요?",
    a: "설치 장소에 따라 운영시간이 다릅니다. 지하철역·역사·대형마트 내 기기는 대부분 24시간 연중무휴이며, 주민센터·구청 내 기기는 기관 운영시간(통상 평일 09:00~18:00)을 따릅니다. 일부 주민센터는 야간·주말 무인 개방으로 더 늦게까지 이용 가능하니 현장 안내문을 확인하세요.",
  },
  {
    q: "수수료 결제는 카드로도 가능한가요?",
    a: "네, 대부분의 무인민원발급기는 신용카드·체크카드 결제를 지원합니다. 기기에 따라 현금(동전 포함) 및 삼성페이·카카오페이 등 모바일 간편결제도 지원합니다. 서류 종류별 수수료는 100~500원 수준이며, 발급 전 기기 화면에서 확인할 수 있습니다.",
  },
  {
    q: "무인민원발급기에서 발급 가능한 서류는 어떤 것이 있나요?",
    a: "주민등록등·초본, 가족관계등록부(기본·상세·특정), 인감증명서(본인), 건강보험료 납부확인서, 토지대장, 건축물대장, 지방세 납세증명서, 출입국 사실증명, 사업자등록증명 등 정부24 기준 70여 종의 민원서류를 발급받을 수 있습니다.",
  },
];

// ---------------------------------------------------------------------------
// 지역 안내 블록 (Thin Content 방지)
// ---------------------------------------------------------------------------
function RegionGuideBlock({
  sido,
  sigungu,
  machines,
}: {
  sido: string;
  sigungu: string;
  machines: MachineItem[];
}) {
  const TRANSIT_KW = ["역", "지하철", "공항", "터미널", "철도", "KTX", "SRT"];
  const hasTransit = machines.some((m) =>
    TRANSIT_KW.some((kw) => m.name.includes(kw) || m.address.includes(kw))
  );

  return (
    <section
      aria-label={`${sido} ${sigungu} 무인민원발급기 이용 안내`}
      className="rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm leading-7 text-gray-700"
    >
      <h2 className="mb-3 text-base font-bold text-blue-800">
        {sido} {sigungu} 무인민원발급기 이용 안내
      </h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>주민센터·구청 설치 기기</strong>는 기관 운영시간(평일
          09:00~18:00) 내 이용이 원칙이나, 일부 기관은 야간·주말에도 무인
          개방하여 이용 가능합니다.
        </li>
        {hasTransit && (
          <li>
            <strong>지하철역·역사 내 설치 기기</strong>는 대부분 24시간
            연중무휴로 운영되어 야간·공휴일에도 이용 가능합니다. 단, 역사
            운영시간 종료 후에는 접근이 제한될 수 있습니다.
          </li>
        )}
        <li>
          <strong>지문 인식 본인확인</strong>: 주민등록등·초본 등은 지문
          인식으로 신분증 없이 발급 가능합니다. 지문 인식이 어렵거나
          인감증명서가 필요한 경우 주민등록증·운전면허증을 지참하세요.
        </li>
        <li>
          <strong>대표 발급 서류</strong>: 주민등록등·초본, 가족관계등록부,
          인감증명서(본인), 토지·건축물대장, 지방세 납세증명서,
          건강보험료 납부확인서, 출입국 사실증명 등{" "}
          <strong>70여 종</strong>.
        </li>
        <li>
          <strong>수수료</strong>: 서류 종류에 따라 100~500원이며
          신용카드·체크카드·현금 결제 가능합니다.
        </li>
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 지도 링크 헬퍼
// ---------------------------------------------------------------------------
function buildMapLinks(machine: MachineItem) {
  if (machine.lat !== null && machine.lng !== null) {
    return {
      kakaoUrl: `https://map.kakao.com/link/to/${encodeURIComponent(machine.name)},${machine.lat},${machine.lng}`,
      naverUrl: `https://map.naver.com/v5/directions/-/-/-/transit?c=${machine.lng},${machine.lat},15,0,0,0,dh`,
      type: "coords" as const,
    };
  }
  const query = encodeURIComponent(machine.address || machine.name);
  return {
    kakaoUrl: `https://map.kakao.com/link/search/${query}`,
    naverUrl: `https://search.naver.com/search.naver?where=nexearch&query=${query}`,
    type: "search" as const,
  };
}

// ---------------------------------------------------------------------------
// 발급기 카드
// ---------------------------------------------------------------------------
function MachineCard({
  machine,
  index,
}: {
  machine: MachineItem;
  index: number;
}) {
  const { kakaoUrl, naverUrl, type } = buildMapLinks(machine);
  const mapLabel = type === "coords" ? "길찾기" : "검색";

  return (
    <article
      className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      aria-label={`${index + 1}번 발급기: ${machine.name}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900">{machine.name}</h3>
          {machine.address ? (
            <p className="mt-0.5 text-sm text-gray-500">{machine.address}</p>
          ) : (
            <p className="mt-0.5 text-sm italic text-gray-400">
              주소 정보 없음
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
          #{index + 1}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {machine.address && <CopyButton text={machine.address} />}

        <a
          href={kakaoUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${machine.name} 카카오맵 ${mapLabel}`}
          className="inline-flex items-center gap-1 rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-medium text-yellow-900 transition-colors hover:bg-yellow-500"
        >
          📍 카카오맵 {mapLabel}
        </a>

        <a
          href={naverUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${machine.name} 네이버지도 ${mapLabel}`}
          className="inline-flex items-center gap-1 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-600"
        >
          🗺️ 네이버지도 {mapLabel}
        </a>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// FAQ 아코디언 + FAQPage JSON-LD
// ---------------------------------------------------------------------------
function FaqSection({ sido, sigungu }: { sido: string; sigungu: string }) {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_LIST.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <section aria-label="자주 묻는 질문">
      {/* FAQPage JSON-LD – head에 자동 호이스팅 */}
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <h2 className="mb-4 text-lg font-bold text-gray-800">
        {sido} {sigungu} 무인민원발급기 자주 묻는 질문
      </h2>

      <div className="space-y-3">
        {FAQ_LIST.map(({ q, a }, i) => (
          <details
            key={i}
            className="group rounded-xl border border-gray-200 bg-white open:border-blue-300 open:shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-medium text-gray-800 hover:text-blue-700 [&::-webkit-details-marker]:hidden">
              <span className="pr-4">{q}</span>
              <svg
                className="h-4 w-4 shrink-0 rotate-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>
            <div className="border-t border-gray-100 px-4 py-3 text-sm leading-7 text-gray-600">
              {a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 메인 페이지 컴포넌트
// ---------------------------------------------------------------------------
export default async function SigunguPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const sido = safeDecode(resolvedParams.sido);
  const sigungu = safeDecode(resolvedParams.sigungu);

  const machines = await getMachinesByRegion(sido, sigungu);
  const count = machines.length;

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: sido,
        item: `${SITE_URL}/${encodeURIComponent(sido)}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: sigungu,
        item: `${SITE_URL}/${encodeURIComponent(sido)}/${encodeURIComponent(sigungu)}`,
      },
    ],
  };

  return (
    <>
      {/* BreadcrumbList JSON-LD */}
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* ── 헤더 ──────────────────────────────────────────────────── */}
        <header className="mb-5">
          <nav
            className="mb-3 text-xs text-gray-400"
            aria-label="브레드크럼 내비게이션"
          >
            <Link href="/" className="hover:underline">
              홈
            </Link>
            <span className="mx-1" aria-hidden="true">
              ›
            </span>
            <span>{sido}</span>
            <span className="mx-1" aria-hidden="true">
              ›
            </span>
            <span className="font-medium text-gray-600">{sigungu}</span>
          </nav>

          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-gray-900">
            {sido} {sigungu} 무인민원발급기 위치 및 운영시간 안내
          </h1>
          {count > 0 ? (
            <p className="mt-1 text-sm font-medium text-blue-600">
              총 {count}개소
            </p>
          ) : (
            <p className="mt-1 text-sm text-gray-500">
              발급기 정보 준비 중
            </p>
          )}
        </header>

        {/* ── 상단 배너 ─────────────────────────────────────────────── */}
        <CoupangBanner position="top" className="mb-8" />

        {count === 0 ? (
          /* ── 0개일 때 안내 뷰 (Fallback - 404 방지) ─────────────────── */
          <section
            className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm"
            aria-label="안내 메시지"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl">
              🏢
            </div>
            <h2 className="text-lg font-bold text-amber-900">
              현재 등록된 발급기 정보가 준비 중입니다.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-800">
              {sido} {sigungu} 지역의 무인민원발급기 위치 정보를 업데이트하고 있습니다.
              <br />
              급한 민원 서류 발급은 <strong>정부24(gov.kr)</strong> 온라인 서비스 또는
              가까운 주민센터/행정복지센터를 이용해 주시기 바랍니다.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                다른 지역 발급기 찾기
              </Link>
              <a
                href="https://www.gov.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                정부24 바로가기 ↗
              </a>
            </div>
          </section>
        ) : (
          <>
            {/* ── 지역 특화 안내 블록 ───────────────────────────────── */}
            <RegionGuideBlock sido={sido} sigungu={sigungu} machines={machines} />

            {/* ── 발급기 목록 ───────────────────────────────────────── */}
            <section className="mt-8" aria-label="발급기 목록">
              <h2 className="mb-4 text-lg font-bold text-gray-800">
                {sido} {sigungu} 발급기 목록{" "}
                <span className="text-base font-normal text-gray-500">
                  ({count}개소)
                </span>
              </h2>
              <div className="space-y-3">
                {machines.map((machine, i) => (
                  <MachineCard
                    key={`${machine.name}-${i}`}
                    machine={machine}
                    index={i}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── 중간 배너 (목록·FAQ 사이) ─────────────────────────────── */}
        <CoupangBanner position="middle" className="my-10" />

        {/* ── FAQ 아코디언 + FAQPage JSON-LD ───────────────────────── */}
        <FaqSection sido={sido} sigungu={sigungu} />

        {/* ── 하단 배너 (푸터 직전) ─────────────────────────────────── */}
        <CoupangBanner position="bottom" className="mt-10" />
      </main>
    </>
  );
}
