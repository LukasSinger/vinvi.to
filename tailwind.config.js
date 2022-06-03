const plugin = require("tailwindcss/plugin");

module.exports = {
  content: ["public/pages/**/*.{html,js}", "public/partials/signup.ejs", "public/partials/advertisement.ejs", "public/partials/login.ejs", "public/partials/topbar.ejs", "public/partials/storyTile.ejs", "public/partials/settings.ejs", "public/partials/loggedInSidebar.ejs", "public/partials/loggedOutSidebar.ejs"],
  theme: {
    extend: {
      colors: {
        accent: "rgb(132 204 22)"
      },
      aspectRatio: {
        169: "9 / 13",
        102: "10 / 2"
      },
      fontFamily: {
        titles: ["Righteous", "cursive"]
      }
    }
  },
  plugins: [require("@tailwindcss/line-clamp")]
};
