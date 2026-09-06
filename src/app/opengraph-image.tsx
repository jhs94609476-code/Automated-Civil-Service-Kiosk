import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = '전국 무인민원발급기 위치 안내';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #1e293b, #0f172a)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: '100px', marginBottom: '20px' }}>📄</div>
        <div
          style={{
            fontSize: '64px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '20px',
          }}
        >
          전국 무인민원발급기 위치 안내
        </div>
        <div
          style={{
            fontSize: '32px',
            color: '#38bdf8',
            marginBottom: '40px',
          }}
        >
          내 주변 가장 가까운 발급기 위치 · 운영시간 · 발급서류 즉시 확인
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '12px 24px',
            borderRadius: '9999px',
            color: 'white',
            fontSize: '24px',
          }}
        >
          주민센터 · 지하철역 24시간 발급기 완벽 정리
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
