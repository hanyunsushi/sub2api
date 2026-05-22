/** @type {import('tailwindcss').Config} */
const kleinBlue = '#002FA7'
const kleinBlueScale = {
  50: '#f7f9ff',
  100: '#eef3ff',
  200: '#dce7ff',
  300: '#c6d8ff',
  400: kleinBlue,
  500: kleinBlue,
  600: kleinBlue,
  700: kleinBlue,
  800: kleinBlue,
  900: kleinBlue,
  950: kleinBlue
}

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 主色调 - Klein blue theme (IKB #002FA7)
        primary: kleinBlueScale,
        butter: '#c79a3a',
        dust: '#4f6a8c',
        // Treat legacy blue/indigo/purple/violet utility classes as Klein blue
        // so older component-local classes render on the same theme axis.
        blue: kleinBlueScale,
        indigo: kleinBlueScale,
        purple: kleinBlueScale,
        violet: kleinBlueScale,
        sky: kleinBlueScale,
        // 辅助色 - neutral and soft Klein-blue surfaces
        accent: {
          50: '#f3efe5',
          100: '#fffaf0',
          200: '#e9e1d2',
          300: '#d8cfbf',
          400: '#a79f91',
          500: '#70685c',
          600: '#5c554b',
          700: '#433e36',
          800: '#2a2721',
          900: '#171512',
          950: '#12100d'
        },
        // 深色模式背景
        dark: {
          50: '#f8f7f4',
          100: '#e9e1d2',
          200: '#c7bdab',
          300: '#9d9384',
          400: '#70685c',
          500: '#4f493f',
          600: '#2a2721',
          700: '#171512',
          800: '#11100d',
          900: '#0a0908',
          950: '#050505'
        }
      },
      fontFamily: {
        sans: [
          'Inter Tight',
          'Arial Narrow',
          'Helvetica Neue',
          'Arial',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'sans-serif'
        ],
        serif: ['Playfair Display', 'Iowan Old Style', 'Charter', 'Georgia', 'serif'],
        mono: ['SFMono-Regular', 'IBM Plex Mono', 'ui-monospace', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      boxShadow: {
        surface: '0 12px 28px -24px rgba(23, 21, 18, 0.36)',
        'surface-sm': '0 8px 18px -16px rgba(23, 21, 18, 0.28)',
        glow: '0 10px 28px rgba(0, 47, 167, 0.18)',
        'glow-lg': '0 18px 44px rgba(0, 47, 167, 0.22)',
        card: '0 1px 2px rgba(23, 21, 18, 0.05), 0 12px 28px -24px rgba(23, 21, 18, 0.36)',
        'card-hover': '0 16px 34px -24px rgba(23, 21, 18, 0.42)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.35)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #002FA7 0%, #002FA7 100%)',
        'gradient-dark': 'linear-gradient(135deg, #171512 0%, #050505 100%)',
        'gradient-paper':
          'linear-gradient(180deg, #fffaf0 0%, #f3efe5 100%)',
        'mesh-gradient':
          'linear-gradient(180deg, rgba(243,239,229,0.98), rgba(233,225,210,0.72))'
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
      borderRadius: {
        '4xl': '2rem'
      }
    }
  },
  plugins: []
}
