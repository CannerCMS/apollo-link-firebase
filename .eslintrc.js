module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:flowtype/recommended"
  ],
  plugins: ["react", "flowtype", "jest"],
  env: {
    browser: true,
    jest: true,
    node: true,
    es6: true
  },
  rules: {
    "max-len": 0,
    "react/prop-types": 0,
    "no-implicit-coercion": 0
  },
  parser: "babel-eslint"
};
