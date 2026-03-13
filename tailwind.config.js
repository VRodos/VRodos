/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: 'tw-',
  important: '.vrodos-manager-wrapper',
  content: [
    "./includes/**/*.php",
    "./js_libs/**/*.js",
    "./VRodos.php"
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("daisyui")
  ],
  daisyui: {
    themes: ["light", "dark", "cupcake", "emerald"],
    prefix: "d-", // daisyUI class prefix
  },
}
