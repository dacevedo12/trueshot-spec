// The commit message standard. CONTRIBUTING.md describes it in words, and
// both the commit-msg hook and continuous integration hold every commit to it.
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "refactor", "ci", "chore", "build"],
    ],
    "scope-enum": [2, "always", ["schema", "spec", "conformance", "tooling"]],
    "header-max-length": [2, "always", 72],
    "body-empty": [2, "never"],
    "body-max-line-length": [2, "always", 100],
    "footer-max-line-length": [2, "always", 100],
    "signed-off-by": [2, "always", "Signed-off-by:"],
  },
};
