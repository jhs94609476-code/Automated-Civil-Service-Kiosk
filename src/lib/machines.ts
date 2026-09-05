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

  const trimmed = address.trim();

  // 토큰 분리 (공백 기준)
  const tokens = trimmed.split(/\s+/);
  if (tokens.length < 2) {
    return { sido: UNKNOWN, sigungu: UNKNOWN };
  }

  // 시/도 추출 정규식
  // 순서가 중요함 – 더 긴(구체적인) 패턴을 앞에 배치
  const SIDO_PATTERN =
    /^.+(특별자치도|통합특별시|특별자치시|특별시|광역시|도)$/;

  // 시/군/구 추출 정규식 (복합행정구역명 포함)
  // 예: "수원시", "거제시", "고성군", "영통구"
  const SIGUNGU_PATTERN = /^.+(시|군|구)$/;

  let sido = UNKNOWN;
  let sigungu = UNKNOWN;

  // 첫 번째 토큰에서 시/도 추출
  if (SIDO_PATTERN.test(tokens[0])) {
    sido = tokens[0];
  } else {
    // 광역시·특별시 단어가 포함됐으나 붙어 있는 경우 fallback
    const sidoMatch = trimmed.match(
      /^([^\s]+(특별자치도|통합특별시|특별자치시|특별시|광역시|도))/
    );
    if (sidoMatch) {
      sido = sidoMatch[1];
    }
  }

  // 두 번째 토큰부터 시/군/구 탐색
  for (let i = 1; i < tokens.length; i++) {
    // 괄호·대괄호 안의 내용은 부가 정보이므로 제거
    const cleaned = tokens[i].replace(/[(\[（【].*$/, "");
    if (SIGUNGU_PATTERN.test(cleaned)) {
      sigungu = cleaned;
      break;
    }
  }

  return { sido, sigungu };
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
 *
 * @example
 *   const sidos = await getSidoList();
 *   // ["경기도", "경상남도", "서울특별시", …]
 */
export async function getSidoList(): Promise<string[]> {
  const parsed = await getParsedMachines();
  const set = new Set(parsed.map((m) => m.sido));
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ko"));
}

/**
 * 특정 시/도에 속하는 고유 시/군/구 목록을 오름차순으로 반환합니다.
 *
 * @param sido - 조회할 시/도 이름 (예: "경기도")
 *
 * @example
 *   const list = await getSigunguList("경기도");
 *   // ["수원시", "안산시", "양평군", …]
 */
export async function getSigunguList(sido: string): Promise<string[]> {
  const parsed = await getParsedMachines();
  const set = new Set(
    parsed.filter((m) => m.sido === sido).map((m) => m.sigungu)
  );
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ko"));
}

/**
 * 시/도 + 시/군/구 조합에 해당하는 발급기 목록을 반환합니다.
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
  const parsed = await getParsedMachines();
  return parsed
    .filter((m) => m.sido === sido && m.sigungu === sigungu)
    .map(({ name, address, lat, lng }) => ({ name, address, lat, lng }));
}

/**
 * Next.js generateStaticParams 등 정적 경로 생성에 사용할
 * 모든 { sido, sigungu } 조합을 반환합니다.
 *
 * 중복 제거 후 sido → sigungu 순으로 정렬합니다.
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
    const key = `${sido}__${sigungu}`;
    if (!seen.has(key)) {
      seen.add(key);
      regions.push({ sido, sigungu });
    }
  }

  return regions.sort((a, b) => {
    const sidoCmp = a.sido.localeCompare(b.sido, "ko");
    return sidoCmp !== 0 ? sidoCmp : a.sigungu.localeCompare(b.sigungu, "ko");
  });
}
