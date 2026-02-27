/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#ff8200',
          'orange-hover': '#e67400',
          'orange-light': '#ff9a2e',
          cream: '#ffead5',
          black: '#000000',
          grey: '#d1d5db',
          'grey-light': '#f3f4f6',
        }
      }
    },
  },
  plugins: [],
}
