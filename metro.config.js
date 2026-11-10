// Metro, with SQLite's web build (a .wasm file) bundled for the web export.
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push("wasm");
module.exports = config;
