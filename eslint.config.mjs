import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-plugin-prettier/recommended";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default tseslint.config(
  ...compat.config({
    extends: ["next/core-web-vitals"],
  }),
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  prettierConfig,
);
