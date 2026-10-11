/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans Malayalam', 'system-ui', '-apple-system', 'sans-serif'],
        malayalam: ['Noto Sans Malayalam', 'sans-serif'],
      },
      fontSize: {
        // Rem-based scale anchored to 16.5px base (= 1rem)
        // Secondary text at least 13px (0.8125rem = 13.4px)
        'xs': ['0.8125rem', { lineHeight: '1.5' }],    // ~13.4px (Captions, secondary text)
        'sm': ['0.8875rem', { lineHeight: '1.5' }],    // ~14.65px (Badges, labels, compact items)
        'base': ['1rem', { lineHeight: '1.55' }],      // 16.5px (Body, paragraphs)
        'lg': ['1.125rem', { lineHeight: '1.55' }],    // ~18.56px (Large body, stems)
        'xl': ['1.25rem', { lineHeight: '1.5' }],      // ~20.6px
        '2xl': ['1.5rem', { lineHeight: '1.4' }],      // ~24.75px
        '3xl': ['1.875rem', { lineHeight: '1.3' }],    // ~30.9px (Section headings)
        '4xl': ['2.25rem', { lineHeight: '1.25' }],    // ~37.1px (Page titles)
        '5xl': ['2.75rem', { lineHeight: '1.2' }],     // ~45.4px
        '6xl': ['3.5rem', { lineHeight: '1.1' }],      // ~57.75px
      },
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        dark: {
          950: '#09090b',
          900: '#0a0a0a',
          850: '#121214',
          800: '#18181b',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'float': '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
}
