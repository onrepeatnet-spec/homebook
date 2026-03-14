/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: '#F5F2EE',
        surface: '#FDFBF8',
        border: '#E8E2DA',
        'border-dark': '#C9BFB3',
        text: { DEFAULT: '#1C1814', 2: '#6B5F53', 3: '#A89C92' },
        accent: { DEFAULT: '#C17B4E', light: '#F0E4D7', dark: '#8B4F28' },
        sage: '#4A7C6F',
      },
    },
  },
  plugins: [],
};
