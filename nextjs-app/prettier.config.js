const styleguide = require("@vercel/style-guide/prettier");

module.exports = {
  ...styleguide,
  singleQuote: false,
  printWidth: 100,
  plugins: [...styleguide.plugins, "prettier-plugin-tailwindcss"],
};
