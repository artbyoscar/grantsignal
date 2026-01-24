import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  {
    rules: {
      // Allow 'any' type in test files and certain service files
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unused vars with underscore prefix
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      // Allow unescaped entities in JSX
      "react/no-unescaped-entities": "warn",
      // Allow empty interfaces
      "@typescript-eslint/no-empty-object-type": "warn",
      // Allow let when const could be used
      "prefer-const": "warn",
      // Disable React Compiler rules (from react-hooks v7+)
      "react-compiler/react-compiler": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Allow Link elements
      "@next/next/no-html-link-for-pages": "warn",
    },
  },
];

export default eslintConfig;
