import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/purity": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "coverage/**",
    "node_modules/**",
    "next-env.d.ts",
    "*.tsbuildinfo",
    ".fuse-backups/**",
    ".fuse-tools/**",
    "backups/**",
    "android/.gradle/**",
    "android/app/build/**",
    "android/app/src/main/assets/public/**",
    "ios/App/App/public/**",
    "ios/App/App.xcworkspace/**",
    "ios/App/Pods/**",
  ]),
]);

export default eslintConfig;
