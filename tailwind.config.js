/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,vue,svelte}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'rgb(var(--bg-primary) / <alpha-value>)',
          secondary: 'rgb(var(--bg-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--bg-tertiary) / <alpha-value>)',
          card: 'rgb(var(--bg-card) / <alpha-value>)',
          modal: 'rgb(var(--bg-modal) / <alpha-value>)',
          hover: 'rgb(var(--bg-hover) / <alpha-value>)',
          accent: 'rgb(var(--bg-accent) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--text-tertiary) / <alpha-value>)',
          inverse: 'rgb(var(--text-inverse) / <alpha-value>)',
        },
        border: {
          primary: 'rgb(var(--border-primary) / <alpha-value>)',
          secondary: 'rgb(var(--border-secondary) / <alpha-value>)',
          hover: 'rgb(var(--border-hover) / <alpha-value>)',
        },
      },
    },
  },
};
