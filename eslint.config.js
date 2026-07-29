import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores([
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/android/**',
    'pnpm-lock.yaml',
  ]),
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ['packages/core/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              message: '@pillify/core must stay framework-free.',
            },
            {
              name: 'react-dom',
              message: '@pillify/core must stay framework-free.',
            },
            {
              name: 'dexie',
              message: 'Persistência fica nos adapters de apps/web.',
            },
          ],
          patterns: [
            {
              group: ['@capacitor', '@capacitor/*'],
              message: 'Capacitor fica nos adapters de apps/web.',
            },
            {
              group: ['../../*', '../../../*'],
              message: '@pillify/core não pode importar fora do pacote.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        {
          name: 'window',
          message: 'DOM globals are forbidden in @pillify/core.',
        },
        {
          name: 'document',
          message: 'DOM globals are forbidden in @pillify/core.',
        },
        {
          name: 'localStorage',
          message: 'Storage goes through StoragePort.',
        },
        {
          name: 'navigator',
          message: 'Platform APIs stay in apps/web adapters.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'Use ClockPort.now() instead of new Date().',
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'Use ClockPort.now() instead of Date.now().',
        },
      ],
    },
  },
);
