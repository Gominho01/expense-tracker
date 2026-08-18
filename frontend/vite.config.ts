/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Sem testes escritos ainda (fase 0) — remover quando os primeiros testes forem adicionados.
    passWithNoTests: true,
  },
})
