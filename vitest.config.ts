/// <reference types="vitest" />

import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test.setup.ts'],
    coverage: {
      provider: 'v8',

      // Qué archivos medir (SOLO código de producción)
      include: ['src/app/**/*.ts'],

      // Qué EXCLUIR (lo que baja los números artificialmente)
      exclude: [
        'src/app/**/*.spec.ts',
        'src/app/**/*.mock.ts',
        'src/app/**/*.d.ts',
        'src/app/core/models/**',
        'src/app/**/index.ts',
        'src/app/app.routes.ts',
        'src/app/app.constants.ts',
        'src/test.setup.ts',
        'src/app/**/*/routes.ts',
        'src/app/core/interceptors/handlers/**',
        'src/app/core/models/**',
        'src/app/**/*.config.ts',
        'src/app/environments/**',
        'src/app/infra/mocks/**',
        'src/app/core/models/**',
        'src/app/core/models/dtos/**',
        'src/app/environments/**',
        'src/app/infra/mocks/**',
        'src/app/app.config.ts',
        'src/app/**/comensal.routes.ts',
        'src/app/**/*.routes.ts',
        'src/app/assets/**',
      ],

      // Formatos de reporte
      reporter: ['text', 'html'],

      // HTML para revisar archivo por archivo
      reportsDirectory: 'coverage',

      //Son porcentajes minimos para que el CI pase

      //importante que lo mantengamos en un 70 aprox
      thresholds: {
        statements: 40, // Estás en 36.35%,
        branches: 14, // Estás en 14.46%,
        functions: 25, // Estás en 25.69%,
        lines: 37, // Estás en 37.09%,
      },
    },
  },
});
