import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    // Global settings
    ignores: ['node_modules', 'dist', 'build'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  // JavaScript base config
  js.configs.recommended,
  // Prettier config
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': 'off',
    },
  },
  // React config
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/prop-types': 'off', // TypeScript handles prop types
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // TypeScript config
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        projectService: './tsconfig.json',
      },
    },
    rules: {
      ...typescriptEslintPlugin.configs['recommended'].rules,
      ...typescriptEslintPlugin.configs['recommended-requiring-type-checking']
        .rules,
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // General rules for all files
  {
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'off', // Handled by TypeScript
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
];
