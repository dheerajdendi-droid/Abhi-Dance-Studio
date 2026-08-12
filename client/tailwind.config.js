/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        plum: {
          50: "#F5EEF3",
          100: "#E5D0DE",
          400: "#8A4A73",
          600: "#5C2A4E",
          700: "#4A2140",
          800: "#3D1F3E",
          900: "#2C1530",
        },
        coral: {
          400: "#FF9466",
          500: "#FF7A45",
          600: "#F4622C",
        },
        marigold: {
          400: "#F7BB5C",
          500: "#F4A63D",
          600: "#E08F22",
        },
        cream: {
          50: "#FBF6F0",
          100: "#F5EBDD",
        },
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
