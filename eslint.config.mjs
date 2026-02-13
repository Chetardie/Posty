import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "warn",
      "react/jsx-no-target-blank": "error",
    },
  },
  eslintConfigPrettier,
]);

export default eslintConfig;
