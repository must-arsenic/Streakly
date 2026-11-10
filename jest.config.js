// Unit tests with jest-expo; JUnit for the engine at reports/jest.xml.
module.exports = {
  preset: "jest-expo",
  testMatch: ["**/src/**/*.test.ts?(x)"],
  reporters: ["default", ["jest-junit", { outputDirectory: "reports", outputName: "jest.xml", titleTemplate: "{title}", classNameTemplate: "{classname}" }]],
};
