import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#C9A96E',
          dark: '#A8855A',
          light: '#E8D5B0',
        },
        background: '#FAF8F5',
        surface: '#F2EDE6',
        border: '#E0D8CE',
        text: {
          DEFAULT: '#2C2218',
          secondary: '#7A6A5A',
        },
        success: '#6BAF8D',
        error: '#C96E6E',
        warning: '#D4A84B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(44,34,24,0.06)',
        'card-hover': '0 8px 32px rgba(44,34,24,0.10)',
        bottom: '0 -1px 0 #E0D8CE',
      },
      animation: {
        'slide-up': 'slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
export default config;
