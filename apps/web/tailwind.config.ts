import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    fontFamily: {
      sans: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
    },
    fontSize: {
      'xs':      ['11px', { lineHeight: '16px', letterSpacing: '0.02em' }],
      'caption': ['12px', { lineHeight: '16px', letterSpacing: '0.01em' }],
      'sm':      ['14px', { lineHeight: '20px' }],
      'base':    ['15px', { lineHeight: '22px' }],
      'md':      ['16px', { lineHeight: '24px' }],
      'lg':      ['17px', { lineHeight: '26px' }],
      'h3':      ['20px', { lineHeight: '28px', fontWeight: '700' }],
      'h2':      ['26px', { lineHeight: '32px', fontWeight: '700', letterSpacing: '-0.01em' }],
      'h1':      ['34px', { lineHeight: '40px', fontWeight: '800', letterSpacing: '-0.02em' }],
    },
    borderRadius: {
      'none': '0',
      'sm':   '10px',
      'md':   '14px',
      'lg':   '18px',
      'xl':   '24px',
      'full': '9999px',
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: '#B69D74',
          dark:    '#9A8460',
          light:   '#EDE6D8',
          subtle:  '#F8F5F0',
          muted:   '#D4C5A9',
        },
        ink: {
          DEFAULT: '#1A1A1A',
          secondary: '#6B6B6B',
          tertiary:  '#999999',
          disabled:  '#C4C4C4',
        },
        bg: {
          DEFAULT: '#FAFAF8',
          card:    '#FFFFFF',
          elevated:'#FFFFFF',
        },
        line: {
          DEFAULT: 'rgba(0,0,0,0.06)',
          strong:  'rgba(0,0,0,0.10)',
        },
        status: {
          red:   '#CF4F4F',
          green: '#4CAF7D',
        },
      },
      spacing: {
        '18': '72px',
        '22': '88px',
      },
      boxShadow: {
        'soft':     '0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.03)',
        'card':     '0 2px 8px rgba(0,0,0,0.04), 0 0px 1px rgba(0,0,0,0.06)',
        'elevated': '0 4px 20px rgba(0,0,0,0.06), 0 0px 1px rgba(0,0,0,0.04)',
        'nav':      '0 -1px 0 rgba(0,0,0,0.03), 0 4px 24px rgba(0,0,0,0.08)',
        'button':   '0 4px 14px rgba(182,157,116,0.30)',
      },
      maxWidth: {
        'page': '430px',
      },
    },
  },
  plugins: [],
};
export default config;
