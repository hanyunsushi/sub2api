/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 主色调 - Dify-inspired blue violet
        primary: {
          50: '#f5f7ff',
          100: '#e5eaff',
          200: '#cfd9ff',
          300: '#b7c6ff',
          400: '#8aa1ff',
          500: '#5c7dff',
          600: '#4d6bfe',
          700: '#0033ff',
          800: '#002cd6',
          900: '#24386c',
          950: '#151b3f'
        },
        // 辅助色 - restrained lavender surface scale
        accent: {
          50: '#f8f9fb',
          100: '#f2f4ff',
          200: '#e5eaff',
          300: '#d8e0ff',
          400: '#b7c6ff',
          500: '#7589be',
          600: '#5365a3',
          700: '#3e4f8a',
          800: '#24386c',
          900: '#191f45',
          950: '#0d1028'
        },
        // 深色模式背景 - cool navy
        dark: {
          50: '#f8f9fb',
          100: '#edf0ff',
          200: '#c8d2ff',
          300: '#98a9f5',
          400: '#7589be',
          500: '#5365a3',
          600: '#3e4f8a',
          700: '#24386c',
          800: '#191f45',
          900: '#11152e',
          950: '#080b1d'
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
        glass: '0 14px 40px rgba(36, 56, 108, 0.09)',
        'glass-sm': '0 8px 22px rgba(36, 56, 108, 0.07)',
        glow: '0 10px 28px rgba(77, 107, 254, 0.18)',
        'glow-lg': '0 18px 44px rgba(92, 125, 255, 0.22)',
        card: '0 1px 2px rgba(36, 56, 108, 0.05), 0 8px 22px rgba(36, 56, 108, 0.055)',
        'card-hover': '0 16px 36px rgba(36, 56, 108, 0.1)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.35)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #0033ff 0%, #5c7dff 58%, #8aa1ff 100%)',
        'gradient-dark': 'linear-gradient(135deg, #191f45 0%, #080b1d 100%)',
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
          '0%': { boxShadow: '0 10px 28px rgba(77, 107, 254, 0.16)' },
          '100%': { boxShadow: '0 14px 34px rgba(92, 125, 255, 0.22)' }
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
