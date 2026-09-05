/**
 * @file src/lib/machines.ts
 * @description 무인민원발급기 데이터 로드·파싱 유틸리티 모듈
 *
 * civil_machines.json 파일을 읽어 지역(시/도, 시/군/구) 기반으로
 * 계층화된 조회를 제공합니다.
 */

import { promises as fs } from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// 타입 정의
// ---------------------------------------------------------------------------

/** civil_machines.json 의 단일 항목을 나타내는 공개 인터페이스 */
export interface MachineItem {
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
}

/** JSON 파일의 원본 레코드 구조 (파싱 전 내부 타입) */
interface RawMachineRecord {
  name?: unknown;
  address?: unknown;
  lat?: unknown;
  lng?: unknown;
  hours?: unknown;
  [key: string]: unknown;
}

/** 지역(시/도 + 시/군/구) 조합 */
export interface RegionPair {
  sido: string;
  sigungu: string;
}

// ---------------------------------------------------------------------------
// 주소 파싱 헬퍼
// ---------------------------------------------------------------------------

/**
 * 한국 행정구역 주소에서 시/도, 시/군/구를 추출합니다.
 *
 * 지원하는 시/도 접미사:
 *   특별시, 광역시, 특별자치시, 특별자치도, 통합특별시, 도
 *
 * 지원하는 시/군/구 접미사:
 *   시, 군, 구
 *
 * @example
 *   parseAddress("경기도 수원시 영통구 …")
 *   // → { sido: "경기도", sigungu: "수원시" }
 *
 *   parseAddress("서울특별시 강남구 …")
 *   // → { sido: "서울특별시", sigungu: "강남구" }
 *
 *   parseAddress("불완전한 주소")
 *   // → { sido: "기타", sigungu: "기타" }
 */
