/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dce8ff',
          200: '#bdd3ff',
          300: '#90b4fd',
          400: '#6090fa',
          500: '#3d6ef5',
          600: '#2650ea',
          700: '#1d3dd6',
          800: '#1e34ad',
          900: '#1e3188',
        },
        dark: {
          900: '#0a0a0f',
          800: '#111118',
          700: '#1a1a27',
          600: '#222233',
        },
        // Stitch Sonic Singularity theme colors
        'sonic-lime': '#D7FF5A',
        'prism-violet': '#8B5CF6',
        'neon-cyan': '#00F5FF',
        'deep-obsidian': '#080808',
        'obsidian-deep': '#050505',
        'surface-dim': '#131313',
        'surface-bright': '#393939',
        'surface-container-lowest': '#0e0e0e',
        'surface-container-low': '#1c1b1b',
        'surface-container': '#20201f',
        'surface-container-high': '#2a2a2a',
        'surface-container-highest': '#353535',
        'on-surface': '#e5e2e1',
        'on-surface-variant': '#c4c7c7',
        'outline-variant': '#444748',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
        
        // Semantic and mapping aliases
        primary: '#c9c6c5',
        secondary: '#ffffff',
        tertiary: '#dcb8ff',
        'secondary-fixed': '#c3f400',
        'secondary-fixed-dim': '#abd600',
        'on-secondary-fixed': '#161e00',
        'primary-container': '#080808',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        headline: ['Hanken Grotesk', 'sans-serif'],
        body: ['Hanken Grotesk', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

