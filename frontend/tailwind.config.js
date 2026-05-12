/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 主色调 - Dify-inspired electric blue
        primary: {
          50: '#eef4ff',
          100: '#d9e8ff',
          200: '#b8d4ff',
          300: '#8bb8ff',
          400: '#5a90ff',
          500: '#155eef',
          600: '#004eeb',
          700: '#003ecc',
          800: '#00359e',
          900: '#102a56',
          950: '#071734'
        },
        // 辅助色 - cool blue-gray surface scale
        accent: {
          50: '#f7f9ff',
          100: '#edf2ff',
          200: '#dbe5ff',
          300: '#bfcef8',
          400: '#93a7e8',
          500: '#6678c7',
          600: '#5362a4',
          700: '#3f4b80',
          800: '#293255',
          900: '#171f39',
          950: '#0b1020'
        },
        // 深色模式背景 - cool navy
        dark: {
          50: '#f8fbff',
          100: '#eaf0ff',
          200: '#cbd8f5',
          300: '#9fb2da',
          400: '#7389bf',
          500: '#5065a3',
          600: '#34467c',
          700: '#202e57',
          800: '#151f3f',
          900: '#0d152d',
          950: '#070c1b'
        }
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'sans-serif'
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      boxShadow: {
        glass: '0 14px 40px rgba(21, 48, 111, 0.09)',
        'glass-sm': '0 8px 22px rgba(21, 48, 111, 0.07)',
        glow: '0 10px 28px rgba(21, 94, 239, 0.18)',
        'glow-lg': '0 18px 44px rgba(122, 90, 248, 0.22)',
        card: '0 1px 2px rgba(21, 48, 111, 0.05), 0 8px 22px rgba(21, 48, 111, 0.055)',
        'card-hover': '0 16px 36px rgba(21, 48, 111, 0.1)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.35)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #155eef 0%, #7a5af8 100%)',
        'gradient-dark': 'linear-gradient(135deg, #151f3f 0%, #070c1b 100%)',
        'gradient-glass':
          'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'mesh-gradient':
          'linear-gradient(180deg, rgba(247,249,255,0.98), rgba(237,242,255,0.72))'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s linear infinite',
        glow: 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        glow: {
          '0%': { boxShadow: '0 10px 28px rgba(21, 94, 239, 0.16)' },
          '100%': { boxShadow: '0 14px 34px rgba(122, 90, 248, 0.22)' }
        }
      },
      backdropBlur: {
        xs: '2px'
      },
      borderRadius: {
        '4xl': '2rem'
      }
    }
  },
  plugins: []
}
