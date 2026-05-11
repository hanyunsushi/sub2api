/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 主色调 - Claude-style warm orange
        primary: {
          50: '#fff8f2',
          100: '#ffeadc',
          200: '#ffd2ba',
          300: '#ffb088',
          400: '#f38b5d',
          500: '#d97757',
          600: '#c15f3f',
          700: '#9f4b33',
          800: '#7f3f2e',
          900: '#563024',
          950: '#2b1712'
        },
        // 辅助色 - warm neutral
        accent: {
          50: '#faf8f5',
          100: '#f1ece5',
          200: '#e4d8cc',
          300: '#cdbbaa',
          400: '#ab9480',
          500: '#8b715f',
          600: '#71584a',
          700: '#5b473d',
          800: '#3f312b',
          900: '#2a211d',
          950: '#17110f'
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
        glass: '0 14px 40px rgba(86, 48, 36, 0.10)',
        'glass-sm': '0 8px 22px rgba(86, 48, 36, 0.08)',
        glow: '0 10px 28px rgba(217, 119, 87, 0.18)',
        'glow-lg': '0 18px 44px rgba(217, 119, 87, 0.22)',
        card: '0 1px 2px rgba(86, 48, 36, 0.05), 0 8px 22px rgba(86, 48, 36, 0.06)',
        'card-hover': '0 16px 36px rgba(86, 48, 36, 0.10)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #d97757 0%, #9f4b33 100%)',
        'gradient-dark': 'linear-gradient(135deg, #332621 0%, #120d0b 100%)',
        'gradient-glass':
          'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'mesh-gradient':
          'radial-gradient(at 28% 16%, rgba(217, 119, 87, 0.12) 0px, transparent 46%), radial-gradient(at 84% 0%, rgba(255, 176, 136, 0.10) 0px, transparent 44%), radial-gradient(at 4% 72%, rgba(159, 75, 51, 0.08) 0px, transparent 48%)'
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
          '0%': { boxShadow: '0 10px 28px rgba(217, 119, 87, 0.16)' },
          '100%': { boxShadow: '0 14px 34px rgba(217, 119, 87, 0.24)' }
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