function parseAddress(address: string): { sido: string; sigungu: string } {
  const UNKNOWN = "기타";

  // 빈 문자열·null·undefined 방어
  if (!address || typeof address !== "string" || address.trim() === "") {
    return { sido: UNKNOWN, sigungu: UNKNOWN };
  }

  // 보이지 않는 특수 유니코드 문자 및 연속 공백 정규화
  const normalized = address
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // 토큰 분리 (공백 기준)
  const tokens = normalized.split(" ");
  if (tokens.length < 2) {
    return { sido: UNKNOWN, sigungu: UNKNOWN };
  }

  // 시/도 추출 정규식
  const SIDO_PATTERN =
    /^.+(특별자치도|통합특별시|특별자치시|특별시|광역시|도)$/;

  // 시/군/구 추출 정규식
  const SIGUNGU_PATTERN = /^.+(시|군|구)$/;

  let sido = UNKNOWN;
  let sigungu = UNKNOWN;

  // 첫 번째 토큰 정규화 (특수문자 제거 및 오타 보정)
  const firstCleaned = tokens[0].replace(/[^\w가-힣]/g, "").trim();
  const sidoNormalized = firstCleaned === "경상남남" ? "경상남도" : firstCleaned;

  if (SIDO_PATTERN.test(sidoNormalized)) {
    sido = sidoNormalized;
  } else {
    // 광역시·특별시 단어가 포함됐으나 붙어 있는 경우 fallback
    const sidoMatch = normalized.match(
      /^([^\s]+(특별자치도|통합특별시|특별자치시|특별시|광역시|도))/
    );
    if (sidoMatch) {
      sido = sidoMatch[1].replace(/[^\w가-힣]/g, "").trim();
    }
  }

  // 두 번째 토큰부터 시/군/구 탐색
  for (let i = 1; i < tokens.length; i++) {
    // 괄호·대괄호 안의 내용 및 특수문자 정규화
    let cleaned = tokens[i]
      .replace(/[(\[（【].*$/, "")
      .replace(/[^\w가-힣]/g, "")
      .trim();

    // '구청', '시청', '군청'으로 끝나는 경우 시/군/구로 보정 (예: 계양구청 -> 계양구)
    if (/^[가-힣]+(구|시|군)청$/.test(cleaned)) {
      cleaned = cleaned.replace(/청$/, "");
    }

    // 데이터셋 내 알려진 오타 보정 (예: 북국 -> 북구)
    if (cleaned === "북국") {
      cleaned = "북구";
    }

    if (SIGUNGU_PATTERN.test(cleaned)) {
      sigungu = cleaned;
      break;
    }
  }

  return { sido: sido.trim(), sigungu: sigungu.trim() };
}

// ---------------------------------------------------------------------------
// 데이터 로드 (서버 전용 – fs 사용)
// ---------------------------------------------------------------------------

/** 파일 경로는 프로젝트 루트의 civil_machines.json */
const DATA_FILE_PATH = path.join(process.cwd(), "civil_machines.json");

/**
 * civil_machines.json 을 읽어 MachineItem 배열로 반환합니다.
 * 잘못된 레코드는 조용히 건너뜁니다.
 *
 * @throws 파일이 없거나 JSON 파싱에 실패하면 에러를 던집니다.
 */
export async function loadMachines(): Promise<MachineItem[]> {
  const raw = await fs.readFile(DATA_FILE_PATH, "utf-8");
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("civil_machines.json 최상위 구조가 배열이 아닙니다.");
  }

  const items: MachineItem[] = [];

  for (const record of parsed as RawMachineRecord[]) {
    // 필수 필드 방어
    const name =
      typeof record.name === "string" && record.name.trim()
        ? record.name.trim()
        : "이름 없음";

    const address =
      typeof record.address === "string" ? record.address.trim() : "";

    const lat =
      typeof record.lat === "number" && isFinite(record.lat)
        ? record.lat
        : null;

    const lng =
      typeof record.lng === "number" && isFinite(record.lng)
        ? record.lng
        : null;

    items.push({ name, address, lat, lng });
  }

  return items;
}

// ---------------------------------------------------------------------------
// 지역 파싱 캐시 (모듈 스코프 – 프로세스 내 재사용)
// ---------------------------------------------------------------------------

/**
 * 각 MachineItem 에 sido/sigungu 를 붙인 내부 구조.
 * 최초 호출 시 한 번만 파싱하고 이후엔 캐시를 반환합니다.
 */
interface ParsedMachine extends MachineItem {
  sido: string;
  sigungu: string;
}

let _cachedParsed: ParsedMachine[] | null = null;

async function getParsedMachines(): Promise<ParsedMachine[]> {
  if (_cachedParsed) return _cachedParsed;

  const machines = await loadMachines();
  _cachedParsed = machines.map((m) => {
    const { sido, sigungu } = parseAddress(m.address);
    return { ...m, sido, sigungu };
  });

  return _cachedParsed;
}

// ---------------------------------------------------------------------------
// 공개 API
// ---------------------------------------------------------------------------

/**
 * 데이터 전체에서 고유한 시/도 목록을 오름차순으로 반환합니다.
 * 빈 값 및 '기타'는 제외합니다.
 *
 * @example
 *   const sidos = await getSidoList();
 *   // ["경기도", "경상남도", "서울특별시", …]
 */
export async function getSidoList(): Promise<string[]> {
  const parsed = await getParsedMachines();
  const set = new Set(
    parsed
      .map((m) => m.sido.trim())
      .filter((s) => s && s !== "기타")
  );
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ko"));
}

/**
 * 특정 시/도에 속하는 고유 시/군/구 목록을 오름차순으로 반환합니다.
 * 빈 값 및 '기타'는 제외합니다.
 *
 * @param sido - 조회할 시/도 이름 (예: "경기도")
 *
 * @example
 *   const list = await getSigunguList("경기도");
 *   // ["수원시", "안산시", "양평군", …]
 */
export async function getSigunguList(sido: string): Promise<string[]> {
  const normSido = (sido ?? "").trim();
  const parsed = await getParsedMachines();
  const set = new Set(
    parsed
      .filter((m) => m.sido.trim() === normSido)
      .map((m) => m.sigungu.trim())
      .filter((g) => g && g !== "기타")
  );
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ko"));
}

/**
 * 시/도 + 시/군/구 조합에 해당하는 발급기 목록을 반환합니다.
 * 앞뒤 공백을 안전하게 제거(trim)하여 비교합니다.
 *
 * @param sido    - 시/도 이름 (예: "서울특별시")
 * @param sigungu - 시/군/구 이름 (예: "강남구")
 *
 * @example
 *   const machines = await getMachinesByRegion("서울특별시", "강남구");
 */
export async function getMachinesByRegion(
  sido: string,
  sigungu: string
): Promise<MachineItem[]> {
  const normSido = (sido ?? "").trim();
  const normSigungu = (sigungu ?? "").trim();
  const parsed = await getParsedMachines();
  return parsed
    .filter((m) => m.sido.trim() === normSido && m.sigungu.trim() === normSigungu)
    .map(({ name, address, lat, lng }) => ({ name, address, lat, lng }));
}

/**
 * Next.js generateStaticParams 등 정적 경로 생성에 사용할
 * 모든 { sido, sigungu } 조합을 반환합니다.
 *
 * 빈 문자열, undefined, null, '기타' 값을 엄격히 필터링하고
 * sido → sigungu 순으로 정렬합니다.
 *
 * @example
 *   export async function generateStaticParams() {
 *     return getAllRegions();
 *   }
 */
export async function getAllRegions(): Promise<RegionPair[]> {
  const parsed = await getParsedMachines();

  const seen = new Set<string>();
  const regions: RegionPair[] = [];

  for (const { sido, sigungu } of parsed) {
    const s = (sido ?? "").trim();
    const g = (sigungu ?? "").trim();

    // 유효성 검증: 빈 값, undefined, null, '기타' 제외
    if (!s || !g || s === "기타" || g === "기타") {
      continue;
    }

    const key = `${s}__${g}`;
    if (!seen.has(key)) {
      seen.add(key);
      regions.push({ sido: s, sigungu: g });
    }
  }

  return regions
    .filter(
      (r) =>
        Boolean(r.sido) &&
        Boolean(r.sigungu) &&
        r.sido.trim().length > 0 &&
        r.sigungu.trim().length > 0 &&
        r.sido !== "기타" &&
        r.sigungu !== "기타"
    )
    .sort((a, b) => {
      const sidoCmp = a.sido.localeCompare(b.sido, "ko");
      return sidoCmp !== 0 ? sidoCmp : a.sigungu.localeCompare(b.sigungu, "ko");
    });
}
