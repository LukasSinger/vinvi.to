const plugin = require("tailwindcss/plugin");

module.exports = {
  content: ["public/pages/**/*.{html,js}", "public/partials/signup.ejs"],
  theme: {
    extend: {
      colors: {
        accent: "rgb(132 204 22)"
      },
      aspectRatio: {
        169: "9 / 13"
      },
      fontFamily: {
        titles: ["Righteous", "cursive"]
      }
    }
  },
  plugins: [require("@tailwindcss/line-clamp")]
};
