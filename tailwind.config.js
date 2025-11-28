/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './services/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter var"', 'Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        brand: {
          600: '#2563eb',
          700: '#1d4ed8'
        }
      },
      animation: {
        blob: 'blob 14s infinite',
        pulsefast: 'pulsefast 2s infinite'
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -30px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' }
        },
        pulsefast: {
          '0%, 100%': { opacity: 0.4 },
          '50%': { opacity: 1 }
        }
      }
    }
  },
  plugins: []
};

