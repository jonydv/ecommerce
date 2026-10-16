import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // E3-00 · the boundaries of the front: shared/ is used by everyone and imports nobody;
  // a feature never imports a route; app/ composes features. Break one and `npm run lint` says so.
  {
    files: ["src/shared/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{ group: ["@/features/*", "@/app/*"], message: "shared/ can't depend on features/ or app/: move the code down, or pass it as a parameter." }] }],
    },
  },
  {
    files: ["src/features/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{ group: ["@/app/*"], message: "a feature can't import a route: move what you need into the feature, or into shared/." }] }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
