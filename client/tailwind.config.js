/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        secondary: "#0F172A",
        bg: "#F8FAFC",
        success: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444",
      },
    },
  },
  plugins: [],
};