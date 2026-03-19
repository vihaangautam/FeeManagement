/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        'bg-primary': '#0f1117',
        'bg-secondary': '#1a1d27',
        'bg-tertiary': '#242836',
        'border': '#2e3345',
        'border-light': '#3a3f52',
        'text-primary': '#e2e8f0',
        'text-secondary': '#94a3b8',
        'text-muted': '#64748b',
        'accent': '#10b981',
        'accent-hover': '#059669',
        'accent-light': 'rgba(16, 185, 129, 0.15)',
        'indigo': '#6366f1',
        'indigo-hover': '#4f46e5',
        'indigo-light': 'rgba(99, 102, 241, 0.15)',
        'danger': '#ef4444',
        'danger-hover': '#dc2626',
        'danger-light': 'rgba(239, 68, 68, 0.15)',
        'warning': '#f59e0b',
        'warning-light': 'rgba(245, 158, 11, 0.15)',
        'success': '#22c55e',
        'success-light': 'rgba(34, 197, 94, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'scale-in': 'scaleIn 0.2s ease forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
