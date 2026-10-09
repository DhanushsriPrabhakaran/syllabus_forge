/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tce: {
          maroon: '#7B1113',
          maroonDark: '#560B0D',
          maroonLight: '#94191C',
          navy: '#0F2942',
          navyDark: '#091A2A',
          navyLight: '#1B3E60',
          gold: '#C59B27',
          goldLight: '#E2BF53',
          goldDark: '#9C7A1D',
          cream: '#FAF7F2',
          surface: '#F4EFEA',
        },
        brand: {
          50: '#FAF2F3',
          100: '#F5E4E5',
          500: '#94191C',
          600: '#7B1113',
          700: '#560B0D',
          800: '#3D0709',
          900: '#260405',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        tce: ['Montserrat', 'Roboto', 'sans-serif'],
        doc: ['Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
