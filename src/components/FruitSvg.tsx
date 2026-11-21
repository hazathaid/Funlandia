/**
 * Ilustrasi buah sebagai SVG inline.
 * Alasan: semua aset wajib masuk bundle (tanpa CDN / tanpa network request),
 * dan SVG tetap tajam di semua ukuran layar.
 */
const OUTLINE = '#2B2D42';

export interface FruitSvgProps {
  fruit: string;
  className?: string;
}

function Apel() {
  return (
    <>
      <path
        d="M32 20C22 10 8 16 8 32c0 16 12 26 24 26s24-10 24-26c0-16-14-22-24-12Z"
        fill="#EF476F"
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M32 20c0-6 2-10 6-12" fill="none" stroke={OUTLINE} strokeWidth="4" strokeLinecap="round" />
      <path d="M38 10c6-4 12-2 12-2s-2 8-9 8c-3 0-3-4-3-6Z" fill="#06D6A0" stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="21" cy="30" rx="5" ry="7" fill="#FFFFFF" opacity="0.35" />
    </>
  );
}

function Pisang() {
  return (
    <>
      <path
        d="M13 22c-4 12 2 26 16 30 12 3 22-4 24-12 1-4-2-6-5-4-4 4-9 6-15 4-7-2-11-8-11-14 0-4-4-6-9-4Z"
        fill="#FFD166"
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M13 22c0-3 1-5 3-6" fill="none" stroke={OUTLINE} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M46 42c2 1 5 1 7-1" fill="none" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
    </>
  );
}

function Jeruk() {
  return (
    <>
      <circle cx="32" cy="35" r="21" fill="#FFB703" stroke={OUTLINE} strokeWidth="3" />
      <path d="M32 14c0-4 2-7 5-8" fill="none" stroke={OUTLINE} strokeWidth="4" strokeLinecap="round" />
      <path d="M36 12c5-4 12-3 12-3s-2 9-9 9c-3 0-4-3-3-6Z" fill="#06D6A0" stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M32 20v30M18 28l28 14M46 28 18 42" stroke="#FFFFFF" strokeWidth="2" opacity="0.35" />
    </>
  );
}

function Stroberi() {
  return (
    <>
      <path
        d="M32 58C19 53 11 41 13 30c2-9 11-11 19-5 8-6 17-4 19 5 2 11-6 23-19 28Z"
        fill="#EF476F"
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M32 25c-2-6-8-8-12-6 1 4 5 7 9 7M32 25c2-6 8-8 12-6-1 4-5 7-9 7" fill="#06D6A0" stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round" />
      <g fill="#FFF8E7">
        <circle cx="24" cy="36" r="2" />
        <circle cx="32" cy="44" r="2" />
        <circle cx="40" cy="36" r="2" />
        <circle cx="28" cy="50" r="2" />
        <circle cx="38" cy="50" r="2" />
      </g>
    </>
  );
}

function Anggur() {
  return (
    <>
      <path d="M32 16c0-4 3-7 7-8" fill="none" stroke={OUTLINE} strokeWidth="4" strokeLinecap="round" />
      <path d="M36 12c6-5 14-3 14-3s-3 10-11 9c-3-1-4-4-3-6Z" fill="#06D6A0" stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round" />
      <g fill="#8338EC" stroke={OUTLINE} strokeWidth="2.5">
        <circle cx="24" cy="28" r="8" />
        <circle cx="40" cy="28" r="8" />
        <circle cx="32" cy="38" r="8" />
        <circle cx="20" cy="42" r="7" />
        <circle cx="44" cy="42" r="7" />
        <circle cx="32" cy="52" r="7" />
      </g>
    </>
  );
}

function Semangka() {
  return (
    <>
      <path d="M6 44a26 26 0 0 1 52 0Z" fill="#06D6A0" stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M13 44a19 19 0 0 1 38 0Z" fill="#FFF8E7" stroke={OUTLINE} strokeWidth="2" />
      <path d="M16 44a16 16 0 0 1 32 0Z" fill="#EF476F" stroke={OUTLINE} strokeWidth="2" />
      <g fill={OUTLINE}>
        <ellipse cx="25" cy="38" rx="2" ry="3" />
        <ellipse cx="39" cy="38" rx="2" ry="3" />
        <ellipse cx="32" cy="41" rx="2" ry="3" />
      </g>
    </>
  );
}

export function FruitSvg({ fruit, className }: FruitSvgProps) {
  const shape = (() => {
    switch (fruit) {
      case 'pisang':
        return <Pisang />;
      case 'jeruk':
        return <Jeruk />;
      case 'stroberi':
        return <Stroberi />;
      case 'anggur':
        return <Anggur />;
      case 'semangka':
        return <Semangka />;
      case 'apel':
      default:
        return <Apel />;
    }
  })();

  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      {shape}
    </svg>
  );
}
