/** @type {import('tailwindcss').Config} */
const anthropicSlate = '#141413'
const anthropicSlateHover = '#3d3d3a'
const primaryScale = {
  50: '#faf9f5',
  100: '#f0eee6',
  200: '#e8e6dc',
  300: '#d1cfc5',
  400: '#87867f',
  500: anthropicSlate,
  600: anthropicSlate,
  700: anthropicSlateHover,
  800: anthropicSlate,
  900: anthropicSlate,
  950: '#0f0f0e'
}

// Warm neutral ramp — replaces stock cool gray/slate/zinc and de-purples
// indigo/violet/purple so the whole product reads as the warm Anthropic paper system.
const neutralRamp = {
  50: '#faf9f5',
  100: '#f0eee6',
  200: '#e8e6dc',
  300: '#d1cfc5',
  400: '#b0aea5',
  500: '#87867f',
  600: '#5e5d59',
  700: '#3d3d3a',
  800: '#141413',
  900: '#141413',
  950: '#0f0f0e'
}
// Semantic ramps anchored on the design-system tokens (success #6ea100,
// warning #d1a24a, error #bf4d43, info #6a9bcc) — low-saturation, not Ant defaults.
const successRamp = {
  50: '#f1f8e8',
  100: '#e4f1cf',
  200: '#c9dfaa',
  300: '#a9c97c',
  400: '#8bb544',
  500: '#6ea100',
  600: '#5c8600',
  700: '#496a00',
  800: '#374f08',
  900: '#26370c',
  950: '#141f04'
}
const warningRamp = {
  50: '#fff9ef',
  100: '#fdeecf',
  200: '#f6dca6',
  300: '#ecc06a',
  400: '#deac54',
  500: '#d1a24a',
  600: '#b9883a',
  700: '#956b2e',
  800: '#6f5023',
  900: '#4b371a',
  950: '#2a1f0f'
}
const errorRamp = {
  50: '#fff1f0',
  100: '#fbe0dd',
  200: '#f1c1bc',
  300: '#e39c95',
  400: '#d2756b',
  500: '#bf4d43',
  600: '#a53d35',
  700: '#852f29',
  800: '#62231f',
  900: '#411815',
  950: '#240c0a'
}
const infoRamp = {
  50: '#eef5fb',
  100: '#dbe9f5',
  200: '#bcd3ea',
  300: '#97badd',
  400: '#7fa6d4',
  500: '#6a9bcc',
  600: '#4f80b3',
  700: '#3f6790',
  800: '#324f6d',
  900: '#26384c',
  950: '#16202c'
}

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Anthropic system: primary actions are Slate, not accent color.
        primary: primaryScale,
        butter: '#d97757',
        dust: '#87867f',
        clay: '#d97757',
        accent: {
          50: '#faf9f5',
          100: '#f0eee6',
          200: '#e8e6dc',
          300: '#d1cfc5',
          400: '#b0aea5',
          500: '#87867f',
          600: '#5e5d59',
          700: '#3d3d3a',
          800: '#141413',
          900: '#141413',
          950: '#0f0f0e'
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
        },
        // Remap stock Tailwind palettes so legacy hardcoded utilities
        // (bg-amber-50, text-red-600, text-gray-500, …) resolve to the warm,
        // calm Anthropic system instead of Ant-like brights. Fixes the
        // half-migrated "messy color distribution" site-wide at the source.
        gray: neutralRamp,
        slate: neutralRamp,
        zinc: neutralRamp,
        neutral: neutralRamp,
        stone: neutralRamp,
        indigo: neutralRamp,
        violet: neutralRamp,
        purple: neutralRamp,
        emerald: successRamp,
        green: successRamp,
        lime: successRamp,
        teal: successRamp,
        amber: warningRamp,
        yellow: warningRamp,
        orange: warningRamp,
        red: errorRamp,
        rose: errorRamp,
        pink: errorRamp,
        sky: infoRamp,
        blue: infoRamp,
        cyan: infoRamp
      },
      fontFamily: {
        sans: [
          'Anthropic Sans',
          'Source Han Sans SC',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'PingFang SC',
          'Noto Sans CJK SC',
          'Microsoft YaHei',
          'system-ui',
          'sans-serif'
        ],
        serif: [
          'Anthropic Serif',
          'Source Han Serif SC',
          'Georgia',
          'Times New Roman',
          'Songti SC',
          'Noto Serif CJK SC',
          'SimSun',
          'serif'
        ],
        mono: [
          'Anthropic Mono',
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'monospace'
        ]
      },
      boxShadow: {
        surface: 'none',
        'surface-sm': 'none',
        glow: '0 4px 24px rgba(0, 0, 0, 0.05)',
        'glow-lg': '0 4px 24px rgba(0, 0, 0, 0.05)',
        card: 'none',
        'card-hover': 'none',
        'inner-glow': 'inset 0 0 0 1px rgba(20, 19, 19, 0.04)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #141413 0%, #3d3d3a 100%)',
        'gradient-dark': 'linear-gradient(135deg, #171512 0%, #050505 100%)',
        'gradient-paper':
          'linear-gradient(180deg, #faf9f5 0%, #f0eee6 100%)',
        'mesh-gradient':
          'linear-gradient(180deg, rgba(250,249,245,0.98), rgba(240,238,230,0.72))'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
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
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        glow: {
          '0%': { boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)' },
          '100%': { boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)' }
        }
      },
      borderRadius: {
        '4xl': '2rem'
      }
    }
  },
  plugins: []
}
