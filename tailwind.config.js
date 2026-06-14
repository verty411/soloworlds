/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Source Serif Pro', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        paper: '#FBF9F6',
        ink: '#2B2A28',
        muted: '#8A8580',
        accent: '#5B6F5B',
        accentLight: '#E7ECE5',
        border: '#E5E0D9',
        card: '#FFFFFF',
      },
    },
  },
  plugins: [],
}
