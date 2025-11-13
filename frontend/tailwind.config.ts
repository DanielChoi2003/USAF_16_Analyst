import type { Config } from 'tailwindcss'

/**
 * Tailwind CSS Configuration
 * 
 * Customized for Analyst Copilot with Air Force color palette.
 * Design system tokens for military-grade, professional UI.
 * 
 * Color Philosophy:
 * - Primary (Navy): Authority, trust, stability
 * - Accent (Blue): Action, interactivity
 * - Neutrals (Grays): Background, secondary text
 * - Semantic (Red/Amber/Green): Severity, warnings, success
 */

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ── Air Force Color Palette ───────────────────────────────────────────
      colors: {
        // Primary Navy (authority, trust)
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#0B2545',  // Primary dark anchor
          950: '#071a2f',
        },
        
        // Accent Blue (action, links, interactive elements)
        accent: {
          50: '#e6f2ff',
          100: '#bde0ff',
          200: '#8cceff',
          300: '#5abbff',
          400: '#29a9ff',
          500: '#0A63D8',  // Primary accent
          600: '#0854b3',
          700: '#06458f',
          800: '#04366b',
          900: '#022747',
        },
        
        // Neutral Grays (backgrounds, borders, secondary text)
        slate: {
          50: '#F7F9FB',   // Page background
          100: '#EDF2F7',
          200: '#E2E8F0',
          300: '#CBD5E0',
          400: '#A0AEC0',
          500: '#6B7280',  // Secondary text
          600: '#4A5568',
          700: '#2D3748',
          800: '#1A202C',
          900: '#0F1419',
        },
        
        // Semantic Colors
        success: {
          DEFAULT: '#2EAA60',  // Green
          light: '#48BB78',
          dark: '#22863A',
        },
        warning: {
          DEFAULT: '#F59E0B',  // Amber
          light: '#FCD34D',
          dark: '#D97706',
        },
        danger: {
          DEFAULT: '#D9534F',  // Red
          light: '#FC8181',
          dark: '#C53030',
        },
        info: {
          DEFAULT: '#0A63D8',  // Accent blue
          light: '#5abbff',
          dark: '#06458f',
        },
      },
      
      // ── Typography ────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['14px', { lineHeight: '24px' }],  // Body text
        'lg': ['16px', { lineHeight: '28px' }],
        'xl': ['18px', { lineHeight: '32px' }],    // H2
        '2xl': ['20px', { lineHeight: '36px' }],   // H1
        '3xl': ['24px', { lineHeight: '40px' }],
      },
      
      // ── Spacing & Layout ──────────────────────────────────────────────────
      spacing: {
        '18': '4.5rem',   // 72px (header height)
        '72': '18rem',    // 288px
        '84': '21rem',    // 336px (event column width)
        '90': '22.5rem',  // 360px (enrichment column width)
      },
      
      // ── Border Radius ─────────────────────────────────────────────────────
      borderRadius: {
        'sm': '4px',
        DEFAULT: '6px',    // Cards
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      
      // ── Shadows (subtle elevation) ────────────────────────────────────────
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        'header': '0 1px 0 0 rgba(0, 0, 0, 0.05)',
      },
      
      // ── Animation ─────────────────────────────────────────────────────────
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}

export default config
