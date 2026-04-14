import type { Config } from 'tailwindcss';

/*
 * Design System — Dr. Osmanov
 * 8-point grid | 1 font | 3 colors | strict tokens
 */

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    /* ── Spacing: 8pt grid ── */
    spacing: {
      '0': '0px',
      '1': '4px',     // half-step (иконки)
      '2': '8px',     // xs
      '3': '12px',    // half-step (текст)
      '4': '16px',    // sm
      '5': '20px',    // half-step
      '6': '24px',    // md
      '8': '32px',    // lg
      '10': '40px',   // xl
      '12': '48px',   // 2xl
      '16': '64px',   // секции
      '20': '80px',
      '24': '96px',   // макс между секциями
    },
    /* ── Font ── */
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    },
    fontSize: {
      /* Body */
      'sm': ['14px', { lineHeight: '20px' }],
      'base': ['16px', { lineHeight: '24px' }],
      'lg': ['18px', { lineHeight: '28px' }],
      /* Headings */
      'h3': ['20px', { lineHeight: '28px', fontWeight: '600' }],
      'h2': ['28px', { lineHeight: '36px', fontWeight: '700' }],
      'h1': ['40px', { lineHeight: '48px', fontWeight: '800' }],
      /* Small */
      'xs': ['12px', { lineHeight: '16px' }],
      'caption': ['11px', { lineHeight: '14px' }],
    },
    borderRadius: {
      'none': '0',
      'sm': '8px',
      'md': '12px',
      'lg': '16px',
      'xl': '20px',
      'full': '9999px',
    },
    extend: {
      /* ── Colors: 3 roles ── */
      colors: {
        primary: {
          DEFAULT: '#C9A96E',
          hover: '#B8954F',
          light: '#F5EFE4',
          subtle: '#FAF7F2',
        },
        neutral: {
          0: '#FFFFFF',
          50: '#FAF8F5',       // page bg
          100: '#F2EDE6',      // card bg
          200: '#E0D8CE',      // border
          400: '#9E9189',      // muted text
          600: '#7A6A5A',      // secondary text
          900: '#2C2218',      // primary text
        },
        accent: {
          red: '#D14343',
          green: '#3D9A5F',
          blue: '#2A7DE1',
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(44,34,24,0.04)',
        'elevated': '0 4px 16px rgba(44,34,24,0.08)',
        'button': '0 4px 12px rgba(201,169,110,0.25)',
      },
      maxWidth: {
        'container': '430px',  // mobile-first max
      },
    },
  },
  plugins: [],
};
export default config;
