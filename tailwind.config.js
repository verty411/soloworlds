/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['Source Serif Pro', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        paper:       'var(--color-paper)',
        ink:         'var(--color-ink)',
        muted:       'var(--color-muted)',
        accent:      'var(--color-accent)',
        accentLight: 'var(--color-accent-light)',
        border:      'var(--color-border)',
        card:        'var(--color-card)',
        codeBg:      'var(--color-code-bg)',
        surfaceDim:  'var(--color-surface-dim)',
      },
    },
  },
  plugins: [],
}
