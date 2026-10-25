import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import unusedImports from "eslint-plugin-unused-imports";

const internalPatterns = [
  {
    group: ["@/features/*/_internal", "@/features/*/_internal/*", "@/features/*/_internal/**"],
    message: "ห้าม import _internal ของ feature — ใช้ '@/features/<name>', '/server' หรือ '/actions'",
  },
];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "next-env.d.ts", "src/generated/**", "**/*.d.ts", "e2e/**", "playwright.config.ts", "tests/**"]),
  {
    files: ["src/**/*.{ts,tsx}", "prisma/**/*.ts", "scripts/**/*.ts"],
    plugins: { "unused-imports": unusedImports },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": ["warn", { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_", ignoreRestSiblings: true }],
      "react/no-unescaped-entities": "off",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/error-boundaries": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/features/**"],
    rules: { "no-restricted-imports": ["error", { patterns: internalPatterns }] },
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", { patterns: internalPatterns }] },
  },
  {
    files: ["src/**/*.ts"],
    ignores: ["src/**/*.test.ts", "src/shared/lib/infra/logger.ts"],
    rules: { "no-console": "warn" },
  },
]);
