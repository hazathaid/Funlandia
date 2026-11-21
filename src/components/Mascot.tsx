/**
 * Kiko si rubah — maskot sekaligus "guru".
 * Ekspresi berubah sesuai konteks: idle, senang (benar), mikir (salah), tidur (penutup).
 * Animasi hanya dipicu satu kali, tidak ada gerakan berulang tanpa henti.
 */
export type MascotMood = 'idle' | 'happy' | 'thinking' | 'sleep';

const OUTLINE = '#2B2D42';

export interface MascotProps {
  mood?: MascotMood;
  className?: string;
}

export function Mascot({ mood = 'idle', className }: MascotProps) {
  const eyes =
    mood === 'happy' ? (
      <g fill="none" stroke={OUTLINE} strokeWidth="3.5" strokeLinecap="round">
        <path d="M31 40c2-4 7-4 9 0M52 40c2-4 7-4 9 0" />
      </g>
    ) : mood === 'sleep' ? (
      <g fill="none" stroke={OUTLINE} strokeWidth="3.5" strokeLinecap="round">
        <path d="M31 41c2 3 7 3 9 0M52 41c2 3 7 3 9 0" />
      </g>
    ) : (
      <g fill={OUTLINE}>
        <circle cx="36" cy="39" r="3.6" />
        <circle cx="57" cy="39" r="3.6" />
      </g>
    );

  return (
    <svg className={className} viewBox="0 0 96 96" aria-hidden="true" focusable="false">
      {/* ekor */}
      <path
        d="M78 74c10 2 16-6 14-14-8 1-13 6-14 14Z"
        fill="#F98A3C"
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* telinga */}
      <path d="M22 34 16 8l22 12Z" fill="#F98A3C" stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M74 34 80 8 58 20Z" fill="#F98A3C" stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M23 26l-3-11 10 6Z" fill="#EF476F" />
      <path d="M73 26l3-11-10 6Z" fill="#EF476F" />
      {/* wajah */}
      <ellipse cx="48" cy="44" rx="30" ry="26" fill="#F98A3C" stroke={OUTLINE} strokeWidth="3.5" />
      <path
        d="M48 70c-14 0-22-6-22-6 0-10 10-16 22-16s22 6 22 16c0 0-8 6-22 6Z"
        fill="#FFF8E7"
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {eyes}
      <path d="M45 54h6l-3 5Z" fill={OUTLINE} />
      {mood === 'happy' ? (
        <path d="M42 60c3 6 9 6 12 0" fill="none" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
      ) : mood === 'thinking' ? (
        <path d="M44 62c2-2 6-2 8 0" fill="none" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
      ) : (
        <path d="M44 61c2 3 6 3 8 0" fill="none" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
      )}
      {/* pipi */}
      <circle cx="26" cy="52" r="4" fill="#EF476F" opacity="0.45" />
      <circle cx="70" cy="52" r="4" fill="#EF476F" opacity="0.45" />
      {mood === 'sleep' ? (
        <text x="78" y="26" fontSize="14" fill={OUTLINE} fontFamily="inherit">
          z
        </text>
      ) : null}
    </svg>
  );
}
