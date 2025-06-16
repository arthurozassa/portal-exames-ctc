import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Ambiente de teste
    environment: 'jsdom',
    
    // Arquivos de setup
    setupFiles: ['./tests/setup.js'],
    
    // Padrões de arquivos de teste
    include: [
      'tests/**/*.test.{js,jsx,ts,tsx}',
      'tests/**/*.spec.{js,jsx,ts,tsx}',
      'src/**/*.test.{js,jsx,ts,tsx}',
      'src/**/*.spec.{js,jsx,ts,tsx}'
    ],
    
    // Arquivos a serem ignorados
    exclude: [
      'node_modules',
      'dist',
      'build',
      'coverage'
    ],
    
    // Configurações de cobertura
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'src/**/*.test.{js,jsx,ts,tsx}',
        'src/**/*.spec.{js,jsx,ts,tsx}',
        'src/main.jsx',
        'src/vite-env.d.ts',
        'src/**/*.d.ts'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    
    // Timeout para testes
    testTimeout: 10000,
    
    // Configurações de relatório
    reporter: ['verbose'],
    
    // Mock de recursos estáticos
    assets: {
      include: ['**/*.{png,jpg,jpeg,gif,svg}']
    },
    
    // Configurações globais
    globals: true,
    
    // Configurações de mock
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
  },
  
  // Resolver aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/context': path.resolve(__dirname, './src/context'),
      '@/assets': path.resolve(__dirname, './src/assets')
    }
  }
})