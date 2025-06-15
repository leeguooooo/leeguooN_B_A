/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'tv': '1920px',
      },
      scale: {
        '102': '1.02',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          primary: "#3b82f6",
          secondary: "#8b5cf6",
          accent: "#10b981",
          neutral: "#1f2937",
          "base-100": "#111827",
          "base-200": "#1f2937",
          "base-300": "#374151",
        },
      },
      "light",
    ],
  },
}