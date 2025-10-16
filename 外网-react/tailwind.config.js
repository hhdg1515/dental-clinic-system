/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './docs/**/*.{md,mdx}'
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem'
      }
    },
    extend: {
      colors: {
        brand: {
          primary: '#2569E9',
          primaryDark: '#1a59bf',
          primaryLight: '#4284f5'
        },
        accent: {
          green: '#2ecc71'
        },
        surface: {
          base: '#F8F9FA',
          muted: '#f8f9fa',
          white: '#ffffff'
        },
        neutral: {
          900: '#333333',
          700: '#495057',
          500: '#6c757d',
          400: '#666666'
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'var(--font-system)', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
        system: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif'
        ]
      },
      spacing: {
        xs: '0.5rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem'
      },
      borderRadius: {
        md: '8px',
        lg: '12px',
        xl: '20px'
      },
      boxShadow: {
        elevationSm: '0 2px 4px rgba(0, 0, 0, 0.1)',
        elevationMd: '0 4px 8px rgba(0, 0, 0, 0.15)',
        elevationLg: '0 8px 16px rgba(0, 0, 0, 0.2)',
        text: '0 2px 4px rgba(0, 0, 0, 0.3)'
      },
      transitionDuration: {
        fast: '200ms',
        normal: '300ms',
        slow: '500ms'
      }
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1440px'
    }
  },
  plugins: []
};
