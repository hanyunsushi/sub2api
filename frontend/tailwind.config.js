/** @type {import('tailwindcss').Config} */
const kleinBlueScale = {
  50: '#f3f6ff',
  100: '#e1e9ff',
  200: '#b8c9ff',
  300: '#8aa8ff',
  400: '#4f73e6',
  500: '#002FA7',
  600: '#002780',
  700: '#001f66',
  800: '#00184d',
  900: '#001133',
  950: '#00091f'
}

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 主色调 - Klein blue theme (IKB #002FA7)
        primary: kleinBlueScale,
        // Treat legacy blue/indigo/purple/violet utility classes as Klein blue
        // so older component-local classes render on the same theme axis.
        blue: kleinBlueScale,
        indigo: kleinBlueScale,
        purple: kleinBlueScale,
        violet: kleinBlueScale,
        sky: kleinBlueScale,
        // 辅助色 - neutral and soft Klein-blue surfaces
        accent: {
          50: '#f8f9fb',
          100: '#ffffff',
          200: '#e1e9ff',
          300: '#b8c9ff',
          400: '#8aa8ff',
          500: '#999999',
          600: '#666666',
          700: '#333333',
          800: '#191717',
          900: '#000000',
          950: '#000000'
        },
        // 深色模式背景
        dark: {
          50: '#f8f9fb',
          100: '#e1e9ff',
          200: '#b8c9ff',
          300: '#8aa8ff',
          400: '#666666',
          500: '#333333',
          600: '#24386c',
          700: '#191717',
          800: '#111111',
          900: '#080808',
          950: '#000000'
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
        glass: '0 14px 40px rgba(0, 47, 167, 0.08)',
        'glass-sm': '0 8px 22px rgba(0, 47, 167, 0.06)',
        glow: '0 10px 28px rgba(0, 47, 167, 0.18)',
        'glow-lg': '0 18px 44px rgba(0, 47, 167, 0.22)',
        card: '0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 22px rgba(0, 47, 167, 0.05)',
        'card-hover': '0 16px 36px rgba(0, 47, 167, 0.1)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.35)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #002FA7 0%, #0b46c5 58%, #8aa8ff 100%)',
        'gradient-dark': 'linear-gradient(135deg, #191717 0%, #000000 100%)',
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
          '0%': { boxShadow: '0 10px 28px rgba(0, 47, 167, 0.16)' },
          '100%': { boxShadow: '0 14px 34px rgba(0, 47, 167, 0.22)' }
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
