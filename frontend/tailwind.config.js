/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 主色调 - Claude-inspired restrained coral orange
        primary: {
          50: '#faf9f5',
          100: '#f0eee7',
          200: '#e2dbcf',
          300: '#d5c5b4',
          400: '#d49a80',
          500: '#cc785c',
          600: '#b96850',
          700: '#9f5642',
          800: '#7e4436',
          900: '#583128',
          950: '#2b1712'
        },
        // 辅助色 - warm neutral
        accent: {
          50: '#faf9f5',
          100: '#f4f1ea',
          200: '#e5dfd3',
          300: '#cfc6b8',
          400: '#aaa092',
          500: '#80786e',
          600: '#6f6b63',
          700: '#4c4943',
          800: '#2f2d29',
          900: '#1d1c19',
          950: '#141413'
        },
        // 深色模式背景 - warm charcoal
        dark: {
          50: '#faf7f2',
          100: '#efe6dc',
          200: '#d6c5b7',
          300: '#c8b5a5',
          400: '#b59f8e',
          500: '#a68f7d',
          600: '#6f5548',
          700: '#49352e',
          800: '#332621',
          900: '#211a17',
          950: '#120d0b'
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
        glass: '0 14px 40px rgba(20, 20, 19, 0.09)',
        'glass-sm': '0 8px 22px rgba(20, 20, 19, 0.07)',
        glow: '0 10px 28px rgba(204, 120, 92, 0.18)',
        'glow-lg': '0 18px 44px rgba(204, 120, 92, 0.22)',
        card: '0 1px 2px rgba(20, 20, 19, 0.05), 0 8px 22px rgba(20, 20, 19, 0.055)',
        'card-hover': '0 16px 36px rgba(20, 20, 19, 0.09)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.35)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #cc785c 0%, #9f5642 100%)',
        'gradient-dark': 'linear-gradient(135deg, #332621 0%, #120d0b 100%)',
        'gradient-glass':
          'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'mesh-gradient':
          'linear-gradient(180deg, rgba(250,249,245,0.98), rgba(244,241,234,0.72))'
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
          '0%': { boxShadow: '0 10px 28px rgba(204, 120, 92, 0.16)' },
          '100%': { boxShadow: '0 14px 34px rgba(204, 120, 92, 0.24)' }
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
