const path = require("path");

module.exports = {
  mode: "production",
  entry: {
    "rapicom-vendor": "./src/vendor/index.js",
    "rapicom-app": "./src/app/index.js",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  optimization: {
    minimize: true,
  },
};