// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    ignores: [
      '.data/**',
      '.nuxt-typecheck/**',
      'dist/**',
      'playwright-report/**',
      'test-results/**'
    ],
    rules: {
      'vue/no-multiple-template-root': 'off',
      'vue/max-attributes-per-line': ['error', { singleline: 3 }],
      '@stylistic/max-statements-per-line': 'off'
    }
  },
  {
    name: 'tunables-site/app-boundary',
    files: ['app/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['#server/**', '~/server/**', '~~/server/**', '../**/server/**'],
          message: 'App code must consume client-safe code from shared/, never server implementations.'
        }]
      }]
    }
  },
  {
    name: 'tunables-site/shared-boundary',
    files: ['shared/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['#app/**', '#server/**', '~/app/**', '~/server/**', '~~/app/**', '~~/server/**', '../**/app/**', '../**/server/**'],
          message: 'Shared code must remain safe for both browser and server bundles.'
        }]
      }]
    }
  }
)
