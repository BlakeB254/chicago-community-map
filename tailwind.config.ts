import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // Golden Ratio based spacing system
      spacing: {
        'phi-1': '2px',   // Fibonacci
        'phi-2': '3px',
        'phi-3': '5px',
        'phi-4': '8px',
        'phi-5': '13px',
        'phi-6': '21px',
        'phi-7': '34px',
        'phi-8': '55px',
        'phi-9': '89px',
        'phi-10': '144px',
        'phi-11': '233px',
        'phi-12': '377px', // Sidebar width
        'phi-13': '610px', // Container width
      },
      // Golden ratio proportions
      width: {
        'sidebar': '377px', // 610 / 1.618
        'container-gr': '610px',
        'container-lg': '1000px',
        'container-xl': '1618px',
      },
      height: {
        'header': '55px',
        'map-ratio': 'calc(100vw / 1.618)',
      },
      // Typography scale based on golden ratio
      fontSize: {
        'phi-xs': ['10px', '16px'],
        'phi-sm': ['12px', '20px'],
        'phi-base': ['16px', '26px'],
        'phi-lg': ['20px', '32px'],
        'phi-xl': ['26px', '42px'],
        'phi-2xl': ['32px', '52px'],
        'phi-3xl': ['42px', '68px'],
        'phi-4xl': ['52px', '84px'],
      },
      colors: {
        // Chicago themed colors
        chicago: {
          blue: '#003f7f',
          red: '#c8102e',
          gold: '#ffd100',
          green: '#009639',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;