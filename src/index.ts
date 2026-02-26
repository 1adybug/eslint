import { createRequire } from "node:module"

import { ConfigWithExtends } from "@eslint/config-helpers"
import { RulesConfig } from "@eslint/core"
import js from "@eslint/js"
import { defineConfig, globalIgnores } from "eslint/config"
import globals from "globals"
import tseslint from "typescript-eslint"

const require = createRequire(import.meta.url)

function hasDependency(dependency: string) {
    try {
        require.resolve(dependency)
        return true
    } catch (error) {
        return false
    }
}

const hasNext = hasDependency("next")

const hasReact = hasNext || hasDependency("react")

const ignores = ["node_modules/**", "out/**", "build/**", "dist/**", "public/**"]

if (hasNext) ignores.push(".next/**", "next-env.d.ts")

const configWithExtends: ConfigWithExtends[] = [js.configs.recommended, ...tseslint.configs.recommended]

if (hasReact) {
    const reactHooks = require("eslint-plugin-react-hooks")
    const reactRefresh = require("eslint-plugin-react-refresh")
    configWithExtends.push(reactHooks.configs.flat.recommended, reactRefresh.default.configs.vite)
}

if (hasNext) {
    // 由于 Next.js 暂时不支持 ESLint 10 版本，所以暂时不使用
    // const nextVitals = require("eslint-config-next/core-web-vitals")
    // const nextTs = require("eslint-config-next/typescript")
    // configWithExtends.push(...nextVitals, ...nextTs)
}

const rules: RulesConfig = {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-empty-object-type": "off",
    "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
    "no-empty": "off",
    "no-extra-boolean-cast": "off",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
        "warn",
        {
            args: "none",
            caughtErrors: "none",
            ignoreRestSiblings: true,
        },
    ],
    "prefer-const": [
        "off",
        {
            destructuring: "any",
        },
    ],
}

if (hasReact) rules["react-refresh/only-export-components"] = "off"

const nextNodeFiles = ["shared/**/*.{js,mjs,ts,tsx}", "server/**/*.{js,mjs,ts,tsx}"]

const appConfig: ConfigWithExtends[] = []

if (!hasReact) {
    appConfig.push({
        files: ["**/*.{js,mjs,ts,tsx}"],
        languageOptions: {
            ecmaVersion: "latest",
            globals: globals.node,
        },
        rules,
    })
} else if (!hasNext) {
    appConfig.push({
        files: ["**/*.{js,mjs,ts,tsx}"],
        languageOptions: {
            ecmaVersion: "latest",
            globals: globals.browser,
        },
        rules,
    })
} else {
    appConfig.push(
        {
            files: ["**/*.{js,mjs,ts,tsx}"],
            ignores: nextNodeFiles,
            languageOptions: {
                ecmaVersion: "latest",
                globals: globals.browser,
            },
            rules,
        },
        {
            files: nextNodeFiles,
            languageOptions: {
                ecmaVersion: "latest",
                globals: globals.node,
            },
            rules,
        },
    )
}

export default defineConfig([globalIgnores(ignores), ...configWithExtends, ...appConfig])
