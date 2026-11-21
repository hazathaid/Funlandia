/** @type {import('tailwindcss').Config} */
// Token warna/radius/spacing di sini adalah cermin dari src/design/tokens.css.
// Kalau salah satu diubah, ubah keduanya (scripts/check-contrast.mjs menjaga kontras).
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Preflight sengaja dimatikan: app sudah punya reset sendiri di src/styles.css
  // (layar F1/F2 sudah diuji ke anak — jangan sampai berubah tanpa playtest).
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        krem: '#FFF8E7',
        madu: '#FFB703',
        mint: '#06D6A0',
        pink: '#EF476F',
        biru: '#118AB2',
        navy: '#2B2D42',
        // Varian "kuat": aman dipakai sebagai latar teks putih / teks di atas krem (>= 4.5:1).
        'pink-kuat': '#C1123F',
        'biru-kuat': '#0E6E8F',
        'mint-kuat': '#0B7A5C',
        'pink-lembut': '#FFEAF0',
        'mint-lembut': '#E9FBF4',
        'madu-lembut': '#FFF3D6',
        'biru-lembut': '#E7F6FB',
        kertas: '#FFFFFF',
        'kertas-tua': '#FFFDF6',
        'krem-tua': '#F1EFE6',
        garis: '#D8D4C4',
        'garis-lembut': '#E3DFD0',
        'teks-lembut': '#5C6079',
      },
      borderRadius: {
        kecil: '12px',
        kartu: '24px',
        besar: '32px',
        pil: '999px',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
      },
      fontFamily: {
        display: ['"Baloo 2"', 'Nunito', 'system-ui', 'sans-serif'],
        body: ['Nunito', '"Baloo 2"', 'system-ui', 'sans-serif'],
      },
      minHeight: {
        tap: '64px',
      },
      maxWidth: {
        layar: '980px',
      },
    },
  },
  plugins: [],
};
