const path = require("path");

module.exports = {
  mode: "production",
  entry: "./src/index.js",
  output: {
    filename: "rapicom-bundle.js",
    path: path.resolve(__dirname, "dist"),
    library: "RapicomBundle",
    libraryTarget: "umd",
    globalObject: "this",
  },
};