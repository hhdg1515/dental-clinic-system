/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        md: '1.5rem',
        lg: '2rem'
      }
    },
    extend: {
      colors: {
        // New Clinical Luxury Theme
        primary: {
          DEFAULT: '#0d9488',
          dark: '#0f766e',
          light: '#14b8a6',
          50: '#f0fdfa',
          100: '#ccfbf1'
        },
        accent: {
          DEFAULT: '#d97706',
          light: '#f59e0b'
        },
        // Admin theme colors (legacy compatibility)
        admin: {
          primary: '#0d9488',
          primaryDark: '#0f766e',
          primaryLight: '#14b8a6',
          secondary: '#64748b',
          success: '#059669',
          warning: '#d97706',
          danger: '#dc2626',
          info: '#0284c7'
        },
        // Dental chart colors
        dental: {
          healthy: '#059669',
          monitor: '#d97706',
          decay: '#ea580c',
          filled: '#0284c7',
          missing: '#64748b',
          implant: '#7c3aed',
          rootCanal: '#dc2626',
          postOp: '#db2777'
        },
        surface: {
          base: '#fafaf9',
          muted: '#f5f5f4',
          white: '#ffffff',
          dark: '#0f172a',
          card: 'rgba(255, 255, 255, 0.7)'
        },
        neutral: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',
          100: '#f1f5f9'
        }
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        sans: ['"DM Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
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
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px'
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0, 0, 0, 0.04)',
        sm: '0 2px 4px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        md: '0 4px 12px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.04)',
        lg: '0 12px 40px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)',
        xl: '0 24px 60px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.06)',
        glow: '0 0 40px rgba(13, 148, 136, 0.35)',
        'glow-accent': '0 0 30px rgba(217, 119, 6, 0.25)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.1)',
        card: '0 4px 20px rgba(0, 0, 0, 0.08)'
      },
      backdropBlur: {
        glass: '20px',
        modal: '40px'
      },
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '400ms'
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-expo': 'cubic-bezier(0.87, 0, 0.13, 1)'
      },
      animation: {
        fadeIn: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        slideUp: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        slideIn: 'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        scaleIn: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        float: 'float 20s ease-in-out infinite',
        shimmer: 'shimmer 1.5s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' }
        },
        float: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -30px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
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
