// The commit message standard. CONTRIBUTING.md describes it in words, and
// both the commit-msg hook and continuous integration hold every commit to it.
import { RuleConfigSeverity } from "@commitlint/types";
import type { UserConfig } from "@commitlint/types";

const ERROR = RuleConfigSeverity.Error;

export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      ERROR,
      "always",
      ["feat", "fix", "docs", "refactor", "ci", "chore", "build"],
    ],
    "scope-enum": [
      ERROR,
      "always",
      ["schema", "spec", "conformance", "tooling"],
    ],
    "header-max-length": [ERROR, "always", 72],
    "body-empty": [ERROR, "never"],
    "body-max-line-length": [ERROR, "always", 100],
    "footer-max-line-length": [ERROR, "always", 100],
    "signed-off-by": [ERROR, "always", "Signed-off-by:"],
  },
} satisfies UserConfig;
